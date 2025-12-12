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

const readCreateTime = (message: unknown): number => {
  const record = asRecord(message);
  const raw = record?.create_time ?? asRecord(record?.message)?.create_time;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
};

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
    mapped.sort((a, b) => readCreateTime(a) - readCreateTime(b));
    return mapped;
  }

  const directMessages = conv.messages ?? nestedConv?.messages;
  return Array.isArray(directMessages) ? directMessages : [];
};

export function analyzeChatExport(conversations: unknown[]): RewindSummary {
  const totalConversations = conversations.length;

  const userMessages: Array<{ text: string; createdAt: Date | null }> = [];
  const perConversationText: string[] = [];

  for (const conv of conversations) {
    const convRecord = asRecord(conv);
    if (!convRecord) continue;

    const titleRaw = convRecord.title;
    const title = typeof titleRaw === "string" ? titleRaw : "";
    const messages = extractConversationMessages(convRecord);
    const convoParts: string[] = [];

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

      const rawText = normalizeMessageContent(msgRecord);
      if (!rawText) continue;

      const { sanitized } = anonymizeText(rawText);
      const trimmed = sanitized.trim();
      if (!trimmed.length) continue;

      const createdAt =
        parseTimestamp(msgRecord.create_time) ??
        parseTimestamp(nestedMessageRecord?.create_time) ??
        parseTimestamp(convRecord.create_time) ??
        null;

      userMessages.push({ text: trimmed, createdAt });
      convoParts.push(trimmed);
    }

    const convoText = `${title}\n${convoParts.join("\n")}`.trim();
    if (convoText.length) perConversationText.push(convoText.toLowerCase());
  }

  const totalUserMessages = userMessages.length;

  const wordFreq = new Map<string, number>();
  const bigramFreq = new Map<string, number>();
  let longestPromptChars = 0;
  let totalPromptChars = 0;

  const timestamps: Date[] = [];

  for (const msg of userMessages) {
    const lowered = msg.text.toLowerCase();
    const tokens = lowered.split(/[^a-z0-9'\-]+/).filter(Boolean);

    for (const token of tokens) {
      if (token.startsWith("[")) continue;
      if (token.length < 3) continue;
      if (STOPWORDS.has(token)) continue;
      if (/^\d+$/.test(token)) continue;
      wordFreq.set(token, (wordFreq.get(token) ?? 0) + 1);
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      const a = tokens[i];
      const b = tokens[i + 1];
      if (!a || !b) continue;
      if (a.startsWith("[") || b.startsWith("[")) continue;
      const phrase = `${a} ${b}`;
      if (phrase.length > 40) continue;
      bigramFreq.set(phrase, (bigramFreq.get(phrase) ?? 0) + 1);
    }

    const len = msg.text.length;
    totalPromptChars += len;
    if (len > longestPromptChars) longestPromptChars = len;

    if (msg.createdAt) timestamps.push(msg.createdAt);
  }

  const avgPromptChars =
    totalUserMessages > 0 ? Math.round(totalPromptChars / totalUserMessages) : null;

  const topWord =
    Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const frequentPhrases = Array.from(bigramFreq.entries())
    .filter(([phrase, count]) => {
      if (count < 5) return false;
      const [a, b] = phrase.split(" ");
      if (!a || !b) return false;
      if (STOPWORDS.has(a) && STOPWORDS.has(b)) return false;
      return true;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase, count]) => ({ phrase, count }));

  const topicCounts = new Map<string, number>();
  for (const text of perConversationText) {
    for (const bucket of TOPIC_BUCKETS) {
      if (bucket.keywords.some((kw) => text.includes(kw))) {
        topicCounts.set(bucket.key, (topicCounts.get(bucket.key) ?? 0) + 1);
      }
    }
  }

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

  // Usage stats
  const activeDaysSet = new Set<string>();
  const monthCount = new Map<string, number>();
  const hourCount = Array.from({ length: 24 }, () => 0);
  let lateNightCount = 0;

  const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());

  for (const d of sortedTimestamps) {
    const dayKey = d.toISOString().slice(0, 10);
    activeDaysSet.add(dayKey);

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCount.set(monthKey, (monthCount.get(monthKey) ?? 0) + 1);

    const hour = d.getHours();
    hourCount[hour] += 1;
    if (hour >= 23 || hour <= 4) lateNightCount += 1;
  }

  const activeDays = activeDaysSet.size;
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
    sortedTimestamps.length > 0
      ? Math.round((lateNightCount / sortedTimestamps.length) * 100)
      : 0;

  // Prompt length change (early vs late)
  let promptLengthChangePercent: number | null = null;
  if (sortedTimestamps.length >= 10) {
    const byTime = userMessages
      .filter((m) => m.createdAt)
      .sort((a, b) => (a.createdAt!.getTime() - b.createdAt!.getTime()));
    const mid = Math.floor(byTime.length / 2);
    const early = byTime.slice(0, mid);
    const late = byTime.slice(mid);
    const avgEarly =
      early.reduce((acc, m) => acc + m.text.length, 0) / Math.max(1, early.length);
    const avgLate =
      late.reduce((acc, m) => acc + m.text.length, 0) / Math.max(1, late.length);
    if (avgEarly > 0) {
      const diff = ((avgLate - avgEarly) / avgEarly) * 100;
      if (Math.abs(diff) >= 10) {
        promptLengthChangePercent = Math.round(diff);
      }
    }
  }

  return {
    totalConversations,
    totalUserMessages,
    activeDays,
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
}
