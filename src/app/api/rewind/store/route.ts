import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAnalysisError } from "@/lib/logAnalysisError";
import type { RewindSummary } from "@/lib/rewind";
import { sanitizeRewindForStorage } from "@/lib/rewindSanitize";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v: unknown) => typeof v === "string");

const isEvidencePointer = (value: unknown) => {
  if (!isRecord(value)) return false;
  const record = value as Record<string, unknown>;
  const sessionId = record.sessionId;
  const msgId = record.msgId;
  return (
    (sessionId === undefined || isNullableString(sessionId)) &&
    (msgId === undefined || isNullableString(msgId)) &&
    isNullableString(value.conversationId) &&
    isNullableString(value.startDay) &&
    isNullableString(value.endDay) &&
    isStringArray(value.snippets)
  );
};

const isEvidenceBundle = (value: unknown) => {
  if (!isRecord(value)) return false;
  if (!isStringArray(value.sessionIds)) return false;
  const nearMiss = (value as Record<string, unknown>).nearMissSessionIds;
  if (nearMiss !== undefined && !isStringArray(nearMiss)) return false;
  return Array.isArray(value.pointers) && value.pointers.every(isEvidencePointer);
};

const isSessionLite = (value: unknown) => {
  if (!isRecord(value)) return false;
  const signals = value.signals;
  return (
    typeof value.sessionId === "string" &&
    isNullableString(value.month) &&
    typeof value.ending === "string" &&
    typeof value.intent === "string" &&
    typeof value.domain === "string" &&
    isFiniteNumber(value.userMessages) &&
    isFiniteNumber(value.promptCharsTotal) &&
    typeof value.openerFingerprint === "string" &&
    isRecord(signals) &&
    isFiniteNumber(signals.indecision) &&
    isFiniteNumber(signals.perfection) &&
    isFiniteNumber(signals.friction) &&
    isFiniteNumber(signals.reassurance)
  );
};

const isCoverage = (value: unknown) => {
  if (!isRecord(value)) return false;
  return typeof value.sinceMonth === "string" && typeof value.untilMonth === "string" && typeof value.timezone === "string";
};

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
    isNullableString(value.conversationId) &&
    isNullableString(value.topicKey) &&
    isNullableString(value.themeKey) &&
    isNullableString(value.month) &&
    isNullableString(value.startDay) &&
    isNullableString(value.endDay) &&
    typeof value.oneLineSummary === "string" &&
    isStringArray(value.evidenceSnippets) &&
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
    typeof value.comeback === "boolean" &&
    typeof value.hasBroken === "boolean" &&
    typeof value.hasWtf === "boolean" &&
    typeof value.hasAgainStill === "boolean" &&
    typeof value.hasQuickIntro === "boolean"
  );
};

const isProjectSummary = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    typeof value.projectLabel === "string" &&
    isNullableString(value.projectLabelPrivate) &&
    typeof value.whatYouBuilt === "string" &&
    isNullableString(value.whatYouBuiltPrivate) &&
    Array.isArray(value.stack) &&
    value.stack.every((t: unknown) => typeof t === "string") &&
    Array.isArray(value.monthsActive) &&
    value.monthsActive.every((t: unknown) => typeof t === "string") &&
    isNullableString(value.range) &&
    isFiniteNumber(value.chats) &&
    isFiniteNumber(value.prompts) &&
    typeof value.intensity === "string" &&
    typeof value.statusGuess === "string" &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidencePointer)
  );
};

const isBossFight = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    typeof value.title === "string" &&
    isFiniteNumber(value.chats) &&
    isNullableString(value.peak) &&
    isNullableString(value.during) &&
    typeof value.example === "string" &&
    typeof value.intensityLine === "string" &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidencePointer)
  );
};

const isRabbitHole = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    typeof value.title === "string" &&
    typeof value.range === "string" &&
    isFiniteNumber(value.chats) &&
    isFiniteNumber(value.days) &&
    typeof value.why === "string" &&
    isNullableString(value.excerpt) &&
    isEvidenceBundle(value.evidence)
  );
};

const isLifeHighlight = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    typeof value.type === "string" &&
    isNullableString(value.month) &&
    typeof value.title === "string" &&
    isNullableString(value.titlePrivate) &&
    typeof value.line === "string" &&
    isFiniteNumber(value.confidence) &&
    typeof value.level === "string" &&
    isNullableString(value.excerpt) &&
    isEvidenceBundle(value.evidence)
  );
};

const isBestMoment = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    typeof value.title === "string" &&
    isNullableString(value.month) &&
    typeof value.line === "string" &&
    isNullableString(value.excerpt) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidencePointer)
  );
};

const isGrowthUpgrade = (value: unknown) => {
  if (!isRecord(value)) return false;
  return typeof value.title === "string" && typeof value.line === "string" && isNullableString(value.delta);
};

const isWrapped = (value: unknown) => {
  if (!isRecord(value)) return false;
  const archetype = value.archetype;
  const hook = value.hook;
  const timeline = value.timeline;
  const trips = value.trips;

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

  const isTrip =
    isRecord(trips) &&
    isFiniteNumber(trips.tripCount) &&
    Array.isArray(trips.topTrips) &&
    trips.topTrips.every((t: unknown) => {
      if (!isRecord(t)) return false;
      return (
        typeof t.key === "string" &&
        isNullableString(t.month) &&
        isNullableString(t.range) &&
        isNullableString(t.destination) &&
        typeof t.title === "string" &&
        isNullableString(t.titlePrivate) &&
        typeof t.line === "string" &&
        isFiniteNumber(t.confidence) &&
        typeof t.level === "string" &&
        isNullableString(t.excerpt) &&
        Array.isArray(t.evidence) &&
        t.evidence.every(isEvidencePointer)
      );
    });

  return (
    isArchetype &&
    isHook &&
    Array.isArray(value.projects) &&
    value.projects.every(isProjectSummary) &&
    Array.isArray(value.bossFights) &&
    value.bossFights.every(isBossFight) &&
    isTrip &&
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
    Array.isArray(value.rabbitHoles) &&
    value.rabbitHoles.every(isRabbitHole) &&
    Array.isArray(value.lifeHighlights) &&
    value.lifeHighlights.every(isLifeHighlight) &&
    Array.isArray(value.bestMoments) &&
    value.bestMoments.every(isBestMoment) &&
    Array.isArray(value.growthUpgrades) &&
    value.growthUpgrades.every(isGrowthUpgrade) &&
    Array.isArray(value.youVsYou) &&
    value.youVsYou.every((l: unknown) => typeof l === "string") &&
    Array.isArray(value.forecast) &&
    value.forecast.every((l: unknown) => typeof l === "string") &&
    typeof value.closingLine === "string"
  );
};

const isRewindSummary = (value: unknown): value is RewindSummary => {
  if (!isRecord(value)) return false;

  return (
    isCoverage(value.coverage) &&
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
    (value.sessionsLite === undefined ||
      (Array.isArray(value.sessionsLite) && value.sessionsLite.every(isSessionLite))) &&
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
    const sanitizedRewind = sanitizeRewindForStorage(rewind);

    let rewindId: string | null = null;
    try {
      const dbRewind = await prisma.yearSummary.create({
        data: {
          clientId,
          year,
          summaryJson: sanitizedRewind as unknown as Prisma.InputJsonValue,
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
