import { Unzip, UnzipInflate } from "fflate";
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
  private drainWaiters: Array<{ maxBytes: number; resolve: () => void }> = [];
  private closed = false;
  private error: unknown = null;
  private queuedBytes = 0;

  push(chunk: Uint8Array) {
    if (this.closed || this.error) return;
    const resolver = this.resolvers.shift();
    if (resolver) {
      resolver({ value: chunk, done: false });
      return;
    }
    this.queuedBytes += chunk.byteLength;
    this.queue.push(chunk);
  }

  close() {
    if (this.closed || this.error) return;
    this.closed = true;
    while (this.resolvers.length) {
      const resolver = this.resolvers.shift();
      if (resolver) resolver({ value: undefined as unknown as Uint8Array, done: true });
    }
    this.flushDrainWaiters();
  }

  fail(error: unknown) {
    if (this.closed || this.error) return;
    this.error = error;
    while (this.resolvers.length) {
      const resolver = this.resolvers.shift();
      if (resolver) resolver({ value: undefined as unknown as Uint8Array, done: true });
    }
    this.flushDrainWaiters();
  }

  waitForBelow(maxBytes: number) {
    if (this.closed || this.error) return Promise.resolve();
    if (this.queuedBytes <= maxBytes) return Promise.resolve();
    return new Promise<void>((resolve) => this.drainWaiters.push({ maxBytes, resolve }));
  }

  private flushDrainWaiters() {
    if (!this.drainWaiters.length) return;
    const waiters = this.drainWaiters;
    this.drainWaiters = [];
    waiters.forEach((w) => w.resolve());
  }

  private notifyDrain() {
    if (!this.drainWaiters.length) return;
    const remaining: typeof this.drainWaiters = [];
    for (const waiter of this.drainWaiters) {
      if (this.queuedBytes <= waiter.maxBytes) {
        waiter.resolve();
      } else {
        remaining.push(waiter);
      }
    }
    this.drainWaiters = remaining;
  }

  async *iterate(): AsyncGenerator<Uint8Array> {
    while (true) {
      if (this.error) throw this.error;
      const next = this.queue.shift();
      if (next) {
        this.queuedBytes = Math.max(0, this.queuedBytes - next.byteLength);
        this.notifyDrain();
        yield next;
        continue;
      }
      if (this.closed) return;
      const chunk = await new Promise<IteratorResult<Uint8Array>>((resolve) => this.resolvers.push(resolve));
      if (this.error) throw this.error;
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
    if (conversationsProcessed <= 10 || conversationsProcessed % 25 === 0) {
      onProgress({ conversationsProcessed });
      if (conversationsProcessed % 25 === 0) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }
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

const conversationsJsonBytesFromZip = (
  file: File,
  onProgress: (progress: { bytesRead: number }) => void,
): AsyncIterable<Uint8Array> => {
  const queue = new AsyncByteQueue();
  let bytesRead = 0;
  let found = false;
  let resolved = false;
  let doneEarly = false;
  let targetBytes = 0;

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
        targetBytes += data.length;
        queue.push(data);
      }
      if (isTarget && final && !resolved) {
        resolved = true;
        doneEarly = true;
        queue.close();
      }
    };

    if (isTarget) {
      try {
        entry.start();
      } catch (error) {
        queue.fail(error);
      }
    }
  });
  unzip.register(UnzipInflate);

  void (async () => {
    try {
      const reader = file.stream().getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          bytesRead += value.byteLength;
          onProgress({ bytesRead });
          unzip.push(value, false);
          if (doneEarly) {
            await reader.cancel();
            break;
          }
          await queue.waitForBelow(16 * 1024 * 1024);
        }
      } finally {
        reader.releaseLock();
      }

      if (!doneEarly) {
        unzip.push(new Uint8Array(), true);
      }

      if (!found) {
        queue.fail(new Error("conversations.json not found in ZIP"));
        return;
      }

      if (!resolved) {
        // Some ZIPs don't emit `final` reliably; if we received bytes, close the stream and let parsing decide.
        if (targetBytes > 0) {
          queue.close();
          return;
        }
        queue.fail(new Error("conversations.json could not be read"));
      }
    } catch (error) {
      queue.fail(error);
    }
  })();

  return queue.iterate();
};

export async function analyzeRewindFileClient(
  file: File,
  onProgress?: (progress: RewindClientProgress) => void,
): Promise<RewindSummary> {
  const totalBytes = file.size || 0;
  let bytesRead = 0;
  let conversationsProcessed = 0;
  let phase: RewindClientPhase = "reading";

  const report = () => {
    onProgress?.({ phase, bytesRead, totalBytes, conversationsProcessed });
  };

  const analyzer = createRewindAnalyzer();

  const addConversation = (item: unknown) => analyzer.addConversation(item);

  const updateConversations = (p: { conversationsProcessed: number }) => {
    conversationsProcessed = p.conversationsProcessed;
    if ((phase === "unzipping" || phase === "reading") && conversationsProcessed > 0) {
      phase = "parsing";
    }
    report();
  };

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".zip")) {
    phase = "unzipping";
    report();
    const bytes = conversationsJsonBytesFromZip(file, (p) => {
      bytesRead = p.bytesRead;
      if (phase === "unzipping" && totalBytes > 0 && bytesRead >= totalBytes) {
        phase = "parsing";
      }
      report();
    });
    await parseJsonArrayStream(bytes, addConversation, updateConversations);
  } else if (lowerName.endsWith(".json")) {
    phase = "reading";
    report();
    const bytes = (async function* () {
      for await (const chunk of readWebStream(file.stream())) {
        bytesRead += chunk.byteLength;
        report();
        yield chunk;
      }
    })();
    await parseJsonArrayStream(bytes, addConversation, updateConversations);
  } else {
    throw new Error("Unsupported file type");
  }

  phase = "done";
  report();
  return analyzer.summary();
}
