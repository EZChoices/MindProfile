import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Busboy from "busboy";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import parseOne from "unzipper/lib/parseOne";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import { prisma } from "@/lib/prisma";
import { createRewindAnalyzer } from "@/lib/rewind";
import type { RewindSummary } from "@/lib/rewind";
import { logAnalysisError } from "@/lib/logAnalysisError";

export const runtime = "nodejs";

const streamJsonArray = async (
  jsonStream: NodeJS.ReadableStream,
  onItem: (item: unknown) => void,
) => {
  const pipeline = jsonStream.pipe(parser()).pipe(streamArray());
  for await (const chunk of pipeline) {
    if (chunk && typeof chunk === "object" && "value" in chunk) {
      onItem((chunk as { value: unknown }).value);
    }
  }
};

const analyzeJsonStream = async (jsonStream: NodeJS.ReadableStream) => {
  const analyzer = createRewindAnalyzer();
  await streamJsonArray(jsonStream, (item) => analyzer.addConversation(item));
  return analyzer.summary();
};

const analyzeZipStream = async (zipStream: NodeJS.ReadableStream) => {
  const jsonStream = zipStream.pipe(parseOne(/conversations\.json$/i));
  return analyzeJsonStream(jsonStream);
};

export async function POST(request: Request) {
  let clientId: string | null = null;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const body = request.body;
    if (!body) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    let sawFile = false;
    let filename: string | null = null;
    let mimeType: string | null = null;

    const bb = Busboy({
      headers: { "content-type": contentType },
      limits: { files: 1, fields: 10 },
    });

    bb.on("field", (name, value) => {
      if (name === "clientId" && typeof value === "string") {
        const trimmed = value.trim();
        clientId = trimmed.length ? trimmed : null;
      }
    });

    bb.on("file", (name, fileStream, info) => {
      if (name !== "file") {
        fileStream.resume();
        return;
      }
      if (sawFile) {
        fileStream.resume();
        return;
      }
      sawFile = true;
      filename = info.filename;
      mimeType = info.mimeType;

      const lowerName = (info.filename || "").toLowerCase();
      const lowerType = (info.mimeType || "").toLowerCase();

      void (async () => {
        try {
          if (lowerName.endsWith(".zip") || lowerType.includes("zip")) {
            const rewind = await analyzeZipStream(fileStream);
            (bb as unknown as { emit: (event: string, ...args: unknown[]) => void }).emit(
              "__rewind_result__",
              rewind,
            );
            return;
          }
          if (lowerName.endsWith(".json") || lowerType.includes("json") || !lowerType) {
            const rewind = await analyzeJsonStream(fileStream);
            (bb as unknown as { emit: (event: string, ...args: unknown[]) => void }).emit(
              "__rewind_result__",
              rewind,
            );
            return;
          }
          fileStream.resume();
          throw new Error("Unsupported file type");
        } catch (error) {
          (bb as unknown as { emit: (event: string, ...args: unknown[]) => void }).emit("__rewind_error__", error);
        }
      })();
    });

    const rewindPromise = new Promise<RewindSummary>((resolve, reject) => {
      (bb as unknown as NodeJS.EventEmitter).once("__rewind_result__", (rewind: RewindSummary) => {
        resolve(rewind);
      });
      (bb as unknown as NodeJS.EventEmitter).once("__rewind_error__", (error: unknown) => {
        reject(error);
      });
      (bb as unknown as NodeJS.EventEmitter).once("finish", () => {
        if (!sawFile) {
          reject(new Error("No file provided"));
        }
      });
      (bb as unknown as NodeJS.EventEmitter).once("error", (error: unknown) => {
        reject(error);
      });
    });

    const busboyDone = finished(bb);
    const nodeStream = Readable.fromWeb(body as any);
    nodeStream.pipe(bb);

    const [, rewind] = await Promise.all([busboyDone, rewindPromise]);

    if (rewind.totalConversations === 0 || rewind.totalUserMessages === 0) {
      return NextResponse.json({ error: "no_data" }, { status: 400 });
    }

    const year = new Date().getFullYear();

    let rewindId: string | null = null;
    try {
      const dbRewind = await prisma.yearSummary.create({
        data: {
          clientId,
          year,
          summaryJson: rewind as unknown as Prisma.InputJsonValue,
        },
      });
      rewindId = dbRewind.id;
    } catch (error) {
      console.warn("Failed to persist YearSummary", error);
      await logAnalysisError({
        clientId,
        sourceMode: "full_history",
        errorCode: "rewind_store_failed",
        message: error instanceof Error ? error.message : "Unknown error",
        meta: {
          stack: error instanceof Error ? error.stack : String(error),
          filename,
          mimeType,
        },
      });
    }

    return NextResponse.json({ rewind, rewindId });
  } catch (error) {
    console.error("Rewind endpoint failed", error);
    await logAnalysisError({
      clientId,
      sourceMode: "full_history",
      errorCode: "rewind_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      meta: { stack: error instanceof Error ? error.stack : String(error) },
    });
    const message = error instanceof Error ? error.message : "";
    if (message === "No file provided") {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }
    if (message === "Missing conversations.json") {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }
    if (message === "Unsupported file type") {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }
    if (message === "PATTERN_NOT_FOUND") {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
