import { Unzip } from "fflate";
import { createRewindAnalyzer } from "./rewind";
import type { RewindSummary } from "./rewind";

export type RewindClientPhase = "reading" | "unzipping" | "parsing" | "done";

export interface RewindClientProgress {
  phase: RewindClientPhase;
  bytesRead: number;
  totalBytes: number;
  conversationsProcessed: number;
}

class AsyncByteQueue {
  private queue: Uint8Array[] = [];
  private resolvers: Array<(value: IteratorResult<Uint8Array>) => void> = [];
  private closed = false;
  private error: unknown = null;

  push(chunk: Uint8Array) {
    if (this.closed || this.error) return;
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver({ value: chunk, done: false });
      return;
    }
    this.queue.push(chunk);
  }

  close() {
    if (this.closed || this.error) return;
    this.closed = true;
    while (this.resolvers.length) {
      const resolver = this.resolvers.shift();
      if (resolver) resolver({ value: undefined as unknown as Uint8Array, done: true });
    }
  }

  fail(error: unknown) {
    if (this.closed || this.error) return;
    this.error = error;
    while (this.resolvers.length) {
      const resolver = this.resolvers.shift();
      if (resolver) resolver(Promise.reject(error) as unknown as IteratorResult<Uint8Array>);
    }
  }

  async *iterate(): AsyncGenerator<Uint8Array> {
    while (true) {
      if (this.error) throw this.error;
      const next = this.queue.shift();
      if (next) {
        yield next;
        continue;
      }
      if (this.closed) return;
      const chunk = await new Promise<IteratorResult<Uint8Array>>((resolve) => this.resolvers.push(resolve));
      if (chunk.done) return;
      yield chunk.value;
    }
  }
}

const readWebStream = async function* (stream: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
};

const parseJsonArrayStream = async (
  bytes: AsyncIterable<Uint8Array>,
  onItem: (item: unknown) => void,
  onProgress: (progress: { conversationsProcessed: number }) => void,
) => {
  const decoder = new TextDecoder("utf-8");
  let arrayStarted = false;
  let inString = false;
  let escape = false;
  let depth = 0;
  let buffer = "";
  let conversationsProcessed = 0;

  const maybeYield = async () => {
    if (conversationsProcessed % 25 === 0) {
      onProgress({ conversationsProcessed });
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  };

  const processText = async (text: string) => {
    for (let i = 0; i < text.length; i++) {
      const c = text[i];

      if (!arrayStarted) {
        if (c === "[") arrayStarted = true;
        continue;
      }

      if (depth === 0) {
        if (c === "{") {
          depth = 1;
          buffer = "{";
          inString = false;
          escape = false;
        }
        continue;
      }

      buffer += c;

      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (c === "\\") {
          escape = true;
          continue;
        }
        if (c === "\"") {
          inString = false;
          continue;
        }
        continue;
      }

      if (c === "\"") {
        inString = true;
        continue;
      }
      if (c === "{") {
        depth += 1;
        continue;
      }
      if (c === "}") {
        depth -= 1;
        if (depth === 0) {
          const obj = JSON.parse(buffer) as unknown;
          buffer = "";
          conversationsProcessed += 1;
          onItem(obj);
          await maybeYield();
        }
      }
    }
  };

  for await (const chunk of bytes) {
    const text = decoder.decode(chunk, { stream: true });
    if (text) await processText(text);
  }
  const flush = decoder.decode();
  if (flush) await processText(flush);

  onProgress({ conversationsProcessed });
};

const conversationsJsonBytesFromZip = async (
  file: File,
  onProgress: (progress: { bytesRead: number }) => void,
): Promise<AsyncIterable<Uint8Array>> => {
  const queue = new AsyncByteQueue();
  let bytesRead = 0;
  let found = false;
  let resolved = false;

  const unzip = new Unzip((entry) => {
    const name = (entry.name || "").toLowerCase();
    const isTarget = name.endsWith("conversations.json");
    if (isTarget) found = true;

    entry.ondata = (err, data, final) => {
      if (err) {
        queue.fail(err);
        return;
      }
      if (isTarget && data && data.length) {
        queue.push(data);
      }
      if (isTarget && final && !resolved) {
        resolved = true;
        queue.close();
      }
    };
  });

  for await (const chunk of readWebStream(file.stream())) {
    bytesRead += chunk.byteLength;
    onProgress({ bytesRead });
    unzip.push(chunk, false);
  }
  unzip.push(new Uint8Array(), true);

  if (!found) {
    queue.fail(new Error("conversations.json not found in ZIP"));
  }

  return queue.iterate();
};

export async function analyzeRewindFileClient(
  file: File,
  onProgress?: (progress: RewindClientProgress) => void,
): Promise<RewindSummary> {
  const totalBytes = file.size || 0;
  let bytesRead = 0;
  let conversationsProcessed = 0;

  const report = (phase: RewindClientPhase) => {
    onProgress?.({ phase, bytesRead, totalBytes, conversationsProcessed });
  };

  const analyzer = createRewindAnalyzer();

  const addConversation = (item: unknown) => analyzer.addConversation(item);

  const updateConversations = (p: { conversationsProcessed: number }) => {
    conversationsProcessed = p.conversationsProcessed;
    report("parsing");
  };

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".zip")) {
    report("unzipping");
    const bytes = await conversationsJsonBytesFromZip(file, (p) => {
      bytesRead = p.bytesRead;
      report("unzipping");
    });
    await parseJsonArrayStream(bytes, addConversation, updateConversations);
  } else if (lowerName.endsWith(".json")) {
    report("reading");
    const bytes = (async function* () {
      for await (const chunk of readWebStream(file.stream())) {
        bytesRead += chunk.byteLength;
        report("reading");
        yield chunk;
      }
    })();
    await parseJsonArrayStream(bytes, addConversation, updateConversations);
  } else {
    throw new Error("Unsupported file type");
  }

  report("done");
  return analyzer.summary();
}

