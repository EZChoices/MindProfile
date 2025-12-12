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

export interface RewindSummary {
  totalConversations: number;
  totalUserMessages: number;
  activeDays: number;
  busiestMonth: string | null;
  peakHour: number | null;
  lateNightPercent: number;
  topTopics: TopicInsight[];
  frequentPhrases: PhraseInsight[];
  topWord: string | null;
  longestPromptChars: number | null;
  avgPromptChars: number | null;
  promptLengthChangePercent: number | null;
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
]);

const HABIT_PHRASES: Array<{ phrase: string; pattern: RegExp }> = [
  { phrase: "thank you", pattern: /\bthanks\b|\bthank you\b/gi },
  { phrase: "please", pattern: /\bplease\b/gi },
  { phrase: "quick question", pattern: /\bquick question\b/gi },
  { phrase: "step by step", pattern: /\bstep by step\b/gi },
  { phrase: "one more thing", pattern: /\bone more (thing)?\b/gi },
  { phrase: "what about", pattern: /\bwhat about\b/gi },
  { phrase: "can you", pattern: /\bcan you\b/gi },
  { phrase: "explain like I’m 5", pattern: /\bexplain (it )?like (i'?m|i am) (5|five)\b/gi },
];

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

const tokenize = (textLower: string): string[] =>
  textLower.split(/[^a-z0-9'\-]+/).filter(Boolean);

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

  const activeDaysSet = new Set<string>();
  const monthCount = new Map<string, number>();
  const hourCount = Array.from({ length: 24 }, () => 0);
  let timestampCount = 0;
  let lateNightCount = 0;

  const topicCounts = new Map<string, number>();
  const wordFreq = new Map<string, number>();
  const habitCounts = new Map<string, number>();

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

    const matchedTopics = new Set<string>();
    for (const bucket of TOPIC_BUCKETS) {
      if (bucket.keywords.some((kw) => titleLower.includes(kw))) {
        matchedTopics.add(bucket.key);
      }
    }

    const messages = extractConversationMessages(convRecord);
    let conversationHasIncluded = false;

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

      const len = trimmed.length;
      totalPromptChars += len;
      if (len > longestPromptChars) longestPromptChars = len;

      const lowered = trimmed.toLowerCase();

      // Topics (only check buckets not already hit this conversation)
      for (const bucket of TOPIC_BUCKETS) {
        if (matchedTopics.has(bucket.key)) continue;
        if (bucket.keywords.some((kw) => lowered.includes(kw))) {
          matchedTopics.add(bucket.key);
        }
      }

      // Fun phrases / habits
      for (const habit of HABIT_PHRASES) {
        const hits = countMatches(lowered, habit.pattern);
        if (hits > 0) {
          habitCounts.set(habit.phrase, (habitCounts.get(habit.phrase) ?? 0) + hits);
        }
      }

      // Word frequencies
      const tokens = tokenize(lowered);
      for (const token of tokens) {
        if (token.startsWith("[")) continue;
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
    for (const key of matchedTopics) {
      topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
    }
  };

  const summary = (): RewindSummary => {
    const avgPromptChars =
      totalUserMessages > 0 ? Math.round(totalPromptChars / totalUserMessages) : null;

    const topWord =
      Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const frequentPhrases = Array.from(habitCounts.entries())
      .filter(([, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
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

    return {
      totalConversations,
      totalUserMessages,
      activeDays: activeDaysSet.size,
      busiestMonth,
      peakHour,
      lateNightPercent,
      topTopics,
      frequentPhrases,
      topWord,
      longestPromptChars: totalUserMessages > 0 ? longestPromptChars : null,
      avgPromptChars,
      promptLengthChangePercent,
    };
  };

  return { addConversation, summary };
}

export function analyzeChatExport(conversations: unknown[], options?: { now?: Date; daysBack?: number }): RewindSummary {
  const analyzer = createRewindAnalyzer(options);
  for (const conv of conversations) analyzer.addConversation(conv);
  return analyzer.summary();
}
