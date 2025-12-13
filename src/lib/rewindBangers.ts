import type { PhraseInsight, RewindSummary } from "./rewind";

export type SpiceLevel = "mild" | "spicy" | "savage";

export interface RewindBanger {
  id: string;
  category: string;
  line1: string;
  line2?: string;
  score: number;
  shareable: boolean;
}

const bySpice = (spice: SpiceLevel, variants: { mild: string; spicy: string; savage: string }) => variants[spice];

const scoreFromCount = (count: number) => {
  if (count <= 0) return 0;
  // log-ish growth without importing math helpers
  if (count >= 2000) return 40;
  if (count >= 800) return 36;
  if (count >= 300) return 32;
  if (count >= 120) return 28;
  if (count >= 50) return 24;
  if (count >= 20) return 20;
  if (count >= 10) return 16;
  if (count >= 5) return 12;
  return 8;
};

const scoreFromLength = (text: string) => {
  if (text.length <= 64) return 10;
  if (text.length <= 88) return 6;
  if (text.length <= 110) return 2;
  return -6;
};

const isShareable = (line1: string, line2?: string) => {
  const total = line1.length + (line2 ? line2.length : 0);
  return line1.length <= 92 && total <= 160;
};

const formatCount = (count: number) => count.toLocaleString();

const safeQuote = (phrase: string) => `"${phrase}"`;

const formatHour = (hour: number) => {
  const display = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${display} ${suffix}`;
};

const topicRoast = (topicKey: string | undefined, spice: SpiceLevel) => {
  switch (topicKey) {
    case "coding":
      return bySpice(spice, {
        mild: "You didn't browse. You built.",
        spicy: "You didn't browse. You built.",
        savage: "You treated AI like a co-builder and a stress ball.",
      });
    case "writing":
      return bySpice(spice, {
        mild: "You came here to make the words behave.",
        spicy: "You came here to make the words behave.",
        savage: "You rewrote the same thing until it finally sounded like you.",
      });
    case "planning":
      return bySpice(spice, {
        mild: "You turned chaos into checklists.",
        spicy: "You turned chaos into checklists.",
        savage: "You didn't want ideas. You wanted a plan with timestamps.",
      });
    case "learning":
      return bySpice(spice, {
        mild: "You kept asking until it clicked.",
        spicy: "You kept asking until it clicked.",
        savage: "You refused to be confused in peace.",
      });
    case "career":
      return bySpice(spice, {
        mild: "You rehearsed your next move here.",
        spicy: "You rehearsed your next move here.",
        savage: "You workshopped your life like it had a deadline.",
      });
    case "travel":
      return bySpice(spice, {
        mild: "You planned it like a pro.",
        spicy: "You planned it like a pro.",
        savage: "You planned it like you're allergic to surprises.",
      });
    case "creative":
      return bySpice(spice, {
        mild: "You played with ideas until something stuck.",
        spicy: "You played with ideas until something stuck.",
        savage: "You used AI like a sandbox. Then you built castles.",
      });
    default:
      return bySpice(spice, {
        mild: "You came here to think out loud.",
        spicy: "You came here to think out loud.",
        savage: "You came here to argue with yourself (with a witness).",
      });
  }
};

const pickTopNickname = (nicknames: PhraseInsight[]) => {
  const top = nicknames[0];
  if (!top) return null;
  const phrase = top.phrase.trim();
  if (!phrase.length) return null;
  // Guarantee 1-4 words max.
  if (phrase.split(/\s+/).length > 4) return null;
  return top;
};

export function generateRewindBangers(
  summary: RewindSummary,
  options: { spice: SpiceLevel; includeSpicyWords?: boolean },
): { page: RewindBanger[]; share: RewindBanger[]; all: RewindBanger[] } {
  const spice = options.spice;
  const includeSpicyWords = Boolean(options.includeSpicyWords) && spice !== "mild";

  const b = summary.behavior;
  const promptsPerChat =
    summary.totalConversations > 0 ? Math.round(summary.totalUserMessages / summary.totalConversations) : 0;
  const hasChaos =
    b.spicyWordCount > 0 ||
    b.brokenCount > 0 ||
    b.wtfCount > 0 ||
    b.yellingMessageCount > 0 ||
    b.exclaimBurstMessageCount > 0 ||
    b.questionBurstMessageCount > 0;

  const brokenPhraseCounts = [
    { phrase: "why is this broken", count: b.whyBrokenCount },
    { phrase: "doesn't work", count: b.doesntWorkCount },
  ]
    .filter((p) => p.count > 0)
    .sort((a, c) => c.count - a.count);
  const brokenPrimaryPhrase = brokenPhraseCounts[0]?.phrase ?? "doesn't work";
  const brokenEvidence =
    b.whyBrokenCount > 0 && b.doesntWorkCount > 0
      ? `${safeQuote("why is this broken")}/${safeQuote("doesn't work")} x ${formatCount(b.brokenCount)}`
      : `${safeQuote(brokenPrimaryPhrase)} x ${formatCount(brokenPhraseCounts[0]?.count ?? b.brokenCount)}`;

  const quickIntroCount = b.quickQuestionCount + b.realQuickCount + b.simpleQuestionCount;
  const quickIntroTopPhrase =
    [
      { phrase: "quick question", count: b.quickQuestionCount },
      { phrase: "real quick", count: b.realQuickCount },
      { phrase: "simple question", count: b.simpleQuestionCount },
    ].sort((a, c) => c.count - a.count)[0] ?? null;

  const candidates: RewindBanger[] = [];
  const add = (banger: Omit<RewindBanger, "shareable">) => {
    const shareable = isShareable(banger.line1, banger.line2);
    candidates.push({ ...banger, shareable });
  };

  // How deep you went (identity line).
  if (summary.activeDays > 0) {
    const identity = bySpice(spice, {
      mild: "You didn't try AI. You built with it.",
      spicy: "You didn't try AI. You lived here.",
      savage: "This wasn't curiosity. This was dependency (productive edition).",
    });
    add({
      id: "identity",
      category: "identity",
      line1: identity,
      line2: `${formatCount(summary.activeDays)} days you showed up.`,
      score: 30 + scoreFromCount(summary.activeDays) + scoreFromLength(identity),
    });
  }

  // Nicknames / insults (optional reveal).
  const topNickname = pickTopNickname(summary.nicknames);
  if (topNickname && topNickname.count >= 2) {
    const line1 = includeSpicyWords
      ? bySpice(spice, {
          mild: "You gave AI a nickname.",
          spicy: `Top nickname you gave me: ${safeQuote(topNickname.phrase)}.`,
          savage: `You called me ${safeQuote(topNickname.phrase)}. Then asked for help anyway.`,
        })
      : bySpice(spice, {
          mild: "You gave AI a nickname.",
          spicy: "You gave me a nickname. We kept it censored.",
          savage: "You called me something. Then asked for help anyway.",
        });
    add({
      id: "nickname",
      category: "nickname",
      line1,
      line2: `(${formatCount(topNickname.count)}x)`,
      score: 82 + scoreFromCount(topNickname.count) + scoreFromLength(line1),
    });
  }

  // Apology loop / whiplash.
  if (b.whiplashChatCount > 0) {
    const line1 = bySpice(spice, {
      mild: "You had a moment. Then you recovered. Then you asked again.",
      spicy: "You snapped -> apologized -> asked for help anyway.",
      savage: "You got spicy -> apologized -> kept asking anyway.",
    });
    add({
      id: "whiplash",
      category: "whiplash",
      line1,
      line2: `(${formatCount(b.whiplashChatCount)} chats)`,
      score: 95 + scoreFromCount(b.whiplashChatCount) + scoreFromLength(line1),
    });
  }

  // Polite... until it didn't work.
  if (b.pleaseCount >= 10) {
    const line1 = bySpice(spice, {
      mild: `You said ${safeQuote("please")} a lot. Manners.`,
      spicy: hasChaos
        ? `You said ${safeQuote("please")} ${formatCount(b.pleaseCount)} times. Polite... until it didn't work.`
        : `You said ${safeQuote("please")} ${formatCount(b.pleaseCount)} times. Polite mode stayed on.`,
      savage: hasChaos
        ? `You said ${safeQuote("please")} ${formatCount(b.pleaseCount)} times. Then you stopped pretending.`
        : `You said ${safeQuote("please")} ${formatCount(b.pleaseCount)} times. Polite on purpose.`,
    });
    add({
      id: "please",
      category: "politeness",
      line1,
      line2: `(${safeQuote("please")} x ${formatCount(b.pleaseCount)})`,
      score: 70 + scoreFromCount(b.pleaseCount) + 12 + scoreFromLength(line1),
    });
  }

  // Quick question lie.
  if (quickIntroCount > 0 && quickIntroTopPhrase && quickIntroTopPhrase.count > 0) {
    const phrase = quickIntroTopPhrase.phrase;
    const count = quickIntroTopPhrase.count;
    const line1 = bySpice(spice, {
      mild: `${safeQuote(phrase)} wasn't quick.`,
      spicy: `${safeQuote(phrase)} was never quick.`,
      savage: `${safeQuote(phrase)}. That was a lie.`,
    });
    const quickChatDetail =
      b.quickQuestionChatCount > 0 && b.quickQuestionChatAvgPrompts > 0
        ? `(${formatCount(b.quickQuestionChatCount)} chats, ~${formatCount(b.quickQuestionChatAvgPrompts)} prompts each)`
        : `(${safeQuote(phrase)} x ${formatCount(count)})`;
    add({
      id: "quick",
      category: "quick",
      line1,
      line2: quickChatDetail,
      score: 78 + scoreFromCount(count) + 18 + scoreFromLength(line1),
    });
  }

  // Step-by-step vs broken contradiction.
  if (b.stepByStepCount > 0 && b.brokenCount > 0) {
    const line1 = bySpice(spice, {
      mild: `You love ${safeQuote("step by step")}. Until it breaks.`,
      spicy: `You love ${safeQuote("step by step")}... until it's ${safeQuote(brokenPrimaryPhrase)}.`,
      savage: `You asked for ${safeQuote("step by step")}. Then went straight to ${safeQuote(brokenPrimaryPhrase)}.`,
    });
    add({
      id: "stepbroken",
      category: "contradiction",
      line1,
      line2: `(${safeQuote("step by step")} x ${formatCount(b.stepByStepCount)} | ${brokenEvidence})`,
      score: 86 + scoreFromCount(b.brokenCount) + scoreFromCount(b.stepByStepCount) + scoreFromLength(line1),
    });
  }

  // Broken / doesn't work mode.
  if (b.brokenCount >= 3) {
    const line1 = bySpice(spice, {
      mild: "You hit fix-it mode.",
      spicy: `You went straight to ${safeQuote(brokenPrimaryPhrase)}.`,
      savage: `You didn't ask. You accused. (${safeQuote(brokenPrimaryPhrase)})`,
    });
    add({
      id: "broken",
      category: "rage",
      line1,
      line2: `(${brokenEvidence})`,
      score: 84 + scoreFromCount(b.brokenCount) + 18 + scoreFromLength(line1),
    });
  }

  // WTF moments.
  if (b.wtfCount >= 2) {
    const line1 = bySpice(spice, {
      mild: `You had ${safeQuote("wtf")} moments.`,
      spicy: `You had ${safeQuote("wtf")} moments. Understandable.`,
      savage: `${safeQuote("wtf")} showed up. Repeatedly.`,
    });
    add({
      id: "wtf",
      category: "rage",
      line1,
      line2: `(${safeQuote("wtf")} x ${formatCount(b.wtfCount)})`,
      score: 80 + scoreFromCount(b.wtfCount) + 18 + scoreFromLength(line1),
    });
  }

  // CAPS / yelling.
  if (b.yellingMessageCount > 0) {
    const line1 = bySpice(spice, {
      mild: "CAPS LOCK appeared. Emotion was present.",
      spicy: "CAPS LOCK appeared. Emotion was present.",
      savage: "CAPS LOCK appeared. Peace was never an option.",
    });
    add({
      id: "caps",
      category: "rage",
      line1,
      line2: `(${formatCount(b.yellingMessageCount)} times)`,
      score: 74 + scoreFromCount(b.yellingMessageCount) + scoreFromLength(line1),
    });
  }

  // ??? / !!! bursts.
  if (b.questionBurstMessageCount > 0) {
    const line1 = bySpice(spice, {
      mild: 'You hit the "???" key.',
      spicy: 'You hit the "???" key.',
      savage: 'You hit the "???" key like it owed you money.',
    });
    add({
      id: "qburst",
      category: "rage",
      line1,
      line2: `(${formatCount(b.questionBurstMessageCount)} times)`,
      score: 66 + scoreFromCount(b.questionBurstMessageCount) + scoreFromLength(line1),
    });
  }

  if (b.exclaimBurstMessageCount > 0) {
    const line1 = bySpice(spice, {
      mild: 'You hit the "!!!" key.',
      spicy: 'You hit the "!!!" key.',
      savage: 'You hit the "!!!" key with feeling.',
    });
    add({
      id: "eburst",
      category: "rage",
      line1,
      line2: `(${formatCount(b.exclaimBurstMessageCount)} times)`,
      score: 64 + scoreFromCount(b.exclaimBurstMessageCount) + scoreFromLength(line1),
    });
  }

  // Swearing (never quote the swear words).
  if (b.swearCount > 0) {
    const line1 = bySpice(spice, {
      mild: "You swore a little. It happens.",
      spicy: "You swore a bit. We noticed.",
      savage: "You swore. And then asked for help anyway.",
    });
    add({
      id: "swears",
      category: "rage",
      line1,
      line2: `(${formatCount(b.swearCount)} times)`,
      score: 60 + scoreFromCount(b.swearCount) + scoreFromLength(line1),
    });
  }

  // Iteration / prompts per chat.
  if (promptsPerChat > 0) {
    const line1 = bySpice(spice, {
      mild: "You don't ask once. You iterate.",
      spicy: "One answer was never enough.",
      savage: "You didn't chat. You negotiated.",
    });
    add({
      id: "iterate",
      category: "style",
      line1,
      line2: `(~${formatCount(promptsPerChat)} prompts per chat)`,
      score: 48 + scoreFromCount(promptsPerChat) + scoreFromLength(line1),
    });
  }

  // Late-night behavior.
  if (summary.peakHour != null) {
    const lateNight = summary.lateNightPercent;
    const line1 = bySpice(spice, {
      mild: `Late-night chats: ${lateNight}%.`,
      spicy: `Late-night chats: ${lateNight}%. You spiral offline, apparently.`,
      savage: `Late-night chats: ${lateNight}%. Your demons didn't get Wi-Fi.`,
    });
    add({
      id: "latenight",
      category: "rhythm",
      line1,
      line2: summary.peakHour != null ? `(prime time: ${formatHour(summary.peakHour)})` : undefined,
      score: 44 + scoreFromCount(lateNight) + scoreFromLength(line1),
    });
  }

  // Top topic roast.
  const topTopic = summary.topTopics[0];
  if (topTopic) {
    const line1 = topicRoast(topTopic.key, spice);
    add({
      id: "toptopic",
      category: "topics",
      line1,
      line2: `(top vibe: ${topTopic.label})`,
      score: 46 + scoreFromCount(topTopic.count) + scoreFromLength(line1),
    });
  }

  // Busiest month.
  if (summary.busiestMonth) {
    const line1 = bySpice(spice, {
      mild: `${summary.busiestMonth} was your busiest month.`,
      spicy: `${summary.busiestMonth} was unhinged.`,
      savage: `${summary.busiestMonth} was a cry for help (productive edition).`,
    });
    add({
      id: "busiest",
      category: "rhythm",
      line1,
      line2: "(something was happening)",
      score: 38 + scoreFromLength(line1),
    });
  }

  // Growth / prompt length shift.
  if (summary.promptLengthChangePercent != null) {
    const pct = Math.abs(summary.promptLengthChangePercent);
    const longer = summary.promptLengthChangePercent > 0;
    const line1 = bySpice(spice, {
      mild: longer ? "You started adding more detail." : "You got more concise over time.",
      spicy: longer ? "More context. More control." : "Early-year: essays. End-of-year: commands.",
      savage: longer ? "You started bringing receipts." : "Fewer words. More intent.",
    });
    add({
      id: "growth",
      category: "growth",
      line1,
      line2: `(prompts got ${pct}% ${longer ? "longer" : "shorter"})`,
      score: 36 + scoreFromCount(pct) + scoreFromLength(line1),
    });
  }

  // Sort and pick.
  candidates.sort((a, c) => c.score - a.score);

  const share = candidates.filter((c) => c.shareable).slice(0, 3);
  const page = candidates.slice(0, 7);

  return { page, share, all: candidates };
}
