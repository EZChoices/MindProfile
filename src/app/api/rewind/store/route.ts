import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAnalysisError } from "@/lib/logAnalysisError";
import type { RewindSummary } from "@/lib/rewind";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isPhraseInsight = (value: unknown) => {
  if (!isRecord(value)) return false;
  return typeof value.phrase === "string" && isFiniteNumber(value.count);
};

const isTopTopic = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    typeof value.label === "string" &&
    typeof value.emoji === "string" &&
    isFiniteNumber(value.count)
  );
};

const isBehavior = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.pleaseCount) &&
    isFiniteNumber(value.thankYouCount) &&
    isFiniteNumber(value.sorryCount) &&
    isFiniteNumber(value.canYouCount) &&
    isFiniteNumber(value.stepByStepCount) &&
    isFiniteNumber(value.quickQuestionCount) &&
    isFiniteNumber(value.brokenCount) &&
    isFiniteNumber(value.wtfCount) &&
    isFiniteNumber(value.spicyWordCount) &&
    isFiniteNumber(value.yellingMessageCount) &&
    isFiniteNumber(value.whiplashChatCount)
  );
};

const isRewindSummary = (value: unknown): value is RewindSummary => {
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.totalConversations) &&
    isFiniteNumber(value.totalUserMessages) &&
    isFiniteNumber(value.activeDays) &&
    isNullableString(value.busiestMonth) &&
    isNullableNumber(value.peakHour) &&
    isFiniteNumber(value.lateNightPercent) &&
    Array.isArray(value.topTopics) &&
    value.topTopics.every(isTopTopic) &&
    (value.topWord === null || typeof value.topWord === "string") &&
    Array.isArray(value.frequentPhrases) &&
    value.frequentPhrases.every(isPhraseInsight) &&
    isNullableNumber(value.longestPromptChars) &&
    isNullableNumber(value.avgPromptChars) &&
    isNullableNumber(value.promptLengthChangePercent) &&
    isBehavior(value.behavior)
  );
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
