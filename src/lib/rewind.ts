import { anonymizeText } from "./anonymize";

export interface TopicInsight {
  key: string;
  label: string;
  emoji: string;
  count: number;
}

export interface PhraseInsight {
  phrase: string;
  count: number;
}

export type RewindIntent =
  | "build"
  | "debug"
  | "write"
  | "plan"
  | "learn"
  | "decide"
  | "vent"
  | "brainstorm"
  | "other";

export type RewindDeliverable =
  | "code"
  | "plan"
  | "email"
  | "story"
  | "analysis"
  | "decision"
  | "other";

export type RewindMood = "flow" | "frustrated" | "uncertain" | "excited" | "neutral";

export interface RewindConversationSummary {
  topicKey: string | null;
  themeKey: string | null;
  month: string | null;
  oneLineSummary: string;
  userMessages: number;
  avgPromptChars: number;
  maxPromptChars: number;
  durationMins: number | null;
  intent: RewindIntent;
  deliverable: RewindDeliverable;
  mood: RewindMood;
  tags: string[];
  stack: string[];
  winSignals: number;
  frictionSignals: number;
  indecisionSignals: number;
  comeback: boolean;
}

export interface RewindProjectSummary {
  projectLabel: string;
  whatYouBuilt: string;
  stack: string[];
  monthsActive: string[];
  chats: number;
  prompts: number;
  intensity: "light" | "steady" | "obsessive";
  statusGuess: "shipped" | "abandoned" | "recurring" | "unknown";
}

export interface RewindBossFight {
  title: string;
  count: number;
  example: string;
}

export interface RewindWrappedSummary {
  archetype: {
    key: string;
    title: string;
    line: string;
  };
  hook: {
    identity: string;
    brag: string;
    roast: string;
  };
  projects: RewindProjectSummary[];
  bossFights: RewindBossFight[];
  wins: Array<{ title: string; count: number }>;
  comebackMoment: { title: string; detail: string } | null;
  timeline: {
    flowMonths: string[];
    frictionMonths: string[];
    villainMonth: string | null;
    longestStreakDays: number | null;
    mostIndecisiveMonth: string | null;
    mostActiveWeek: string | null;
    mostChaoticWeek: string | null;
  };
  weirdRabbitHole: { title: string; detail: string } | null;
  forecast: string[];
  closingLine: string;
}

export interface RewindBehavior {
  pleaseCount: number;
  thankYouCount: number;
  sorryCount: number;
  canYouCount: number;
  stepByStepCount: number;
  quickQuestionCount: number;
  realQuickCount: number;
  simpleQuestionCount: number;
  brokenCount: number;
  whyBrokenCount: number;
  doesntWorkCount: number;
  wtfCount: number;
  spicyWordCount: number;
  swearCount: number;
  yellingMessageCount: number;
  whiplashChatCount: number;
  rageMessageCount: number;
  questionBurstMessageCount: number;
  exclaimBurstMessageCount: number;
  againCount: number;
  stillCount: number;
  quickQuestionChatCount: number;
  quickQuestionChatAvgPrompts: number;
}

export interface RewindSummary {
  totalConversations: number;
  totalUserMessages: number;
  activeDays: number;
  busiestMonth: string | null;
  peakHour: number | null;
  lateNightPercent: number;
  topTopics: TopicInsight[];
  frequentPhrases: PhraseInsight[];
  nicknames: PhraseInsight[];
  topWord: string | null;
  longestPromptChars: number | null;
  avgPromptChars: number | null;
  promptLengthChangePercent: number | null;
  behavior: RewindBehavior;
  conversations: RewindConversationSummary[];
  wrapped: RewindWrappedSummary;
}

const STOPWORDS = new Set([
  "the",
  "and",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
  "these",
  "those",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "they",
  "their",
  "he",
  "she",
  "his",
  "her",
  "them",
  "or",
  "but",
  "so",
  "if",
  "then",
  "than",
  "not",
  "no",
  "yes",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "just",
  "like",
  "about",
  "what",
  "when",
  "where",
  "why",
  "how",
  "who",
  "which",
  "also",
  "into",
  "over",
  "under",
  "up",
  "down",
  "out",
  "very",
  "really",
  "more",
  "most",
  "some",
  "any",
  "all",
  "name",
  "email",
  "phone",
  "url",
  "handle",
  "ip",
  "id",
  "secret",
  "ssn",
  "card",
]);

const ANON_TOKENS = new Set(["name", "email", "phone", "url", "handle", "ip", "id", "secret", "ssn", "card"]);

const HABIT_PHRASES: Array<{ phrase: string; pattern: RegExp }> = [
  { phrase: "thank you", pattern: /\bthanks\b|\bthank you\b/gi },
  { phrase: "please", pattern: /\bplease\b/gi },
  { phrase: "sorry", pattern: /\bsorry\b|\bmy bad\b|\bapolog(?:y|ize|ise|ies)\b/gi },
  { phrase: "quick question", pattern: /\bquick question\b/gi },
  { phrase: "real quick", pattern: /\breal quick\b/gi },
  { phrase: "simple question", pattern: /\bsimple question\b/gi },
  { phrase: "step by step", pattern: /\bstep by step\b/gi },
  { phrase: "one more thing", pattern: /\bone more (thing)?\b/gi },
  { phrase: "what about", pattern: /\bwhat about\b/gi },
  { phrase: "can you", pattern: /\bcan you\b/gi },
  { phrase: "explain like I'm 5", pattern: /\bexplain (it )?like (i'?m|i am) (5|five)\b/gi },
  { phrase: "why is this broken", pattern: /\bwhy (is|is it|it's) (this|it) broken\b/gi },
  { phrase: "doesn't work", pattern: /\bdoesn'?t work\b|\bnot working\b|\bisn'?t working\b/gi },
  { phrase: "wtf", pattern: /\bwtf\b/gi },
];

const SPICY_WORD_PATTERN =
  /\b(useless|idiot|stupid|dumb|garbage|trash|toaster|clown|bot|npc|moron)\b/gi;
const SWEAR_PATTERN = /\b(fuck(?:ing)?|shit|damn)\b/gi;

const INTENT_KEYWORDS: Record<RewindIntent, string[]> = {
  build: [
    "build",
    "create",
    "make",
    "implement",
    "ship",
    "deploy",
    "prototype",
    "mvp",
    "app",
    "website",
    "tool",
    "automation",
    "workflow",
    "script",
    "bot",
    "dashboard",
  ],
  debug: [
    "debug",
    "bug",
    "error",
    "exception",
    "traceback",
    "stack trace",
    "fix",
    "broken",
    "doesn't work",
    "not working",
    "issue",
  ],
  write: [
    "write",
    "rewrite",
    "edit",
    "draft",
    "email",
    "resume",
    "cv",
    "cover letter",
    "essay",
    "blog",
    "tone",
    "grammar",
    "headline",
    "caption",
  ],
  plan: ["plan", "roadmap", "timeline", "schedule", "checklist", "itinerary", "steps", "strategy", "budget"],
  learn: ["explain", "learn", "understand", "teach", "tutorial", "eli5", "what is", "how does"],
  decide: ["should i", "which", "choose", "pick", "compare", "pros", "cons", "decision"],
  vent: ["i feel", "i'm feeling", "stressed", "overwhelmed", "frustrated", "angry", "tired", "burnt out"],
  brainstorm: ["brainstorm", "ideas", "concepts", "name ideas", "alternatives", "options"],
  other: [],
};

const DELIVERABLE_KEYWORDS: Record<RewindDeliverable, string[]> = {
  code: ["code", "script", "function", "api", "endpoint", "bug", "fix", "deploy", "repo", "pr", "commit", "sql"],
  plan: ["plan", "roadmap", "timeline", "steps", "checklist", "itinerary", "schedule"],
  email: ["email", "reply", "message", "subject line", "dm", "follow-up"],
  story: ["story", "character", "plot", "scene", "chapter", "novel"],
  analysis: ["analyze", "analysis", "evaluate", "metrics", "data", "research"],
  decision: ["pros", "cons", "choose", "pick", "decision", "which"],
  other: [],
};

const STACK_TERMS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Python", pattern: /\bpython\b/gi },
  { label: "JavaScript", pattern: /\bjavascript\b|\bjs\b/gi },
  { label: "TypeScript", pattern: /\btypescript\b|\bts\b/gi },
  { label: "Node.js", pattern: /\bnode\b|\bnode\.js\b/gi },
  { label: "React", pattern: /\breact\b/gi },
  { label: "Next.js", pattern: /\bnext\.?js\b/gi },
  { label: "Vercel", pattern: /\bvercel\b/gi },
  { label: "Prisma", pattern: /\bprisma\b/gi },
  { label: "Postgres", pattern: /\bpostgres(?:ql)?\b/gi },
  { label: "SQLite", pattern: /\bsqlite\b/gi },
  { label: "MySQL", pattern: /\bmysql\b/gi },
  { label: "MongoDB", pattern: /\bmongodb\b|\bmongo\b/gi },
  { label: "Redis", pattern: /\bredis\b/gi },
  { label: "Docker", pattern: /\bdocker\b/gi },
  { label: "Kubernetes", pattern: /\bkubernetes\b|\bk8s\b/gi },
  { label: "AWS", pattern: /\baws\b|\bamazon web services\b/gi },
  { label: "GCP", pattern: /\bgcp\b|\bgoogle cloud\b/gi },
  { label: "Azure", pattern: /\bazure\b/gi },
  { label: "Git", pattern: /\bgit\b/gi },
  { label: "GitHub", pattern: /\bgithub\b/gi },
  { label: "VS Code", pattern: /\bvs code\b|\bvscode\b/gi },
  { label: "Linux", pattern: /\blinux\b|\bubuntu\b/gi },
  { label: "Windows", pattern: /\bwindows\b/gi },
  { label: "macOS", pattern: /\bmacos\b|\bosx\b/gi },
  { label: "Notion", pattern: /\bnotion\b/gi },
  { label: "Excel", pattern: /\bexcel\b/gi },
  { label: "Google Sheets", pattern: /\bgoogle sheets\b|\bsheets\b/gi },
];

const PROJECT_THEMES: Array<{ key: string; label: string; keywords: string[] }> = [
  { key: "automation", label: "Automation", keywords: ["automation", "workflow", "zapier", "cron", "schedule"] },
  { key: "dashboard", label: "Dashboard", keywords: ["dashboard", "admin", "analytics", "chart", "metrics"] },
  { key: "api", label: "API wiring", keywords: ["api", "endpoint", "webhook", "rest", "graphql"] },
  { key: "data", label: "Data wrangling", keywords: ["sql", "query", "csv", "data", "scrape", "scraping"] },
  { key: "deploy", label: "Deploy & ship", keywords: ["deploy", "vercel", "docker", "prod", "staging"] },
  { key: "debug", label: "Debug dungeon", keywords: ["bug", "debug", "error", "fix", "broken", "not working"] },
  { key: "writing", label: "Writing polish", keywords: ["rewrite", "tone", "draft", "edit", "headline", "caption"] },
];

const WIN_PATTERNS: RegExp[] = [
  /\bit worked\b/gi,
  /\bit works\b/gi,
  /\bsolved\b/gi,
  /\bfixed\b/gi,
  /\bwe fixed it\b/gi,
  /\bperfect\b/gi,
  /\bnailed it\b/gi,
  /\bdone\b/gi,
  /\bthank you\b|\bthanks\b/gi,
];

const INDECISION_PATTERNS: RegExp[] = [
  /\bshould i\b/gi,
  /\bwhich (one|is better)\b/gi,
  /\bhelp me decide\b/gi,
  /\bpros and cons\b/gi,
  /\bcan('t|not) decide\b/gi,
  /\bnot sure\b/gi,
  /\bunsure\b/gi,
  /\bmaybe\b/gi,
];

const AGAIN_PATTERN = /\bagain\b/gi;
const STILL_PATTERN = /\bstill\b/gi;
const QUESTION_BURST_PATTERN = /\?{3,}/g;
const EXCLAIM_BURST_PATTERN = /!{3,}/g;

const isYellingMessage = (text: string) => {
  const lettersOnly = text.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length < 12) return false;
  const upper = lettersOnly.replace(/[^A-Z]/g, "").length;
  return upper / lettersOnly.length >= 0.75;
};

const TOPIC_BUCKETS: Array<{
  key: string;
  label: string;
  emoji: string;
  keywords: string[];
}> = [
  {
    key: "coding",
    label: "Coding & Scripts",
    emoji: "🧑‍💻",
    keywords: [
      "code",
      "coding",
      "bug",
      "debug",
      "python",
      "javascript",
      "typescript",
      "react",
      "next",
      "api",
      "function",
      "script",
      "deploy",
      "sql",
      "prisma",
    ],
  },
  {
    key: "writing",
    label: "Writing & Storytelling",
    emoji: "✍️",
    keywords: ["write", "writing", "blog", "article", "story", "essay", "rewrite", "tone", "voice"],
  },
  {
    key: "learning",
    label: "Learning & Explaining",
    emoji: "📚",
    keywords: ["learn", "study", "explain", "understand", "eli5", "homework", "lesson"],
  },
  {
    key: "planning",
    label: "Planning & Productivity",
    emoji: "🗂️",
    keywords: ["plan", "planning", "schedule", "roadmap", "project", "timeline", "todo", "task"],
  },
  {
    key: "travel",
    label: "Travel Planning",
    emoji: "✈️",
    keywords: ["travel", "trip", "flight", "hotel", "itinerary", "vacation"],
  },
  {
    key: "career",
    label: "Career & Work",
    emoji: "💼",
    keywords: ["resume", "interview", "job", "career", "work", "meeting", "manager"],
  },
  {
    key: "creative",
    label: "Creative Play",
    emoji: "🎨",
    keywords: ["idea", "brainstorm", "creative", "design", "art", "game", "music"],
  },
];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parseTimestamp = (value: unknown): Date | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string" && value.trim().length) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const normalizeMessageContent = (message: unknown): string | null => {
  const msg = asRecord(message);
  if (!msg) return null;
  const nestedMsg = asRecord(msg.message);
  const content = msg.content ?? nestedMsg?.content;
  if (!content) return null;

  const contentRecord = asRecord(content);
  const parts = contentRecord?.parts;
  if (Array.isArray(parts)) {
    const textParts = parts.filter((p): p is string => typeof p === "string");
    const joined = textParts.join(" ").trim();
    return joined.length ? joined : null;
  }

  const textValue = contentRecord?.text;
  if (typeof textValue === "string") return textValue.trim() || null;
  if (typeof content === "string") return content.trim() || null;
  return null;
};

const extractConversationMessages = (conversation: unknown): unknown[] => {
  const conv = asRecord(conversation);
  if (!conv) return [];

  const directMapping = asRecord(conv.mapping);
  const nestedConv = asRecord(conv.conversation);
  const nestedMapping = nestedConv ? asRecord(nestedConv.mapping) : null;
  const mapping = directMapping ?? nestedMapping;

  if (mapping) {
    const mapped = Object.values(mapping)
      .map((node) => asRecord(node)?.message)
      .filter(Boolean);
    return mapped;
  }

  const directMessages = conv.messages ?? nestedConv?.messages;
  return Array.isArray(directMessages) ? directMessages : [];
};

const countMatches = (text: string, pattern: RegExp) => {
  pattern.lastIndex = 0;
  let count = 0;
  while (pattern.exec(text)) count += 1;
  return count;
};

const recordTokenMatches = (text: string, pattern: RegExp, counts: Map<string, number>) => {
  pattern.lastIndex = 0;
  let count = 0;
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text))) {
    const token = (match[1] ?? match[0]).toLowerCase();
    counts.set(token, (counts.get(token) ?? 0) + 1);
    count += 1;
  }
  return count;
};

const tokenize = (textLower: string): string[] =>
  textLower.split(/[^a-z0-9'\-]+/).filter(Boolean);

const scoreByKeywordPresence = (textLower: string, keywords: string[]) => {
  let score = 0;
  for (const kw of keywords) {
    if (kw && textLower.includes(kw)) score += 1;
  }
  return score;
};

const pickTopKey = <TKey extends string>(scores: Record<TKey, number>, fallback: TKey): TKey => {
  let bestKey = fallback;
  let bestScore = scores[fallback] ?? 0;
  for (const key of Object.keys(scores) as TKey[]) {
    const score = scores[key] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  return bestKey;
};

const pickTopFromCounts = (counts: Map<string, number>, limit: number) =>
  Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label]) => label);

export interface RewindAnalyzer {
  addConversation: (conversation: unknown) => void;
  summary: () => RewindSummary;
}

export function createRewindAnalyzer(options?: { now?: Date; daysBack?: number }): RewindAnalyzer {
  const now = options?.now ?? new Date();
  const daysBack = options?.daysBack ?? 365;
  const nowMs = now.getTime();
  const sinceMs = nowMs - daysBack * 24 * 60 * 60 * 1000;
  const midMs = sinceMs + Math.floor((nowMs - sinceMs) / 2);

  let totalConversations = 0;
  let totalUserMessages = 0;
  const conversations: RewindConversationSummary[] = [];

  const activeDaysSet = new Set<string>();
  const dayMessageCount = new Map<string, number>();
  const dayChaosCount = new Map<string, number>();
  const monthCount = new Map<string, number>();
  const hourCount = Array.from({ length: 24 }, () => 0);
  let timestampCount = 0;
  let lateNightCount = 0;

  const topicCounts = new Map<string, number>();
  const wordFreq = new Map<string, number>();
  const habitCounts = new Map<string, number>();
  const nicknameCounts = new Map<string, number>();
  let spicyWordCount = 0;
  let swearCount = 0;
  let yellingMessageCount = 0;
  let whiplashChatCount = 0;
  let rageMessageCount = 0;
  let questionBurstMessageCount = 0;
  let exclaimBurstMessageCount = 0;
  let againCount = 0;
  let stillCount = 0;
  let quickQuestionChatCount = 0;
  let quickQuestionChatPromptTotal = 0;
  let winSignalTotal = 0;

  let longestPromptChars = 0;
  let totalPromptChars = 0;

  let earlyPromptChars = 0;
  let earlyPromptCount = 0;
  let latePromptChars = 0;
  let latePromptCount = 0;

  const addConversation = (conversation: unknown) => {
    const convRecord = asRecord(conversation);
    if (!convRecord) return;

    const titleRaw = convRecord.title;
    const title = typeof titleRaw === "string" ? titleRaw : "";
    const titleLower = title.toLowerCase();
    const titleSafeLower = title ? anonymizeText(title).sanitized.toLowerCase() : "";

    const topicScores = new Map<string, number>();
    for (const bucket of TOPIC_BUCKETS) {
      for (const kw of bucket.keywords) {
        if (titleLower.includes(kw)) {
          topicScores.set(bucket.key, (topicScores.get(bucket.key) ?? 0) + 2);
        }
      }
    }

    const messages = extractConversationMessages(convRecord);
    let conversationHasIncluded = false;
    const conversationHabitCounts = new Map<string, number>();
    let conversationSpicy = 0;
    let conversationUserMessageCount = 0;
    let conversationPromptChars = 0;
    let conversationMaxPromptChars = 0;
    let conversationFirstMs: number | null = null;
    let conversationLastMs: number | null = null;
    let conversationWinSignals = 0;
    let conversationFrictionMessages = 0;
    let conversationIndecisionSignals = 0;

    const intentScores: Record<RewindIntent, number> = {
      build: 0,
      debug: 0,
      write: 0,
      plan: 0,
      learn: 0,
      decide: 0,
      vent: 0,
      brainstorm: 0,
      other: 0,
    };

    const deliverableScores: Record<RewindDeliverable, number> = {
      code: 0,
      plan: 0,
      email: 0,
      story: 0,
      analysis: 0,
      decision: 0,
      other: 0,
    };

    const stackCounts = new Map<string, number>();
    const themeScores = new Map<string, number>();

    if (titleSafeLower) {
      for (const key of Object.keys(INTENT_KEYWORDS) as RewindIntent[]) {
        intentScores[key] += scoreByKeywordPresence(titleSafeLower, INTENT_KEYWORDS[key]) * 2;
      }
      for (const key of Object.keys(DELIVERABLE_KEYWORDS) as RewindDeliverable[]) {
        deliverableScores[key] += scoreByKeywordPresence(titleSafeLower, DELIVERABLE_KEYWORDS[key]);
      }
      for (const term of STACK_TERMS) {
        const hits = countMatches(titleSafeLower, term.pattern);
        if (hits > 0) stackCounts.set(term.label, (stackCounts.get(term.label) ?? 0) + hits);
      }
      for (const theme of PROJECT_THEMES) {
        const score = scoreByKeywordPresence(titleSafeLower, theme.keywords);
        if (score > 0) themeScores.set(theme.key, (themeScores.get(theme.key) ?? 0) + score);
      }
    }

    for (const msg of messages) {
      const msgRecord = asRecord(msg);
      if (!msgRecord) continue;

      const authorRecord = asRecord(msgRecord.author);
      const nestedMessageRecord = asRecord(msgRecord.message);
      const nestedAuthorRecord = nestedMessageRecord ? asRecord(nestedMessageRecord.author) : null;

      const roleRaw =
        authorRecord?.role ??
        nestedAuthorRecord?.role ??
        msgRecord.author ??
        msgRecord.role ??
        null;
      if (roleRaw !== "user") continue;

      const createdAt =
        parseTimestamp(msgRecord.create_time) ??
        parseTimestamp(nestedMessageRecord?.create_time) ??
        parseTimestamp(convRecord.create_time) ??
        null;

      if (createdAt && createdAt.getTime() < sinceMs) continue;

      const rawText = normalizeMessageContent(msgRecord);
      if (!rawText) continue;

      const { sanitized } = anonymizeText(rawText);
      const trimmed = sanitized.trim();
      if (!trimmed.length) continue;

      conversationHasIncluded = true;
      totalUserMessages += 1;
      conversationUserMessageCount += 1;

      const len = trimmed.length;
      totalPromptChars += len;
      if (len > longestPromptChars) longestPromptChars = len;
      conversationPromptChars += len;
      if (len > conversationMaxPromptChars) conversationMaxPromptChars = len;

      if (createdAt) {
        const ms = createdAt.getTime();
        if (conversationFirstMs === null || ms < conversationFirstMs) conversationFirstMs = ms;
        if (conversationLastMs === null || ms > conversationLastMs) conversationLastMs = ms;
      }

      const lowered = trimmed.toLowerCase();
      let messageHasWtf = false;
      let messageHasBroken = false;

      for (const key of Object.keys(INTENT_KEYWORDS) as RewindIntent[]) {
        intentScores[key] += scoreByKeywordPresence(lowered, INTENT_KEYWORDS[key]);
      }
      for (const key of Object.keys(DELIVERABLE_KEYWORDS) as RewindDeliverable[]) {
        deliverableScores[key] += scoreByKeywordPresence(lowered, DELIVERABLE_KEYWORDS[key]);
      }
      for (const term of STACK_TERMS) {
        const hits = countMatches(lowered, term.pattern);
        if (hits > 0) stackCounts.set(term.label, (stackCounts.get(term.label) ?? 0) + hits);
      }
      for (const theme of PROJECT_THEMES) {
        const score = scoreByKeywordPresence(lowered, theme.keywords);
        if (score > 0) themeScores.set(theme.key, (themeScores.get(theme.key) ?? 0) + score);
      }

      let messageWinHits = 0;
      for (const pat of WIN_PATTERNS) {
        messageWinHits += countMatches(lowered, pat);
      }
      if (messageWinHits > 0) {
        conversationWinSignals += messageWinHits;
        winSignalTotal += messageWinHits;
      }

      let messageIndecisionHits = 0;
      for (const pat of INDECISION_PATTERNS) {
        messageIndecisionHits += countMatches(lowered, pat);
      }
      if (messageIndecisionHits > 0) {
        conversationIndecisionSignals += messageIndecisionHits;
      }

      // Topics
      for (const bucket of TOPIC_BUCKETS) {
        let scoreDelta = 0;
        for (const kw of bucket.keywords) {
          if (lowered.includes(kw)) scoreDelta += 1;
        }
        if (scoreDelta > 0) {
          topicScores.set(bucket.key, (topicScores.get(bucket.key) ?? 0) + scoreDelta);
        }
      }

      // Fun phrases / habits
      for (const habit of HABIT_PHRASES) {
        const hits = countMatches(lowered, habit.pattern);
        if (hits > 0) {
          habitCounts.set(habit.phrase, (habitCounts.get(habit.phrase) ?? 0) + hits);
          conversationHabitCounts.set(
            habit.phrase,
            (conversationHabitCounts.get(habit.phrase) ?? 0) + hits,
          );
          if (habit.phrase === "wtf") messageHasWtf = true;
          if (habit.phrase === "why is this broken" || habit.phrase === "doesn't work") messageHasBroken = true;
        }
      }

      const insultHits = recordTokenMatches(lowered, SPICY_WORD_PATTERN, nicknameCounts);
      const swearHits = countMatches(lowered, SWEAR_PATTERN);
      const spicyHits = insultHits + swearHits;
      if (spicyHits > 0) {
        spicyWordCount += spicyHits;
        conversationSpicy += spicyHits;
      }
      if (swearHits > 0) swearCount += swearHits;

      const isYelling = isYellingMessage(trimmed);
      if (isYelling) {
        yellingMessageCount += 1;
      }

      const messageAgainHits = countMatches(lowered, AGAIN_PATTERN);
      if (messageAgainHits > 0) againCount += messageAgainHits;

      const messageStillHits = countMatches(lowered, STILL_PATTERN);
      if (messageStillHits > 0) stillCount += messageStillHits;

      const hasQuestionBurst = QUESTION_BURST_PATTERN.test(trimmed);
      QUESTION_BURST_PATTERN.lastIndex = 0;
      if (hasQuestionBurst) questionBurstMessageCount += 1;

      const hasExclaimBurst = EXCLAIM_BURST_PATTERN.test(trimmed);
      EXCLAIM_BURST_PATTERN.lastIndex = 0;
      if (hasExclaimBurst) exclaimBurstMessageCount += 1;

      const isRage =
        messageHasWtf ||
        messageHasBroken ||
        spicyHits > 0 ||
        isYelling ||
        hasQuestionBurst ||
        hasExclaimBurst ||
        messageAgainHits > 0 ||
        messageStillHits > 0;
      if (isRage) {
        rageMessageCount += 1;
        conversationFrictionMessages += 1;
      }

      // Word frequencies
      const tokens = tokenize(lowered);
      for (const token of tokens) {
        if (ANON_TOKENS.has(token)) continue;
        if (token.length < 3) continue;
        if (STOPWORDS.has(token)) continue;
        if (/^\d+$/.test(token)) continue;
        wordFreq.set(token, (wordFreq.get(token) ?? 0) + 1);
      }

      // Time stats
      if (createdAt) {
        timestampCount += 1;
        const dayKey = createdAt.toISOString().slice(0, 10);
        activeDaysSet.add(dayKey);
        dayMessageCount.set(dayKey, (dayMessageCount.get(dayKey) ?? 0) + 1);
        if (isRage) {
          dayChaosCount.set(dayKey, (dayChaosCount.get(dayKey) ?? 0) + 1);
        }

        const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
        monthCount.set(monthKey, (monthCount.get(monthKey) ?? 0) + 1);

        const hour = createdAt.getHours();
        hourCount[hour] += 1;
        if (hour >= 23 || hour <= 4) lateNightCount += 1;

        if (createdAt.getTime() <= midMs) {
          earlyPromptChars += len;
          earlyPromptCount += 1;
        } else {
          latePromptChars += len;
          latePromptCount += 1;
        }
      }
    }

    if (!conversationHasIncluded) return;

    totalConversations += 1;

    const conversationSorry = conversationHabitCounts.get("sorry") ?? 0;
    const conversationThanks = conversationHabitCounts.get("thank you") ?? 0;
    const conversationPlease = conversationHabitCounts.get("please") ?? 0;
    if (conversationSpicy > 0 && (conversationSorry > 0 || conversationThanks > 0 || conversationPlease > 0)) {
      whiplashChatCount += 1;
    }

    const conversationQuickIntro =
      (conversationHabitCounts.get("quick question") ?? 0) +
      (conversationHabitCounts.get("real quick") ?? 0) +
      (conversationHabitCounts.get("simple question") ?? 0);
    if (conversationQuickIntro > 0) {
      quickQuestionChatCount += 1;
      quickQuestionChatPromptTotal += conversationUserMessageCount;
    }

    let bestTopic: { key: string; score: number } | null = null;
    for (const bucket of TOPIC_BUCKETS) {
      const score = topicScores.get(bucket.key) ?? 0;
      if (score <= 0) continue;
      if (!bestTopic || score > bestTopic.score) {
        bestTopic = { key: bucket.key, score };
      }
    }

    const topicKey = bestTopic?.key ?? null;
    const fallbackIntent: RewindIntent =
      topicKey === "coding"
        ? "build"
        : topicKey === "writing"
          ? "write"
          : topicKey === "planning"
            ? "plan"
            : topicKey === "learning"
              ? "learn"
              : topicKey === "career"
                ? "decide"
                : topicKey === "travel"
                  ? "plan"
                  : topicKey === "creative"
                    ? "brainstorm"
                    : "other";
    intentScores[fallbackIntent] += 1;

    const fallbackDeliverable: RewindDeliverable =
      topicKey === "coding"
        ? "code"
        : topicKey === "planning" || topicKey === "travel"
          ? "plan"
          : topicKey === "writing"
            ? "email"
            : topicKey === "creative"
              ? "story"
              : topicKey === "learning"
                ? "analysis"
                : topicKey === "career"
                  ? "decision"
                  : "other";
    deliverableScores[fallbackDeliverable] += 1;

    const intent = pickTopKey<RewindIntent>(intentScores, fallbackIntent);
    const deliverable = pickTopKey<RewindDeliverable>(deliverableScores, fallbackDeliverable);

    let topTheme: { key: string; label: string; score: number } | null = null;
    for (const theme of PROJECT_THEMES) {
      const score = themeScores.get(theme.key) ?? 0;
      if (score <= 0) continue;
      if (!topTheme || score > topTheme.score) {
        topTheme = { key: theme.key, label: theme.label, score };
      }
    }
    const themeKey = topTheme?.key ?? null;

    const monthKey =
      conversationFirstMs != null
        ? `${new Date(conversationFirstMs).getFullYear()}-${String(new Date(conversationFirstMs).getMonth() + 1).padStart(2, "0")}`
        : null;
    const durationMins =
      conversationFirstMs != null && conversationLastMs != null && conversationLastMs >= conversationFirstMs
        ? Math.round((conversationLastMs - conversationFirstMs) / 60000)
        : null;

    const avgPrompt =
      conversationUserMessageCount > 0 ? Math.round(conversationPromptChars / conversationUserMessageCount) : 0;
    const comeback = conversationFrictionMessages > 0 && conversationWinSignals > 0;

    let mood: RewindMood = "neutral";
    const frictionRatio =
      conversationUserMessageCount > 0 ? conversationFrictionMessages / conversationUserMessageCount : 0;
    if (conversationFrictionMessages >= 2 && frictionRatio >= 0.35 && conversationWinSignals === 0) {
      mood = "frustrated";
    } else if (conversationWinSignals >= 2 && conversationFrictionMessages === 0) {
      mood = "flow";
    } else if (conversationIndecisionSignals >= 3) {
      mood = "uncertain";
    } else if (comeback) {
      mood = "excited";
    }

    const stack = pickTopFromCounts(stackCounts, 7);

    const oneLineSummary = (() => {
      const stackTop = stack.find((t) => !["Git", "GitHub", "Windows", "Linux", "macOS"].includes(t)) ?? null;
      const stackHint = stackTop ? ` (${stackTop})` : "";
      const focus =
        topTheme?.label ?? (topicKey ? TOPIC_BUCKETS.find((b) => b.key === topicKey)?.label ?? null : null);
      const focusHint = focus ? `: ${focus}` : "";

      switch (intent) {
        case "debug":
          return `Debugging${focusHint}${stackHint}.`;
        case "build":
          return `Building${focusHint}${stackHint}.`;
        case "write":
          return `Writing${focusHint}${stackHint}.`;
        case "plan":
          return `Planning${focusHint}${stackHint}.`;
        case "learn":
          return `Learning${focusHint}${stackHint}.`;
        case "decide":
          return `Deciding${focusHint}${stackHint}.`;
        case "vent":
          return `Venting${focusHint}${stackHint}.`;
        case "brainstorm":
          return `Brainstorming${focusHint}${stackHint}.`;
        default:
          return `Thinking out loud${focusHint}${stackHint}.`;
      }
    })();
    const tags = (() => {
      const tagSet = new Set<string>();
      const topicLabel = topicKey ? TOPIC_BUCKETS.find((b) => b.key === topicKey)?.label : null;
      if (topicLabel) tagSet.add(topicLabel);
      if (topTheme?.label) tagSet.add(topTheme.label);
      const deliverableLabel =
        deliverable === "code"
          ? "Code"
          : deliverable === "plan"
            ? "Plans"
            : deliverable === "email"
              ? "Messages"
              : deliverable === "story"
                ? "Stories"
                : deliverable === "analysis"
                  ? "Analysis"
                  : deliverable === "decision"
                    ? "Decisions"
                    : null;
      if (deliverableLabel) tagSet.add(deliverableLabel);
      stack.slice(0, 3).forEach((t) => tagSet.add(t));
      return Array.from(tagSet).slice(0, 6);
    })();

    conversations.push({
      topicKey,
      themeKey,
      month: monthKey,
      oneLineSummary,
      userMessages: conversationUserMessageCount,
      avgPromptChars: avgPrompt,
      maxPromptChars: conversationMaxPromptChars,
      durationMins,
      intent,
      deliverable,
      mood,
      tags,
      stack,
      winSignals: conversationWinSignals,
      frictionSignals: conversationFrictionMessages,
      indecisionSignals: conversationIndecisionSignals,
      comeback,
    });

    if (bestTopic) {
      topicCounts.set(bestTopic.key, (topicCounts.get(bestTopic.key) ?? 0) + 1);
    }
  };

  const summary = (): RewindSummary => {
    const avgPromptChars =
      totalUserMessages > 0 ? Math.round(totalPromptChars / totalUserMessages) : null;

    const topWord: string | null = null;

    const frequentPhrases = Array.from(habitCounts.entries())
      .filter(([, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase, count]) => ({ phrase, count }));

    const nicknames = Array.from(nicknameCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([phrase, count]) => ({ phrase, count }));

    let topTopics: TopicInsight[] = TOPIC_BUCKETS.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      emoji: bucket.emoji,
      count: topicCounts.get(bucket.key) ?? 0,
    }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (topTopics.length === 0) {
      const fallbackWords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word, count]) => ({
          key: word,
          label: word.charAt(0).toUpperCase() + word.slice(1),
          emoji: "✨",
          count,
        }));
      topTopics = fallbackWords;
    }

    const busiestMonthKey =
      Array.from(monthCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const busiestMonth =
      busiestMonthKey && /^\d{4}-\d{2}$/.test(busiestMonthKey)
        ? monthNames[Number(busiestMonthKey.split("-")[1]) - 1] ?? null
        : null;

    const peakHour = hourCount.some((c) => c > 0)
      ? hourCount.reduce((best, count, hour) => (count > hourCount[best] ? hour : best), 0)
      : null;

    const lateNightPercent =
      timestampCount > 0 ? Math.round((lateNightCount / timestampCount) * 100) : 0;

    let promptLengthChangePercent: number | null = null;
    if (earlyPromptCount >= 5 && latePromptCount >= 5) {
      const avgEarly = earlyPromptChars / earlyPromptCount;
      const avgLate = latePromptChars / latePromptCount;
      if (avgEarly > 0) {
        const diff = ((avgLate - avgEarly) / avgEarly) * 100;
        if (Number.isFinite(diff) && Math.abs(diff) >= 10) {
          promptLengthChangePercent = Math.round(diff);
        }
      }
    }

    const getHabit = (phrase: string) => habitCounts.get(phrase) ?? 0;
    const whyBrokenCount = getHabit("why is this broken");
    const doesntWorkCount = getHabit("doesn't work");
    const brokenCount = whyBrokenCount + doesntWorkCount;
    const quickQuestionChatAvgPrompts =
      quickQuestionChatCount > 0 ? Math.round(quickQuestionChatPromptTotal / quickQuestionChatCount) : 0;

    const behavior: RewindBehavior = {
      pleaseCount: getHabit("please"),
      thankYouCount: getHabit("thank you"),
      sorryCount: getHabit("sorry"),
      canYouCount: getHabit("can you"),
      stepByStepCount: getHabit("step by step"),
      quickQuestionCount: getHabit("quick question"),
      realQuickCount: getHabit("real quick"),
      simpleQuestionCount: getHabit("simple question"),
      brokenCount,
      whyBrokenCount,
      doesntWorkCount,
      wtfCount: getHabit("wtf"),
      spicyWordCount,
      swearCount,
      yellingMessageCount,
      whiplashChatCount,
      rageMessageCount,
      questionBurstMessageCount,
      exclaimBurstMessageCount,
      againCount,
      stillCount,
      quickQuestionChatCount,
      quickQuestionChatAvgPrompts,
    };

    const monthLabel = (monthKey: string) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const monthIdx = Number(monthStr) - 1;
      const monthName = monthNames[monthIdx] ?? monthKey;
      const shortYear = yearStr?.slice(-2) || yearStr;
      return `${monthName.slice(0, 3)} '${shortYear}`;
    };

    const weekStartKey = (dayKey: string) => {
      const date = new Date(`${dayKey}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return dayKey;
      const day = date.getUTCDay(); // 0=Sun..6=Sat
      const diffToMonday = (day + 6) % 7; // Mon => 0, Sun => 6
      date.setUTCDate(date.getUTCDate() - diffToMonday);
      return date.toISOString().slice(0, 10);
    };

    const weekLabel = (weekKey: string) => {
      const date = new Date(`${weekKey}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return weekKey;
      const monthName = monthNames[date.getUTCMonth()] ?? "";
      const day = date.getUTCDate();
      const year = String(date.getUTCFullYear()).slice(-2);
      return `Week of ${monthName.slice(0, 3)} ${day} '${year}`;
    };

    const longestStreakDays = (() => {
      const days = Array.from(activeDaysSet).sort();
      if (days.length === 0) return null;
      let best = 1;
      let current = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1]).getTime();
        const cur = new Date(days[i]).getTime();
        const diffDays = Math.round((cur - prev) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          current += 1;
          if (current > best) best = current;
        } else {
          current = 1;
        }
      }
      return best;
    })();

    const weekHighlights = (() => {
      const weekCounts = new Map<string, { prompts: number; chaos: number }>();
      for (const [dayKey, prompts] of dayMessageCount.entries()) {
        const chaos = dayChaosCount.get(dayKey) ?? 0;
        const wk = weekStartKey(dayKey);
        const current = weekCounts.get(wk) ?? { prompts: 0, chaos: 0 };
        current.prompts += prompts;
        current.chaos += chaos;
        weekCounts.set(wk, current);
      }

      let mostActiveWeek: string | null = null;
      let mostActivePrompts = -1;
      let mostChaoticWeek: string | null = null;
      let mostChaoticChaos = -1;

      for (const [wk, counts] of weekCounts.entries()) {
        if (counts.prompts > mostActivePrompts) {
          mostActivePrompts = counts.prompts;
          mostActiveWeek = weekLabel(wk);
        }
        if (counts.chaos > mostChaoticChaos) {
          mostChaoticChaos = counts.chaos;
          mostChaoticWeek = weekLabel(wk);
        }
      }

      return { mostActiveWeek, mostChaoticWeek };
    })();

    const monthStats = (() => {
      const stats = new Map<
        string,
        { chats: number; prompts: number; wins: number; friction: number; indecision: number }
      >();
      for (const conv of conversations) {
        if (!conv.month) continue;
        const current = stats.get(conv.month) ?? { chats: 0, prompts: 0, wins: 0, friction: 0, indecision: 0 };
        current.chats += 1;
        current.prompts += conv.userMessages;
        current.wins += conv.winSignals;
        current.friction += conv.frictionSignals;
        current.indecision += conv.indecisionSignals;
        stats.set(conv.month, current);
      }
      return stats;
    })();

    const projects = (() => {
      const candidates = conversations.filter((c) => c.intent !== "vent");

      const clusters = new Map<
        string,
        {
          projectKey: string;
          primaryStack: string;
          chats: number;
          prompts: number;
          months: Set<string>;
          stackCounts: Map<string, number>;
          wins: number;
          friction: number;
        }
      >();

      for (const conv of candidates) {
        const projectKey = conv.themeKey ?? conv.topicKey ?? (conv.intent === "debug" ? "debug" : conv.intent);
        const primaryStack = conv.stack[0] ?? "General";
        const clusterKey = `${projectKey}|${primaryStack}`;

        const current =
          clusters.get(clusterKey) ?? {
            projectKey,
            primaryStack,
            chats: 0,
            prompts: 0,
            months: new Set<string>(),
            stackCounts: new Map<string, number>(),
            wins: 0,
            friction: 0,
          };

        current.chats += 1;
        current.prompts += conv.userMessages;
        if (conv.month) current.months.add(conv.month);
        current.wins += conv.winSignals;
        current.friction += conv.frictionSignals;
        for (const tool of conv.stack) {
          current.stackCounts.set(tool, (current.stackCounts.get(tool) ?? 0) + 1);
        }
        clusters.set(clusterKey, current);
      }

      const themeTitle = (key: string) => {
        switch (key) {
          case "automation":
            return "The Automation Sprint";
          case "dashboard":
            return "The Dashboard Era";
          case "api":
            return "The API Season";
          case "data":
            return "The Data Dungeon";
          case "deploy":
            return "The Deploy Pipeline";
          case "debug":
            return "The Debug Dungeon";
          case "writing":
            return "The Rewrite Spiral";
          case "career":
            return "The Career Moves Era";
          case "travel":
            return "The Trip Planning Saga";
          case "planning":
            return "The Productivity System";
          case "plan":
            return "The Productivity System";
          case "learning":
            return "The Learning Sprint";
          case "learn":
            return "The Learning Sprint";
          case "creative":
            return "The Creative Playground";
          case "write":
            return "The Rewrite Spiral";
          case "build":
            return "The Build Cycle";
          case "coding":
            return "The Build Cycle";
          default:
            return "The Build Cycle";
        }
      };

      const whatBuilt = (key: string) => {
        switch (key) {
          case "automation":
            return "You tried to automate the boring parts and keep things moving.";
          case "dashboard":
            return "You built dashboards so you could see what was going on.";
          case "api":
            return "You wired endpoints and made systems talk.";
          case "data":
            return "You fought data until it behaved.";
          case "deploy":
            return "You shipped, broke it, and shipped again.";
          case "debug":
            return "You wrestled bugs until they tapped out.";
          case "writing":
            return "You rewrote until it sounded like you.";
          case "career":
            return "You workshopped your next move like it mattered.";
          case "travel":
            return "You planned it like you were allergic to surprises.";
          case "planning":
            return "You turned chaos into a plan. Repeatedly.";
          case "plan":
            return "You turned chaos into a plan. Repeatedly.";
          case "learning":
            return "You kept pushing until it clicked.";
          case "learn":
            return "You kept pushing until it clicked.";
          case "creative":
            return "You played with ideas until one sparked.";
          case "write":
            return "You rewrote until it sounded like you.";
          case "build":
            return "You built small things and kept iterating.";
          default:
            return "You built small things and kept iterating.";
        }
      };

      const projectSummaries: RewindProjectSummary[] = Array.from(clusters.values())
        .sort((a, b) => b.prompts - a.prompts)
        .slice(0, 5)
        .map((cluster) => {
          const monthsActive = Array.from(cluster.months).sort().map(monthLabel);
          const stack = pickTopFromCounts(cluster.stackCounts, 7);
          const intensity: RewindProjectSummary["intensity"] =
            cluster.chats >= 60 ? "obsessive" : cluster.chats >= 20 ? "steady" : "light";

          const lastMonthKey = Array.from(cluster.months).sort().slice(-1)[0] ?? null;
          const lastMonthDate = lastMonthKey ? new Date(`${lastMonthKey}-15T00:00:00Z`).getTime() : null;
          const daysSinceLast =
            lastMonthDate != null ? Math.floor((nowMs - lastMonthDate) / (24 * 60 * 60 * 1000)) : null;

          const statusGuess: RewindProjectSummary["statusGuess"] =
            daysSinceLast != null && daysSinceLast <= 45
              ? "recurring"
            : cluster.wins > 0 && cluster.wins >= cluster.friction
                ? "shipped"
                : cluster.friction >= cluster.wins * 2 && cluster.chats >= 6
                  ? "abandoned"
                  : "unknown";

          const label =
            cluster.primaryStack !== "General"
              ? `${themeTitle(cluster.projectKey)} (${cluster.primaryStack})`
              : themeTitle(cluster.projectKey);

          return {
            projectLabel: label,
            whatYouBuilt: whatBuilt(cluster.projectKey),
            stack,
            monthsActive,
            chats: cluster.chats,
            prompts: cluster.prompts,
            intensity,
            statusGuess,
          };
        });

      return projectSummaries;
    })();

    const bossFights = (() => {
      const indecisionTotal = conversations.reduce((acc, c) => acc + c.indecisionSignals, 0);
      const candidates: RewindBossFight[] = [];

      if (behavior.brokenCount > 0) {
        const phrase = behavior.whyBrokenCount >= behavior.doesntWorkCount ? "why is this broken" : "doesn't work";
        candidates.push({
          title: "Your biggest enemy",
          count: behavior.brokenCount,
          example: `"${phrase}"`,
        });
      }
      if (behavior.againCount + behavior.stillCount > 0) {
        candidates.push({
          title: "Again. Still. Again.",
          count: behavior.againCount + behavior.stillCount,
          example: "\"again\" / \"still\"",
        });
      }
      if (behavior.wtfCount > 0) {
        candidates.push({ title: "WTF moments", count: behavior.wtfCount, example: "\"wtf\"" });
      }
      if (behavior.questionBurstMessageCount > 0) {
        candidates.push({
          title: "The ??? spiral",
          count: behavior.questionBurstMessageCount,
          example: "\"???\"",
        });
      }
      if (behavior.yellingMessageCount > 0) {
        candidates.push({
          title: "CAPS LOCK cameo",
          count: behavior.yellingMessageCount,
          example: "CAPS",
        });
      }
      if (indecisionTotal > 0) {
        candidates.push({
          title: "Decision paralysis",
          count: indecisionTotal,
          example: "\"should i\"",
        });
      }

      candidates.sort((a, b) => b.count - a.count);
      return candidates.slice(0, 3);
    })();

    const wins = (() => {
      const shippedProjects = projects.filter((p) => p.statusGuess === "shipped").length;
      const comebackChats = conversations.filter((c) => c.comeback).length;
      const flowChats = conversations.filter((c) => c.mood === "flow").length;
      const totalWins = winSignalTotal;

      const candidates: Array<{ title: string; count: number }> = [];
      if (shippedProjects > 0) candidates.push({ title: "Projects you actually shipped", count: shippedProjects });
      if (comebackChats > 0) candidates.push({ title: "Comeback moments (friction -> win)", count: comebackChats });
      if (flowChats > 0) candidates.push({ title: "Flow-state chats", count: flowChats });
      if (totalWins > 0) candidates.push({ title: "You got to 'it worked'", count: totalWins });

      candidates.sort((a, b) => b.count - a.count);
      return candidates.slice(0, 3);
    })();

    const comebackMoment = (() => {
      const count = conversations.filter((c) => c.comeback).length;
      if (count < 3) return null;
      return {
        title: "Comeback moment",
        detail: `You went from stuck to solved in ${count.toLocaleString()} chats.`,
      };
    })();

    const timeline = (() => {
      const entries = Array.from(monthStats.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const flowMonths: string[] = [];
      const frictionMonths: string[] = [];

      let villainMonth: string | null = null;
      let villainScore = -1;
      let mostIndecisiveMonth: string | null = null;
      let indecisiveScore = -1;

      for (const [monthKey, s] of entries) {
        const label = monthLabel(monthKey);
        const chaosScore = s.friction * 3 + s.indecision * 2 + s.chats;
        if (chaosScore > villainScore) {
          villainScore = chaosScore;
          villainMonth = label;
        }

        const indecisionPerChat = s.chats > 0 ? s.indecision / s.chats : 0;
        if (indecisionPerChat > indecisiveScore) {
          indecisiveScore = indecisionPerChat;
          mostIndecisiveMonth = label;
        }

        if (s.chats >= 10 && s.wins > s.friction) flowMonths.push(label);
        if (s.chats >= 10 && s.friction > s.wins) frictionMonths.push(label);
      }

      return {
        flowMonths: flowMonths.slice(0, 3),
        frictionMonths: frictionMonths.slice(0, 3),
        villainMonth,
        longestStreakDays,
        mostIndecisiveMonth,
        mostActiveWeek: weekHighlights.mostActiveWeek,
        mostChaoticWeek: weekHighlights.mostChaoticWeek,
      };
    })();

    const weirdRabbitHole = (() => {
      const counts = new Map<string, number>();
      for (const conv of conversations) {
        for (const tool of conv.stack) {
          counts.set(tool, (counts.get(tool) ?? 0) + 1);
        }
      }
      const blacklist = new Set(["Git", "GitHub", "Windows", "Linux", "macOS"]);
      const candidates = Array.from(counts.entries())
        .filter(([tool, count]) => count <= 2 && !blacklist.has(tool))
        .sort((a, b) => a[1] - b[1]);
      const pick = candidates[0];
      if (!pick) return null;
      return {
        title: "Your weirdest rabbit hole",
        detail: `${pick[0]}. It showed up, then vanished.`,
      };
    })();

    const archetype = (() => {
      const top = topTopics[0]?.key ?? null;
      const builderProjects = projects.length;
      const chaos = behavior.brokenCount + behavior.wtfCount + behavior.questionBurstMessageCount + behavior.yellingMessageCount;

      if (top === "coding" && builderProjects >= 3) {
        return { key: "builder", title: "The Builder", line: "You didn't use AI to browse. You used it to build." };
      }
      if (top === "coding" && chaos >= 20) {
        return { key: "debugger", title: "The Debugger", line: "You used AI like a co-pilot. And a punching bag." };
      }
      if (top === "writing") {
        return { key: "editor", title: "The Editor", line: "You came here to make the words behave." };
      }
      if (top === "planning") {
        return { key: "planner", title: "The Planner", line: "You turned chaos into a plan. Repeatedly." };
      }
      if (top === "learning") {
        return { key: "student", title: "The Learner", line: "You kept pushing until it clicked." };
      }
      return { key: "regular", title: "The Regular (with a twist)", line: "You came here to think out loud until it made sense." };
    })();

    const hook = (() => {
      const identity = archetype.line;
      const brag =
        projects.length >= 5
          ? `You built ${projects.length} different things. Casual users don't do that.`
          : projects.length > 0
            ? `You built ${projects.length} different things. Then you came back for more.`
            : totalConversations >= 200
              ? "This wasn't casual curiosity. This was a habit."
              : "Not a phase. Just a very useful second brain.";

      const roast =
        bossFights[0]?.title === "Your biggest enemy" && bossFights[0]?.example
          ? `Your biggest enemy this year: ${bossFights[0].example}.`
          : behavior.pleaseCount >= 200
            ? `You said "please" ${behavior.pleaseCount.toLocaleString()} times. Polite. Until it didn't work.`
            : "You asked nicely. Then asked again. Then asked better.";

      return { identity, brag, roast };
    })();

    const forecast = (() => {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`;
      const recent = conversations.filter((c) => c.month && c.month >= cutoffKey);

      const intentCounts: Record<RewindIntent, number> = {
        build: 0,
        debug: 0,
        write: 0,
        plan: 0,
        learn: 0,
        decide: 0,
        vent: 0,
        brainstorm: 0,
        other: 0,
      };
      const themeCounts = new Map<string, number>();
      for (const conv of recent) {
        intentCounts[conv.intent] += 1;
        if (conv.themeKey) themeCounts.set(conv.themeKey, (themeCounts.get(conv.themeKey) ?? 0) + 1);
      }

      const topIntent = pickTopKey<RewindIntent>(intentCounts, "other");
      const topTheme = Array.from(themeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const themeLabel = topTheme ? PROJECT_THEMES.find((t) => t.key === topTheme)?.label ?? topTheme : null;

      const boss = bossFights[0]?.example ?? bossFights[0]?.title ?? "chaos";

      const upgrade =
        promptLengthChangePercent != null && promptLengthChangePercent < 0
          ? "Fewer words. More intent."
          : promptLengthChangePercent != null && promptLengthChangePercent > 0
            ? "More context. More control."
            : "Sharper asks. Faster loops.";

      const intentLine = (() => {
        switch (topIntent) {
          case "build":
            return "build things";
          case "debug":
            return "fix things";
          case "write":
            return "rewrite things";
          case "plan":
            return "plan ahead";
          case "learn":
            return "learn faster";
          case "decide":
            return "talk yourself into decisions";
          case "vent":
            return "vent (briefly)";
          case "brainstorm":
            return "brainstorm harder";
          default:
            return "ask better questions";
        }
      })();

      return [
        `You'll likely do more ${themeLabel ? themeLabel.toLowerCase() : intentLine}.`,
        `You'll probably fight ${boss} again.`,
        `Your next upgrade: ${upgrade}`,
      ];
    })();

    const closingLine =
      projects.length > 0
        ? "This wasn't about answers. It was about building momentum."
        : "This wasn't about answers. It was about getting unstuck.";

    const wrapped: RewindWrappedSummary = {
      archetype,
      hook,
      projects,
      bossFights,
      wins,
      comebackMoment,
      timeline,
      weirdRabbitHole,
      forecast,
      closingLine,
    };

    return {
      totalConversations,
      totalUserMessages,
      activeDays: activeDaysSet.size,
      busiestMonth,
      peakHour,
      lateNightPercent,
      topTopics,
      frequentPhrases,
      nicknames,
      topWord,
      longestPromptChars: totalUserMessages > 0 ? longestPromptChars : null,
      avgPromptChars,
      promptLengthChangePercent,
      behavior,
      conversations,
      wrapped,
    };
  };

  return { addConversation, summary };
}

export function analyzeChatExport(conversations: unknown[], options?: { now?: Date; daysBack?: number }): RewindSummary {
  const analyzer = createRewindAnalyzer(options);
  for (const conv of conversations) analyzer.addConversation(conv);
  return analyzer.summary();
}
