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
    isFiniteNumber(value.realQuickCount) &&
    isFiniteNumber(value.simpleQuestionCount) &&
    isFiniteNumber(value.brokenCount) &&
    isFiniteNumber(value.whyBrokenCount) &&
    isFiniteNumber(value.doesntWorkCount) &&
    isFiniteNumber(value.wtfCount) &&
    isFiniteNumber(value.spicyWordCount) &&
    isFiniteNumber(value.swearCount) &&
    isFiniteNumber(value.yellingMessageCount) &&
    isFiniteNumber(value.whiplashChatCount) &&
    isFiniteNumber(value.rageMessageCount) &&
    isFiniteNumber(value.questionBurstMessageCount) &&
    isFiniteNumber(value.exclaimBurstMessageCount) &&
    isFiniteNumber(value.againCount) &&
    isFiniteNumber(value.stillCount) &&
    isFiniteNumber(value.quickQuestionChatCount) &&
    isFiniteNumber(value.quickQuestionChatAvgPrompts)
  );
};

const isConversationSummary = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    isNullableString(value.topicKey) &&
    isNullableString(value.themeKey) &&
    isNullableString(value.month) &&
    typeof value.oneLineSummary === "string" &&
    isFiniteNumber(value.userMessages) &&
    isFiniteNumber(value.avgPromptChars) &&
    isFiniteNumber(value.maxPromptChars) &&
    isNullableNumber(value.durationMins) &&
    typeof value.intent === "string" &&
    typeof value.deliverable === "string" &&
    typeof value.mood === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((t: unknown) => typeof t === "string") &&
    Array.isArray(value.stack) &&
    value.stack.every((t: unknown) => typeof t === "string") &&
    isFiniteNumber(value.winSignals) &&
    isFiniteNumber(value.frictionSignals) &&
    isFiniteNumber(value.indecisionSignals) &&
    typeof value.comeback === "boolean"
  );
};

const isProjectSummary = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.projectLabel === "string" &&
    typeof value.whatYouBuilt === "string" &&
    Array.isArray(value.stack) &&
    value.stack.every((t: unknown) => typeof t === "string") &&
    Array.isArray(value.monthsActive) &&
    value.monthsActive.every((t: unknown) => typeof t === "string") &&
    isFiniteNumber(value.chats) &&
    isFiniteNumber(value.prompts) &&
    typeof value.intensity === "string" &&
    typeof value.statusGuess === "string"
  );
};

const isBossFight = (value: unknown) => {
  if (!isRecord(value)) return false;
  return typeof value.title === "string" && isFiniteNumber(value.count) && typeof value.example === "string";
};

const isWrapped = (value: unknown) => {
  if (!isRecord(value)) return false;
  const archetype = value.archetype;
  const hook = value.hook;
  const timeline = value.timeline;

  const isArchetype =
    isRecord(archetype) &&
    typeof archetype.key === "string" &&
    typeof archetype.title === "string" &&
    typeof archetype.line === "string";

  const isHook =
    isRecord(hook) &&
    typeof hook.identity === "string" &&
    typeof hook.brag === "string" &&
    typeof hook.roast === "string";

  const isTimeline =
    isRecord(timeline) &&
    Array.isArray(timeline.flowMonths) &&
    timeline.flowMonths.every((m: unknown) => typeof m === "string") &&
    Array.isArray(timeline.frictionMonths) &&
    timeline.frictionMonths.every((m: unknown) => typeof m === "string") &&
    isNullableString(timeline.villainMonth) &&
    isNullableNumber(timeline.longestStreakDays) &&
    isNullableString(timeline.mostIndecisiveMonth) &&
    isNullableString(timeline.mostActiveWeek) &&
    isNullableString(timeline.mostChaoticWeek);

  return (
    isArchetype &&
    isHook &&
    Array.isArray(value.projects) &&
    value.projects.every(isProjectSummary) &&
    Array.isArray(value.bossFights) &&
    value.bossFights.every(isBossFight) &&
    Array.isArray(value.wins) &&
    value.wins.every(
      (w: unknown) =>
        isRecord(w) && typeof w.title === "string" && isFiniteNumber(w.count),
    ) &&
    (value.comebackMoment === null ||
      (isRecord(value.comebackMoment) &&
        typeof value.comebackMoment.title === "string" &&
        typeof value.comebackMoment.detail === "string")) &&
    isTimeline &&
    (value.weirdRabbitHole === null ||
      (isRecord(value.weirdRabbitHole) &&
        typeof value.weirdRabbitHole.title === "string" &&
        typeof value.weirdRabbitHole.detail === "string")) &&
    Array.isArray(value.forecast) &&
    value.forecast.every((l: unknown) => typeof l === "string") &&
    typeof value.closingLine === "string"
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
    Array.isArray(value.nicknames) &&
    value.nicknames.every(isPhraseInsight) &&
    isNullableNumber(value.longestPromptChars) &&
    isNullableNumber(value.avgPromptChars) &&
    isNullableNumber(value.promptLengthChangePercent) &&
    isBehavior(value.behavior) &&
    Array.isArray(value.conversations) &&
    value.conversations.every(isConversationSummary) &&
    isWrapped(value.wrapped)
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
