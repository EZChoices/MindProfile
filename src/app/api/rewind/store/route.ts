import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAnalysisError } from "@/lib/logAnalysisError";
import type { RewindSummary } from "@/lib/rewind";

const isRewindSummary = (value: unknown): value is RewindSummary => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.totalConversations === "number" && typeof record.totalUserMessages === "number";
};

export async function POST(request: Request) {
  let clientId: string | null = null;
  try {
    const payload = (await request.json()) as { clientId?: unknown; rewind?: unknown; year?: unknown };
    clientId = typeof payload.clientId === "string" && payload.clientId.trim().length ? payload.clientId.trim() : null;
    const rewind = payload.rewind;

    if (!isRewindSummary(rewind)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const year = typeof payload.year === "number" && Number.isFinite(payload.year) ? payload.year : new Date().getFullYear();

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
        meta: { stack: error instanceof Error ? error.stack : String(error) },
      });
    }

    return NextResponse.json({ rewindId });
  } catch (error) {
    console.error("Rewind store endpoint failed", error);
    await logAnalysisError({
      clientId,
      sourceMode: "full_history",
      errorCode: "rewind_store_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      meta: { stack: error instanceof Error ? error.stack : String(error) },
    });
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}

