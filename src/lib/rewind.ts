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

export interface RewindEvidencePointer {
  conversationId: string | null;
  msgId?: string | null;
  startDay: string | null;
  endDay: string | null;
  snippets: string[];
}

export type ForensicIntent =
  | "info_seeking"
  | "decision_support"
  | "brainstorming"
  | "drafting_editing"
  | "coding_technical"
  | "planning"
  | "emotional_processing"
  | "conflict_scripting"
  | "self_reflection"
  | "productivity_accountability";

export type ForensicDomain =
  | "work_career"
  | "relationships"
  | "health_fitness"
  | "money"
  | "creative"
  | "learning"
  | "admin_life_ops"
  | "travel"
  | "other";

export type ForensicCognitiveMode = "exploratory" | "convergent" | "debugging" | "reflective";

export type ForensicTone = "calm" | "frustrated" | "anxious" | "excited" | "uncertain" | "motivated" | "tired";

export type ForensicHelpType =
  | "structure"
  | "reassurance"
  | "critique"
  | "step_by_step"
  | "examples"
  | "templates"
  | "accountability";

export interface RewindMessageTags {
  intents: ForensicIntent[];
  domains: ForensicDomain[];
  cognitiveMode: ForensicCognitiveMode;
  tones: ForensicTone[];
  helpTypes: ForensicHelpType[];
  selfDisclosure: { present: boolean; selfStatements: string[] };
}

export interface RewindInsight {
  key: string;
  title: string;
  observation: string;
  evidence: {
    counts: string[];
    excerpts: string[];
    pointers: RewindEvidencePointer[];
  };
  interpretation: string;
  cost: string;
  experiment: string;
  successMetric: string;
  confidence: number;
}

export interface RewindActionPlan {
  keepDoing: string[];
  adjust: string[];
  stopDoing: string[];
  promptTemplates: Array<{ title: string; template: string }>;
}

export interface RewindDeepDive {
  useMap: {
    totalSessions: number;
    avgSessionMins: number | null;
    avgPromptsPerSession: number | null;
    resolvedSessions: number;
    abandonedSessions: number;
    intents: Array<{ key: ForensicIntent; label: string; count: number; pct: number }>;
    domains: Array<{ key: ForensicDomain; label: string; count: number; pct: number }>;
    cognitiveModes: Array<{ key: ForensicCognitiveMode; label: string; count: number; pct: number }>;
    tones: Array<{ key: ForensicTone; label: string; count: number; pct: number }>;
    helpTypes: Array<{ key: ForensicHelpType; label: string; count: number; pct: number }>;
    topOpeners: Array<{ label: string; count: number; excerpt: string | null; evidence: RewindEvidencePointer[] }>;
    topEndings: Array<{ label: string; count: number; evidence: RewindEvidencePointer[] }>;
    ratios: {
      exploratorySessions: number;
      convergentSessions: number;
      line: string;
    };
  };
  signaturePrompts: {
    openingMoves: Array<{ phrase: string; count: number }>;
    constraints: Array<{ label: string; count: number; line: string }>;
  };
  loops: Array<{
    key: string;
    title: string;
    observation: string;
    evidenceLine: string;
    evidence: RewindEvidencePointer[];
    cost: string;
    experiment: string;
    successMetric: string;
    confidence: number;
  }>;
  relationshipStyle: {
    primary: string;
    line: string;
    roles: Array<{ role: string; count: number; pct: number }>;
  };
  insights: RewindInsight[];
  actionPlan: RewindActionPlan;
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
  conversationId: string | null;
  topicKey: string | null;
  themeKey: string | null;
  month: string | null;
  startDay: string | null;
  endDay: string | null;
  oneLineSummary: string;
  evidenceSnippets: string[];
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
  hasBroken: boolean;
  hasWtf: boolean;
  hasAgainStill: boolean;
  hasQuickIntro: boolean;
}

export interface RewindProjectSummary {
  key: string;
  projectLabel: string;
  projectLabelPrivate: string | null;
  whatYouBuilt: string;
  whatYouBuiltPrivate: string | null;
  stack: string[];
  monthsActive: string[];
  range: string | null;
  chats: number;
  prompts: number;
  intensity: "light" | "steady" | "obsessive";
  statusGuess: "shipped" | "abandoned" | "recurring" | "unknown";
  evidence: RewindEvidencePointer[];
}

export interface RewindBossFight {
  key: string;
  title: string;
  chats: number;
  peak: string | null;
  during: string | null;
  example: string;
  intensityLine: string;
  evidence: RewindEvidencePointer[];
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
  trips: {
    tripCount: number;
    topTrips: Array<{
      key: string;
      month: string | null;
      range: string | null;
      destination: string | null;
      title: string;
      titlePrivate: string | null;
      line: string;
      confidence: number;
      level: "high" | "medium" | "low";
      excerpt: string | null;
      evidence: RewindEvidencePointer[];
    }>;
  };
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
  rabbitHoles: Array<{
    key: string;
    title: string;
    range: string;
    chats: number;
    days: number;
    why: string;
    excerpt: string | null;
    evidence: RewindEvidencePointer[];
  }>;
  lifeHighlights: Array<{
    key: string;
    type: string;
    month: string | null;
    title: string;
    titlePrivate: string | null;
    line: string;
    confidence: number;
    level: "high" | "medium" | "low";
    excerpt: string | null;
    evidence: RewindEvidencePointer[];
  }>;
  bestMoments: Array<{
    key: string;
    title: string;
    month: string | null;
    line: string;
    excerpt: string | null;
    evidence: RewindEvidencePointer[];
  }>;
  growthUpgrades: Array<{
    title: string;
    line: string;
    delta: string | null;
  }>;
  youVsYou: string[];
  forecast: string[];
  deepDive: RewindDeepDive;
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
  coverage: {
    sinceMonth: string;
    untilMonth: string;
    timezone: string;
  };
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
  privacyScan: {
    emails: number;
    phones: number;
    urls: number;
    handles: number;
    ips: number;
    ids: number;
    secrets: number;
    ssns: number;
    cards: number;
    names: number;
    passwords: number;
    addresses: number;
  };
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

const HEDGE_PATTERNS: RegExp[] = [
  /\bmaybe\b/i,
  /\bnot sure\b/i,
  /\bunsure\b/i,
  /\bprobably\b/i,
  /\bperhaps\b/i,
  /\bi think\b/i,
  /\bkind of\b/i,
  /\bkinda\b/i,
  /\bsort of\b/i,
];

const CONSTRAINT_PATTERNS: RegExp[] = [
  /\bmust\b/i,
  /\bexactly\b/i,
  /\bonly\b/i,
  /\bstrictly\b/i,
  /\bno more than\b/i,
  /\bformat\b/i,
  /\bjson\b/i,
  /\bschema\b/i,
  /\boutput\b/i,
  /\breturn\b/i,
  /\bdo not\b/i,
  /\bdon't\b/i,
  /\bavoid\b/i,
];

const TRAVEL_CUE_PATTERN =
  /\b(flight|flights|hotel|airbnb|itinerary|visa|passport|trip|travel|vacation|holiday|booking|booked|reservation|train|rail|airport|things to do)\b/i;

const TRAVEL_STRONG_PATTERN =
  /\b(book(?:ed|ing)?|reservation|itinerary|passport|visa|flight|hotel|airbnb|airport|train|tickets?)\b/i;

const TRAVEL_DESTINATION_PATTERNS: RegExp[] = [
  /\b(?:trip|travel|vacation|holiday|flight|flights|go(?:ing)?|visit(?:ing)?)\s+(?:to|in)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\b/i,
  /\b(?:hotel|airbnb|stay|staying)\s+(?:in|at)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\b/i,
  /\bthings to do in\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\b/i,
];

type TravelDestinationMatch = { destination: string; snippet: string };

const extractTravelDestinationMatch = (text: string): TravelDestinationMatch | null => {
  for (const pattern of TRAVEL_DESTINATION_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    const captured = match?.[1];
    if (!captured) continue;
    const cleaned = captured.replace(/[^A-Za-z\s'-]/g, "").replace(/\s{2,}/g, " ").trim();
    if (!cleaned) continue;
    if (cleaned.length > 40) continue;
    return { destination: cleaned, snippet: match?.[0] ?? cleaned };
  }
  return null;
};

const TRANSLATION_CUE_PATTERN = /\b(?:translate|translating|translated|translation|localize|localization|i18n|locale)\b/i;

const LANGUAGE_NAMES = [
  "spanish",
  "french",
  "german",
  "italian",
  "portuguese",
  "russian",
  "arabic",
  "hindi",
  "japanese",
  "korean",
  "mandarin",
  "chinese",
];

const LANGUAGE_LEARN_PATTERN = new RegExp(
  `\\b(?:learn(?:ing)?|study(?:ing)?|practice(?:d|ing)?|improve|improving)\\s+(?:some\\s+)?(${LANGUAGE_NAMES.join("|")})\\b`,
  "i",
);

const LANGUAGE_PRACTICE_PATTERN = new RegExp(
  `\\b(${LANGUAGE_NAMES.join("|")})\\s+(?:grammar|vocab|vocabulary|conjugation|practice|lesson|course)\\b`,
  "i",
);

const FITNESS_EVENT_PATTERNS: RegExp[] = [
  /\b(started|starting|getting into|training for)\s+(?:the\s+)?(gym|workouts?|running|yoga)\b/i,
  /\b(gym|workouts?|yoga)\s+(?:routine|plan|schedule)\b/i,
  /\btraining for\s+(?:a\s+)?(marathon|half marathon)\b/i,
];

const FITNESS_TECH_EXCLUDE = /\b(running|run)\s+(?:the\s+)?(code|script|program|tests?|server|app|build|deploy(?:ment)?|pipeline)\b/i;

const FOOD_EVENT_PATTERNS: RegExp[] = [
  /\b(trying|tried|started|starting|learning)\s+(?:to\s+)?(baking|cooking)\b/i,
  /\b(baking|cooking)\s+(?:phase|era)\b/i,
  /\brecipe\s+(?:for|on)\s+(?:the\s+|a\s+|an\s+)?([a-z][a-z0-9' -]{2,40})\b/i,
  /\b(?:how to\s+)?(?:cook|make|bake|grill|sous vide|sear|smoke|roast)\s+(?:the\s+|a\s+|an\s+)?([a-z][a-z0-9' -]{2,40})\b/i,
];

const CAREER_EVENT_PATTERNS: RegExp[] = [
  /\b(resume|cv)\b/i,
  /\b(job\s+offer|offer\s+letter)\b/i,
  /\b(interview|interviews)\b/i,
  /\b(salary|negotiation|promotion)\b/i,
];

const MOVE_EVENT_PATTERNS: RegExp[] = [
  /\b(moving|move|relocating|relocation)\b/i,
  /\b(apartment|lease|rent|mortgage)\b/i,
];

const SESSION_GAP_MS = 45 * 60 * 1000;

const ADDRESS_LIKE_PATTERN =
  /\b\d{1,6}\s+[A-Za-z0-9.'\- ]{3,48}\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Place|Pl|Terrace|Ter)\b/i;

const PASSWORD_LIKE_PATTERN = /\b(?:password|passwd|pwd)\b\s*[:=]\s*\S{3,}/i;

const relationshipCuePattern =
  /\b(girlfriend|boyfriend|partner|wife|husband|dating|relationship|breakup|ex|crush|friend|friends|mom|dad|mother|father|sister|brother|family)\b/i;

const moneyCuePattern =
  /\b(budget|spending|income|invest|investment|stocks?|crypto|tax|taxes|debt|loan|credit|mortgage|interest rate|rent)\b/i;

const healthCuePattern =
  /\b(doctor|therapy|therapist|meds?|medicine|symptom|diagnos(?:is|ed)|sick|illness|health|sleep|insomnia|diet|nutrition)\b/i;

const emotionalCuePattern =
  /\b(anxious|anxiety|stressed|stress|overwhelmed|sad|depressed|angry|lonely|burnt out|burned out|panic|worried|worry)\b/i;

const excitedCuePattern = /\b(excited|hyped|can't wait|can’t wait|let's go|lets go|awesome|amazing)\b/i;

const tiredCuePattern = /\b(tired|exhausted|burnt out|burned out|sleepy)\b/i;

const conflictCuePattern =
  /\b(what should i say|how do i respond|help me respond|reply to|text (?:him|her|them)|message (?:him|her|them)|write a message|draft a text|apology message)\b/i;

const selfReflectionCuePattern =
  /\b(what does this say about me|why do i|what's wrong with me|what is wrong with me|am i (?:the|a)|my personality|how do i change|i keep doing this)\b/i;

const planningCuePattern =
  /\b(plan|roadmap|schedule|timeline|checklist|itinerary|steps?|next steps|week plan|routine)\b/i;

const draftingCuePattern =
  /\b(rewrite|rephrase|edit|proofread|tone|voice|make this sound|draft|email|cover letter|resume|cv|linkedin|bio)\b/i;

const brainstormingCuePattern = /\b(brainstorm|ideas?|options?|alternatives?|different ways|creative)\b/i;

const decisionCuePattern =
  /\b(should i|which (?:is|one|option)|pick|choose|decide|decision|pros and cons|what's better|what is better|recommend)\b/i;

const structureCuePattern = /\b(outline|structure|framework|checklist|bullet|bullets|table|rubric)\b/i;

const reassuranceCuePattern = /\b(is it ok(?:ay)?|am i ok(?:ay)?|should i worry|reassure|normal to|is this normal)\b/i;

const critiqueCuePattern = /\b(critique|feedback|review|roast|be harsh|be brutally honest)\b/i;

const exampleCuePattern = /\b(example|examples|show me|sample)\b/i;

const templateCuePattern = /\b(template|boilerplate|format|script)\b/i;

const accountabilityCuePattern = /\b(accountability|hold me accountable|check in|remind me|daily check)\b/i;

const selfStatementCuePattern =
  /\b(i'm|i am|i feel|i keep|i can'?t|i want|i need|i have|my|we're|we are|we keep)\b/i;

const FIRST_PERSON_CUE_PATTERN = /\b(i|i'm|im|i am|my|me|we|we're|we are|our|us)\b/i;
const EXAMPLE_CUE_PATTERN = /\b(example|for example|for instance|e\.g\.|like this|say something like)\b/i;
const PROMPT_META_CUE_PATTERN = /\b(prompt|system prompt|template|instruction)\b/i;

const splitSentences = (text: string) =>
  text
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const findSentenceWithNeedle = (text: string, needleLower: string) => {
  if (!text) return "";
  const sentences = splitSentences(text);
  const match = sentences.find((s) => s.toLowerCase().includes(needleLower));
  return match ?? text;
};

const isExampleContext = (sentenceLower: string) => {
  if (!sentenceLower) return false;
  if (EXAMPLE_CUE_PATTERN.test(sentenceLower)) return true;
  if (PROMPT_META_CUE_PATTERN.test(sentenceLower) && !FIRST_PERSON_CUE_PATTERN.test(sentenceLower)) return true;
  return false;
};

const maskObviousSecrets = (text: string) =>
  text
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[private key]")
    .replace(PASSWORD_LIKE_PATTERN, "[password]");

const detectSelfStatements = (text: string): string[] => {
  const withoutCode = stripCodeBlocks(text);
  const safe = compressWhitespace(withoutCode);
  if (!selfStatementCuePattern.test(safe.toLowerCase())) return [];
  const sentences = splitSentences(safe);
  const statements: string[] = [];
  for (const sentence of sentences) {
    const lowered = sentence.toLowerCase();
    if (!selfStatementCuePattern.test(lowered)) continue;
    if (looksTechnicalContext(lowered)) continue;
    const snippet = makeSnippet(sentence, { maxWords: 18, maxChars: 160, redactNames: false });
    if (!snippet) continue;
    if (isBoringSnippet(snippet)) continue;
    statements.push(snippet);
    if (statements.length >= 2) break;
  }
  return statements;
};

const tagUserMessageForensic = (rawText: string): RewindMessageTags => {
  const textNoSecrets = maskObviousSecrets(rawText);
  const textNoCode = stripCodeBlocks(textNoSecrets);
  const lowered = textNoCode.toLowerCase();

  const intents: ForensicIntent[] = [];
  const domains: ForensicDomain[] = [];
  const tones: ForensicTone[] = [];
  const helpTypes: ForensicHelpType[] = [];

  const hasTech = looksTechnicalContext(lowered) || /```/.test(rawText);
  const hasTravel = TRAVEL_CUE_PATTERN.test(textNoCode);
  const hasCareer = CAREER_EVENT_PATTERNS.some((p) => p.test(textNoCode));

  if (hasTravel) domains.push("travel");
  if (hasCareer || /\b(job|work|boss|client|startup)\b/i.test(textNoCode)) domains.push("work_career");
  if (relationshipCuePattern.test(textNoCode)) domains.push("relationships");
  if (healthCuePattern.test(textNoCode)) domains.push("health_fitness");
  if (moneyCuePattern.test(textNoCode)) domains.push("money");
  if (/\b(story|poem|lyrics|character|novel)\b/i.test(textNoCode)) domains.push("creative");
  if (/\b(learn|study|explain|understand)\b/i.test(textNoCode)) domains.push("learning");
  if (MOVE_EVENT_PATTERNS.some((p) => p.test(textNoCode)) || /\b(visa|passport)\b/i.test(textNoCode)) domains.push("admin_life_ops");
  if (domains.length === 0) domains.push("other");

  if (hasTech) intents.push("coding_technical");
  if (planningCuePattern.test(lowered) || hasTravel) intents.push("planning");
  if (draftingCuePattern.test(lowered)) intents.push("drafting_editing");
  if (brainstormingCuePattern.test(lowered)) intents.push("brainstorming");
  if (decisionCuePattern.test(lowered)) intents.push("decision_support");
  if (conflictCuePattern.test(lowered)) intents.push("conflict_scripting");
  if (selfReflectionCuePattern.test(lowered)) intents.push("self_reflection");
  if (accountabilityCuePattern.test(lowered) || /\b(procrastinat|habit|routine|productivity|discipline)\b/i.test(textNoCode))
    intents.push("productivity_accountability");
  if (emotionalCuePattern.test(textNoCode) || /\b(i feel|feelings?)\b/i.test(lowered)) intents.push("emotional_processing");
  if (intents.length === 0) intents.push("info_seeking");

  if (lowered.includes("step by step") || lowered.includes("walk me through") || lowered.includes("break it down")) {
    helpTypes.push("step_by_step");
    helpTypes.push("structure");
  }
  if (structureCuePattern.test(lowered)) helpTypes.push("structure");
  if (exampleCuePattern.test(lowered)) helpTypes.push("examples");
  if (templateCuePattern.test(lowered)) helpTypes.push("templates");
  if (reassuranceCuePattern.test(lowered)) helpTypes.push("reassurance");
  if (critiqueCuePattern.test(lowered)) helpTypes.push("critique");
  if (accountabilityCuePattern.test(lowered)) helpTypes.push("accountability");

  const hasFrustration = /\b(wtf|why is this broken|doesn'?t work|not working)\b/i.test(textNoCode) || /[!?]{3,}/.test(rawText);
  if (hasFrustration) tones.push("frustrated");
  if (emotionalCuePattern.test(textNoCode)) tones.push("anxious");
  if (excitedCuePattern.test(textNoCode)) tones.push("excited");
  if (tiredCuePattern.test(textNoCode)) tones.push("tired");
  const hasUncertain = HEDGE_PATTERNS.some((p) => p.test(lowered));
  if (hasUncertain) tones.push("uncertain");
  if (/\b(let'?s|lets|i will|i'm going to|im going to)\b/i.test(textNoCode)) tones.push("motivated");
  if (tones.length === 0) tones.push("calm");

  const cognitiveMode: ForensicCognitiveMode = hasTech || hasFrustration
    ? "debugging"
    : intents.includes("self_reflection") || intents.includes("emotional_processing")
      ? "reflective"
      : intents.includes("decision_support")
        ? "convergent"
        : "exploratory";

  const selfStatements = detectSelfStatements(textNoSecrets);

  return {
    intents: Array.from(new Set(intents)),
    domains: Array.from(new Set(domains)),
    cognitiveMode,
    tones: Array.from(new Set(tones)),
    helpTypes: Array.from(new Set(helpTypes)),
    selfDisclosure: { present: selfStatements.length > 0, selfStatements },
  };
};

const PROJECT_EVIDENCE_PATTERNS: RegExp[] = [
  /\bwebhook\b/i,
  /\bendpoint\b/i,
  /\bdashboard\b/i,
  /\bautomation\b/i,
  /\bcron\b/i,
  /\bcsv\b/i,
  /\bscrap(?:e|ing)\b/i,
  /\bdeploy(?:ed|ing)?\b/i,
  /\bvercel\b/i,
  /\bprisma\b/i,
  /\bpostgres(?:ql)?\b/i,
  /\bsqlite\b/i,
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
    const withTime = mapped
      .map((m) => {
        const rec = asRecord(m);
        const nested = rec ? asRecord(rec.message) : null;
        const createdAt = parseTimestamp(rec?.create_time ?? nested?.create_time);
        return { m, ms: createdAt?.getTime() ?? null };
      })
      .sort((a, b) => {
        if (a.ms == null && b.ms == null) return 0;
        if (a.ms == null) return 1;
        if (b.ms == null) return -1;
        return a.ms - b.ms;
      })
      .map((x) => x.m);
    return withTime;
  }

  const directMessages = conv.messages ?? nestedConv?.messages;
  if (!Array.isArray(directMessages)) return [];
  const withTime = directMessages
    .map((m) => {
      const rec = asRecord(m);
      const nested = rec ? asRecord(rec.message) : null;
      const createdAt = parseTimestamp(rec?.create_time ?? nested?.create_time);
      return { m, ms: createdAt?.getTime() ?? null };
    })
    .sort((a, b) => {
      if (a.ms == null && b.ms == null) return 0;
      if (a.ms == null) return 1;
      if (b.ms == null) return -1;
      return a.ms - b.ms;
    })
    .map((x) => x.m);
  return withTime;
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

const compressWhitespace = (text: string) => text.replace(/\s+/g, " ").trim();

const isBoringSnippet = (snippet: string) => {
  const lower = snippet.trim().toLowerCase();
  if (!lower) return true;
  if (lower.length < 12) return true;
  if (lower === "hi" || lower === "hello" || lower === "thanks" || lower === "thank you") return true;

  const tokens = lower.split(/\s+/).filter(Boolean);
  const significant = tokens.filter((t) => t.length >= 4 && !STOPWORDS.has(t));
  return significant.length < 1;
};

const stripCodeBlocks = (text: string) =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^\s{4,}.*$/gm, " ");

const stripCodeForEntities = (text: string) => {
  const stripped = stripCodeBlocks(text);
  const lines = stripped.split(/\r?\n/);
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const symbolCount = trimmed.replace(/[a-zA-Z0-9\s]/g, "").length;
    const ratio = symbolCount / Math.max(1, trimmed.length);
    // Drop lines that are mostly symbols (stack traces, code, configs).
    if (ratio >= 0.35) return false;
    return true;
  });
  return compressWhitespace(kept.join(" "));
};

const TECH_CONTEXT_PATTERN =
  /\b(function|const|let|var|class|import|export|return|async|await|npm|yarn|pnpm|pip|conda|sql|select|insert|update|delete|http|https|api|endpoint|stack trace|traceback|exception|error|prisma|postgres|docker|kubernetes|react|next\.?js|node\.?js|typescript|javascript|python)\b/i;

const looksTechnicalContext = (textLower: string) => TECH_CONTEXT_PATTERN.test(textLower);

const clamp01 = (n: number) => (n < 0 ? 0 : n > 0.99 ? 0.99 : n);

const makeSnippet = (raw: string, opts?: { maxWords?: number; maxChars?: number; redactNames?: boolean }): string | null => {
  const maxWords = opts?.maxWords ?? 10;
  const maxChars = opts?.maxChars ?? 96;
  const cleaned = compressWhitespace(raw.replace(/["“”]/g, '"').trim());
  if (!cleaned) return null;

  const { sanitized } = anonymizeText(cleaned, { redactNames: opts?.redactNames ?? false });
  const words = sanitized.split(/\s+/).filter(Boolean);
  const sliced = words.slice(0, maxWords).join(" ");
  const clipped = sliced.length > maxChars ? sliced.slice(0, maxChars - 1).trimEnd() + "…" : sliced;
  const finalText = compressWhitespace(clipped);
  return finalText.length ? finalText : null;
};

const stableHash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(16);
};

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

export function createRewindAnalyzer(options?: {
  now?: Date;
  daysBack?: number;
  since?: Date;
  until?: Date;
}): RewindAnalyzer {
  const now = options?.now ?? new Date();
  const until = options?.until ?? now;
  const untilMs = until.getTime();

  const sinceMs =
    options?.since instanceof Date
      ? options.since.getTime()
      : untilMs - (options?.daysBack ?? 365) * 24 * 60 * 60 * 1000;

  const midMs = sinceMs + Math.floor((untilMs - sinceMs) / 2);

  const formatMonthKeyLocal = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const formatDayKeyLocal = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const coverage = {
    sinceMonth: formatMonthKeyLocal(new Date(sinceMs)),
    untilMonth: formatMonthKeyLocal(new Date(Math.max(sinceMs, untilMs - 1))),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local",
  };

  let totalConversations = 0;
  let totalUserMessages = 0;
  const conversations: RewindConversationSummary[] = [];

  // Forensic / deep-dive signals (session + message tagging)
  let totalSessions = 0;
  let resolvedSessions = 0;
  let abandonedSessions = 0;
  let sessionDurationMinsSum = 0;
  let sessionDurationMinsCount = 0;
  let sessionPromptsSum = 0;

  const forensicIntentCounts = new Map<ForensicIntent, number>();
  const forensicDomainCounts = new Map<ForensicDomain, number>();
  const forensicCognitiveModeCounts = new Map<ForensicCognitiveMode, number>();
  const forensicToneCounts = new Map<ForensicTone, number>();
  const forensicHelpTypeCounts = new Map<ForensicHelpType, number>();

  const openerCounts = new Map<
    string,
    { key: string; label: string; count: number; excerpts: Set<string>; evidence: Map<string, RewindEvidencePointer> }
  >();

  const endingCounts = new Map<
    string,
    { key: string; label: string; count: number; evidence: Map<string, RewindEvidencePointer> }
  >();

  const openingPhraseCounts = new Map<string, number>();

  const loopCounts = new Map<
    string,
    { key: string; title: string; count: number; evidence: Map<string, RewindEvidencePointer> }
  >();

  const privacyScan: RewindSummary["privacyScan"] = {
    emails: 0,
    phones: 0,
    urls: 0,
    handles: 0,
    ips: 0,
    ids: 0,
    secrets: 0,
    ssns: 0,
    cards: 0,
    names: 0,
    passwords: 0,
    addresses: 0,
  };

  const inc = <TKey extends string>(map: Map<TKey, number>, key: TKey, by = 1) => {
    map.set(key, (map.get(key) ?? 0) + by);
  };

  const recordEvidencePointer = (
    dest: Map<string, RewindEvidencePointer>,
    pointer: RewindEvidencePointer,
    limit = 18,
  ) => {
    if (dest.size >= limit) return;
    const k = pointer.msgId ?? pointer.conversationId ?? pointer.startDay ?? stableHash(pointer.snippets.join("|"));
    if (!k) return;
    if (dest.has(k)) return;
    dest.set(k, { ...pointer, snippets: pointer.snippets.slice(0, 3) });
  };

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

  let earlyHedgeMessages = 0;
  let lateHedgeMessages = 0;
  let earlyConstraintMessages = 0;
  let lateConstraintMessages = 0;
  let earlyMessageCount = 0;
  let lateMessageCount = 0;

  let earlyTurnsToWinSum = 0;
  let earlyTurnsToWinCount = 0;
  let lateTurnsToWinSum = 0;
  let lateTurnsToWinCount = 0;

  const lifeHighlightAccumulators = new Map<
    string,
    {
      key: string;
      type: string;
      labelSafe: string;
      labelPrivate: string | null;
      chats: number;
      messages: number;
      strong: number;
      days: Set<string>;
      months: Map<string, number>;
      evidence: Map<string, RewindEvidencePointer>;
    }
  >();

  const travelConversations: Array<{
    conversationId: string | null;
    startDay: string | null;
    endDay: string | null;
    month: string | null;
    destination: string | null;
    snippets: string[];
    messageHits: number;
    strongHits: number;
  }> = [];

  const addConversation = (conversation: unknown) => {
    const convRecord = asRecord(conversation);
    if (!convRecord) return;

    const conversationIdRaw = convRecord.id ?? convRecord.conversation_id ?? asRecord(convRecord.conversation)?.id;
    const conversationId = typeof conversationIdRaw === "string" && conversationIdRaw.trim().length ? conversationIdRaw.trim() : null;

    const titleRaw = convRecord.title;
    const title = typeof titleRaw === "string" ? titleRaw : "";
    const titleLower = title.toLowerCase();
    const titleSafeLower = title ? anonymizeText(title, { redactNames: false }).sanitized.toLowerCase() : "";

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
    let conversationHasBroken = false;
    let conversationHasWtf = false;
    let conversationHasAgainStill = false;
    let firstWinTurn: number | null = null;
    const conversationEvidenceSnippets = new Set<string>();
    let openerRecorded = false;

    if (title && titleSafeLower && !/^new chat\b/i.test(titleSafeLower)) {
      const titleSnippet = makeSnippet(stripCodeForEntities(title), { maxWords: 10, maxChars: 96 });
      if (titleSnippet && !isBoringSnippet(titleSnippet)) {
        conversationEvidenceSnippets.add(titleSnippet);
      }
    }

    // Sessionization inside a conversation (gap-based)
    let sessionIndex = 0;
    let sessionStartMs: number | null = null;
    let sessionLastMs: number | null = null;
    let sessionUserMessages = 0;
    let sessionPromptChars = 0;
    let sessionWinSignals = 0;
    let sessionFrictionSignals = 0;
    let sessionLastWinIdx: number | null = null;
    let sessionLastFrictionIdx: number | null = null;
    let sessionFirstTags: RewindMessageTags | null = null;
    let sessionFirstSnippet: string | null = null;
    let sessionFirstMsgId: string | null = null;
    let sessionFirstDay: string | null = null;
    let sessionLastDay: string | null = null;
    const sessionIntentCounts = new Map<ForensicIntent, number>();
    const sessionDomainCounts = new Map<ForensicDomain, number>();
    const sessionCognitiveCounts = new Map<ForensicCognitiveMode, number>();
    const sessionToneCounts = new Map<ForensicTone, number>();
    const sessionHelpCounts = new Map<ForensicHelpType, number>();
    let sessionStartCue = false;
    let sessionHasRewriteCue = false;
    let sessionHasReassurance = false;
    let sessionHasDecision = false;
    let sessionHasConflict = false;

    const conversationLifeCandidates = new Map<
      string,
      {
        key: string;
        type: string;
        labelSafe: string;
        labelPrivate: string | null;
        snippets: Set<string>;
        messageHits: number;
        strongHits: number;
      }
    >();

    let travelDestination: string | null = null;
    const travelSnippets = new Set<string>();
    let travelMessageHits = 0;
    let travelStrongHits = 0;

    const flushSession = () => {
      if (sessionUserMessages <= 0) return;

      totalSessions += 1;
      sessionPromptsSum += sessionUserMessages;

      const durationMins =
        sessionStartMs != null && sessionLastMs != null && sessionLastMs >= sessionStartMs
          ? Math.round((sessionLastMs - sessionStartMs) / 60000)
          : null;
      if (durationMins != null) {
        sessionDurationMinsSum += durationMins;
        sessionDurationMinsCount += 1;
      }

      const endingResolved =
        sessionLastWinIdx != null && (sessionLastFrictionIdx == null || sessionLastWinIdx > sessionLastFrictionIdx);
      const ending = endingResolved ? "resolved" : sessionUserMessages >= 2 ? "abandoned" : "unknown";

      if (ending === "resolved") resolvedSessions += 1;
      if (ending === "abandoned") abandonedSessions += 1;

      const openingIntent = sessionFirstTags?.intents[0] ?? null;
      const openingDomain = sessionFirstTags?.domains[0] ?? null;

      const intentLabel = (key: ForensicIntent) =>
        ({
          info_seeking: "Info-seeking",
          decision_support: "Decision support",
          brainstorming: "Brainstorming",
          drafting_editing: "Drafting & editing",
          coding_technical: "Coding & technical",
          planning: "Planning",
          emotional_processing: "Emotional processing",
          conflict_scripting: "Conflict scripting",
          self_reflection: "Self-reflection",
          productivity_accountability: "Productivity",
        })[key];

      const domainLabel = (key: ForensicDomain) =>
        ({
          work_career: "Work/career",
          relationships: "Relationships",
          health_fitness: "Health/fitness",
          money: "Money",
          creative: "Creative",
          learning: "Learning",
          admin_life_ops: "Life ops",
          travel: "Travel",
          other: "Other",
        })[key];

      if (openingIntent && openingDomain) {
        const openerKey = `${openingIntent}:${openingDomain}`;
        const label = `${intentLabel(openingIntent)} · ${domainLabel(openingDomain)}`;
        const current =
          openerCounts.get(openerKey) ?? {
            key: openerKey,
            label,
            count: 0,
            excerpts: new Set<string>(),
            evidence: new Map<string, RewindEvidencePointer>(),
          };
        current.count += 1;
        if (sessionFirstSnippet) current.excerpts.add(sessionFirstSnippet);
        recordEvidencePointer(
          current.evidence,
          {
            conversationId,
            msgId: sessionFirstMsgId,
            startDay: sessionFirstDay,
            endDay: sessionLastDay ?? sessionFirstDay,
            snippets: sessionFirstSnippet ? [sessionFirstSnippet] : ["opening move"],
          },
          24,
        );
        openerCounts.set(openerKey, current);
      }

      const endingKey = ending;
      const endingLabel = ending === "resolved" ? "Resolved" : ending === "abandoned" ? "Abandoned" : "One-and-done";
      const endingEntry =
        endingCounts.get(endingKey) ?? { key: endingKey, label: endingLabel, count: 0, evidence: new Map() };
      endingEntry.count += 1;
      recordEvidencePointer(
        endingEntry.evidence,
        {
          conversationId,
          msgId: sessionFirstMsgId,
          startDay: sessionFirstDay,
          endDay: sessionLastDay ?? sessionFirstDay,
          snippets: [endingLabel],
        },
        18,
      );
      endingCounts.set(endingKey, endingEntry);

      // Session-level cognitive mode: prioritize debugging > reflective > convergent > exploratory
      const sessionMode: ForensicCognitiveMode = sessionCognitiveCounts.get("debugging")
        ? "debugging"
        : sessionCognitiveCounts.get("reflective")
          ? "reflective"
          : sessionCognitiveCounts.get("convergent")
            ? "convergent"
            : "exploratory";
      inc(forensicCognitiveModeCounts, sessionMode, 1);

      // Loops (session-scoped, not word-count scoped)
      const recordLoop = (key: string, title: string, pointer: RewindEvidencePointer) => {
        const entry =
          loopCounts.get(key) ?? { key, title, count: 0, evidence: new Map<string, RewindEvidencePointer>() };
        entry.count += 1;
        recordEvidencePointer(entry.evidence, pointer, 18);
        loopCounts.set(key, entry);
      };

      const pointerBase: RewindEvidencePointer = {
        conversationId,
        msgId: sessionFirstMsgId,
        startDay: sessionFirstDay,
        endDay: sessionLastDay ?? sessionFirstDay,
        snippets: sessionFirstSnippet ? [sessionFirstSnippet] : ["signal"],
      };

      if (sessionStartCue && ending !== "resolved") {
        recordLoop("start_friction", "The starting friction loop", { ...pointerBase, snippets: ["help me start"] });
      }
      if (sessionHasReassurance && ending !== "resolved") {
        recordLoop("reassurance", "The reassurance loop", { ...pointerBase, snippets: ["is this normal"] });
      }
      if (sessionHasDecision && ending !== "resolved") {
        recordLoop("decision_paralysis", "Decision paralysis", { ...pointerBase, snippets: ["should I"] });
      }
      if (sessionHasRewriteCue && ending !== "resolved" && sessionUserMessages >= 10) {
        recordLoop("perfection", "The perfection loop", { ...pointerBase, snippets: ["rewrite"] });
      }
      if (sessionHasConflict && ending !== "resolved") {
        recordLoop("avoidance", "The avoidance loop", { ...pointerBase, snippets: ["what should I say"] });
      }

      // Reset session state
      sessionIndex += 1;
      sessionStartMs = null;
      sessionLastMs = null;
      sessionUserMessages = 0;
      sessionPromptChars = 0;
      sessionWinSignals = 0;
      sessionFrictionSignals = 0;
      sessionLastWinIdx = null;
      sessionLastFrictionIdx = null;
      sessionFirstTags = null;
      sessionFirstSnippet = null;
      sessionFirstMsgId = null;
      sessionFirstDay = null;
      sessionLastDay = null;
      sessionIntentCounts.clear();
      sessionDomainCounts.clear();
      sessionCognitiveCounts.clear();
      sessionToneCounts.clear();
      sessionHelpCounts.clear();
      sessionStartCue = false;
      sessionHasRewriteCue = false;
      sessionHasReassurance = false;
      sessionHasDecision = false;
      sessionHasConflict = false;
    };

    const recordConversationEvidence = (raw: string) => {
      const snippet = makeSnippet(raw, { maxWords: 12, maxChars: 120 });
      if (!snippet) return;
      conversationEvidenceSnippets.add(snippet);
    };

    const recordLifeCandidate = (input: {
      type: string;
      labelSafe: string;
      labelPrivate?: string | null;
      snippet: string;
      strong?: boolean;
    }) => {
      const normalized = `${input.type}:${input.labelSafe.toLowerCase()}`;
      const key = `lh:${stableHash(normalized)}`;
      const current =
        conversationLifeCandidates.get(key) ?? {
          key,
          type: input.type,
          labelSafe: input.labelSafe,
          labelPrivate: input.labelPrivate ?? null,
          snippets: new Set<string>(),
          messageHits: 0,
          strongHits: 0,
        };

      const snippet = makeSnippet(input.snippet, { maxWords: 8, maxChars: 72 });
      if (snippet) current.snippets.add(snippet);
      current.messageHits += 1;
      if (input.strong) current.strongHits += 1;
      conversationLifeCandidates.set(key, current);
    };

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

      if (createdAt) {
        const ms = createdAt.getTime();
        if (ms < sinceMs || ms >= untilMs) continue;
      }

      const rawText = normalizeMessageContent(msgRecord);
      if (!rawText) continue;

      if (PASSWORD_LIKE_PATTERN.test(rawText)) privacyScan.passwords += 1;
      if (ADDRESS_LIKE_PATTERN.test(rawText)) privacyScan.addresses += 1;

      const rawTextSafe = maskObviousSecrets(rawText);
      const scrub = anonymizeText(rawTextSafe, { redactNames: false });
      privacyScan.emails += scrub.replacements.emails;
      privacyScan.phones += scrub.replacements.phones;
      privacyScan.urls += scrub.replacements.urls;
      privacyScan.handles += scrub.replacements.handles;
      privacyScan.ips += scrub.replacements.ips;
      privacyScan.ids += scrub.replacements.ids;
      privacyScan.secrets += scrub.replacements.secrets;
      privacyScan.ssns += scrub.replacements.ssns;
      privacyScan.cards += scrub.replacements.cards;

      const scrubbed = scrub.sanitized;
      const scrubNames = anonymizeText(scrubbed, { redactNames: true });
      privacyScan.names += scrubNames.replacements.names;

      const trimmed = scrubNames.sanitized.trim();
      const trimmedFlavor = scrubbed.trim();
      if (!trimmed.length) continue;

      const msgIdRaw = msgRecord.id ?? nestedMessageRecord?.id;
      const msgId =
        typeof msgIdRaw === "string" && msgIdRaw.trim().length
          ? msgIdRaw.trim()
          : `msg:${stableHash(`${conversationId ?? "noid"}|${createdAt?.getTime() ?? "notime"}|${sessionIndex}|${conversationUserMessageCount}`)}`;

      conversationHasIncluded = true;
      totalUserMessages += 1;
      conversationUserMessageCount += 1;

      // Session boundary detection (gap-based)
      if (createdAt) {
        const ms = createdAt.getTime();
        if (sessionLastMs != null && ms - sessionLastMs > SESSION_GAP_MS) {
          flushSession();
        }
        if (sessionStartMs == null) sessionStartMs = ms;
        sessionLastMs = ms;
        sessionLastDay = formatDayKeyLocal(createdAt);
        if (sessionFirstDay == null) sessionFirstDay = sessionLastDay;
      }

      const tags = tagUserMessageForensic(rawTextSafe);
      tags.intents.forEach((k) => {
        inc(forensicIntentCounts, k);
        inc(sessionIntentCounts, k);
      });
      tags.domains.forEach((k) => {
        inc(forensicDomainCounts, k);
        inc(sessionDomainCounts, k);
      });
      inc(sessionCognitiveCounts, tags.cognitiveMode);
      tags.tones.forEach((k) => {
        inc(forensicToneCounts, k);
        inc(sessionToneCounts, k);
      });
      tags.helpTypes.forEach((k) => {
        inc(forensicHelpTypeCounts, k);
        inc(sessionHelpCounts, k);
      });

      if (!sessionFirstTags) {
        sessionFirstTags = tags;
        sessionFirstMsgId = msgId;

        const opener = stripCodeForEntities(trimmedFlavor) || trimmedFlavor;
        const openerSnippet = opener ? makeSnippet(opener, { maxWords: 14, maxChars: 140 }) : null;
        if (openerSnippet && !isBoringSnippet(openerSnippet)) sessionFirstSnippet = openerSnippet;

        const safeOpener = anonymizeText(stripCodeBlocks(rawTextSafe), { redactNames: true }).sanitized;
        const words = safeOpener.split(/\s+/).filter(Boolean).slice(0, 4);
        const phrase = words.join(" ").toLowerCase();
        if (phrase.length >= 6 && phrase.length <= 56) {
          openingPhraseCounts.set(phrase, (openingPhraseCounts.get(phrase) ?? 0) + 1);
        }

        if (/\b(help me start|get started|how do i start)\b/i.test(rawTextSafe)) {
          sessionStartCue = true;
        }
      }

      if (tags.helpTypes.includes("reassurance")) sessionHasReassurance = true;
      if (tags.intents.includes("decision_support")) sessionHasDecision = true;
      if (tags.intents.includes("conflict_scripting")) sessionHasConflict = true;
      if (/\b(rewrite|rephrase|edit)\b/i.test(rawTextSafe)) sessionHasRewriteCue = true;

      const len = trimmed.length;
      totalPromptChars += len;
      if (len > longestPromptChars) longestPromptChars = len;
      conversationPromptChars += len;
      if (len > conversationMaxPromptChars) conversationMaxPromptChars = len;
      sessionPromptChars += len;
      sessionUserMessages += 1;

      if (createdAt) {
        const ms = createdAt.getTime();
        if (conversationFirstMs === null || ms < conversationFirstMs) conversationFirstMs = ms;
        if (conversationLastMs === null || ms > conversationLastMs) conversationLastMs = ms;
      }

      const lowered = trimmed.toLowerCase();
      const loweredFlavor = trimmedFlavor.toLowerCase();
      const entityText = stripCodeForEntities(trimmedFlavor);
      const entityLower = entityText.toLowerCase();
      const isTechnical = looksTechnicalContext(entityLower) || looksTechnicalContext(loweredFlavor);
      let messageHasWtf = false;
      let messageHasBroken = false;

      if (!openerRecorded) {
        const opener = entityText || trimmedFlavor;
        const snippet = opener ? makeSnippet(opener, { maxWords: 12, maxChars: 120 }) : null;
        if (snippet && !isBoringSnippet(snippet)) conversationEvidenceSnippets.add(snippet);
        openerRecorded = true;
      }

      for (const key of Object.keys(INTENT_KEYWORDS) as RewindIntent[]) {
        intentScores[key] += scoreByKeywordPresence(loweredFlavor, INTENT_KEYWORDS[key]);
      }
      for (const key of Object.keys(DELIVERABLE_KEYWORDS) as RewindDeliverable[]) {
        deliverableScores[key] += scoreByKeywordPresence(loweredFlavor, DELIVERABLE_KEYWORDS[key]);
      }
      for (const term of STACK_TERMS) {
        const hits = countMatches(loweredFlavor, term.pattern);
        if (hits > 0) stackCounts.set(term.label, (stackCounts.get(term.label) ?? 0) + hits);
      }
      for (const theme of PROJECT_THEMES) {
        const score = scoreByKeywordPresence(loweredFlavor, theme.keywords);
        if (score > 0) themeScores.set(theme.key, (themeScores.get(theme.key) ?? 0) + score);
      }

      let messageWinHits = 0;
      for (const pat of WIN_PATTERNS) {
        messageWinHits += countMatches(lowered, pat);
      }
      if (messageWinHits > 0) {
        for (const pat of WIN_PATTERNS) {
          pat.lastIndex = 0;
          const match = pat.exec(lowered);
          if (match?.[0]) {
            recordConversationEvidence(match[0]);
            break;
          }
        }
      }
      if (messageWinHits > 0) {
        conversationWinSignals += messageWinHits;
        winSignalTotal += messageWinHits;
      }
      if (messageWinHits > 0 && firstWinTurn === null) {
        firstWinTurn = conversationUserMessageCount;
      }
      if (messageWinHits > 0) {
        sessionWinSignals += messageWinHits;
        sessionLastWinIdx = sessionUserMessages;
      }

      let messageIndecisionHits = 0;
      for (const pat of INDECISION_PATTERNS) {
        messageIndecisionHits += countMatches(lowered, pat);
      }
      if (messageIndecisionHits > 0) {
        for (const pat of INDECISION_PATTERNS) {
          pat.lastIndex = 0;
          const match = pat.exec(lowered);
          if (match?.[0]) {
            recordConversationEvidence(match[0]);
            break;
          }
        }
        conversationIndecisionSignals += messageIndecisionHits;
      }

      const hasHedge = HEDGE_PATTERNS.some((p) => p.test(lowered));
      const hasConstraint = CONSTRAINT_PATTERNS.some((p) => p.test(lowered));

      for (const pat of PROJECT_EVIDENCE_PATTERNS) {
        pat.lastIndex = 0;
        const match = pat.exec(loweredFlavor);
        if (match?.[0]) recordConversationEvidence(match[0]);
      }

      if (!isTechnical && entityText && TRAVEL_CUE_PATTERN.test(entityText)) {
        travelMessageHits += 1;
        if (TRAVEL_STRONG_PATTERN.test(entityText)) travelStrongHits += 1;
        const destMatch = extractTravelDestinationMatch(entityText);
        if (destMatch) {
          if (!travelDestination) travelDestination = destMatch.destination;
          const snippet = makeSnippet(destMatch.snippet, { maxWords: 8, maxChars: 80 });
          if (snippet) travelSnippets.add(snippet);
        } else {
          const cue = TRAVEL_CUE_PATTERN.exec(entityText)?.[0] ?? "trip";
          const snippet = makeSnippet(cue, { maxWords: 4, maxChars: 40 });
          if (snippet) travelSnippets.add(snippet);
        }
      }

      if (!isTechnical && entityText) {
        if (!TRANSLATION_CUE_PATTERN.test(entityLower)) {
          const languageMatch = LANGUAGE_LEARN_PATTERN.exec(entityLower) ?? LANGUAGE_PRACTICE_PATTERN.exec(entityLower);
          if (languageMatch?.[1]) {
            const sentence = findSentenceWithNeedle(entityText, languageMatch[0].toLowerCase());
            const sentenceLower = sentence.toLowerCase();
            if (isExampleContext(sentenceLower)) {
              // Avoid false positives from meta-prompts ("example prompt to learn Spanish", etc.).
              // If it's real, it will show up elsewhere with clearer personal signals.
              continue;
            }
            const lang = languageMatch[1].toLowerCase();
            const label = lang.charAt(0).toUpperCase() + lang.slice(1);
            recordLifeCandidate({
              type: "language",
              labelSafe: label,
              labelPrivate: label,
              snippet: sentence,
              strong: FIRST_PERSON_CUE_PATTERN.test(sentenceLower),
            });
          }
        }

        if (!FITNESS_TECH_EXCLUDE.test(entityLower)) {
          for (const pat of FITNESS_EVENT_PATTERNS) {
            pat.lastIndex = 0;
            const match = pat.exec(entityLower);
            if (!match) continue;
            const sentence = findSentenceWithNeedle(entityText, match[0].toLowerCase());
            const sentenceLower = sentence.toLowerCase();
            if (isExampleContext(sentenceLower)) {
              break;
            }
            const activityRaw = match[2] ?? match[1] ?? match[0];
            const activity = activityRaw.toLowerCase();
            const label = activity.charAt(0).toUpperCase() + activity.slice(1).replace(/\bworkouts\b/i, "Workout");
            const strong = /\b(started|starting|getting into|training)\b/i.test(match[0]);
            recordLifeCandidate({ type: "fitness", labelSafe: label, labelPrivate: label, snippet: sentence, strong });
            break;
          }
        }

        for (const pat of FOOD_EVENT_PATTERNS) {
          pat.lastIndex = 0;
          const match = pat.exec(entityLower);
          if (!match) continue;
          const sentence = findSentenceWithNeedle(entityText, match[0].toLowerCase());
          const sentenceLower = sentence.toLowerCase();
          if (isExampleContext(sentenceLower)) {
            break;
          }
          const nounRaw = match[2] ?? match[1] ?? match[0];
          const noun = compressWhitespace(nounRaw.toLowerCase().replace(/[^a-z0-9'\-\s]/g, " "));
          const limited = noun.split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
          const label = (limited || noun).charAt(0).toUpperCase() + (limited || noun).slice(1).replace(/\brecipes\b/i, "Recipes");
          const strong = /\b(trying|tried|started|starting|learning)\b/i.test(match[0]);
          recordLifeCandidate({ type: "food", labelSafe: label, labelPrivate: label, snippet: sentence, strong });
          break;
        }

        for (const pat of CAREER_EVENT_PATTERNS) {
          pat.lastIndex = 0;
          const match = pat.exec(entityLower);
          if (!match) continue;
          const sentence = findSentenceWithNeedle(entityText, match[0].toLowerCase());
          const sentenceLower = sentence.toLowerCase();
          if (isExampleContext(sentenceLower)) {
            break;
          }
          const token = match[0].toLowerCase();
          const label =
            token.includes("job offer") ? "Job offer" : token.includes("offer letter") ? "Offer letter" : token.includes("resume") || token.includes("cv") ? "Resume" : token.includes("salary") ? "Salary" : "Interview";
          recordLifeCandidate({ type: "career", labelSafe: label, labelPrivate: label, snippet: sentence, strong: true });
          break;
        }

        for (const pat of MOVE_EVENT_PATTERNS) {
          pat.lastIndex = 0;
          const match = pat.exec(entityLower);
          if (!match) continue;
          const sentence = findSentenceWithNeedle(entityText, match[0].toLowerCase());
          const sentenceLower = sentence.toLowerCase();
          if (isExampleContext(sentenceLower)) {
            break;
          }
          const token = match[0].toLowerCase();
          const label = token.includes("apartment") ? "Apartment hunt" : token.includes("lease") ? "Lease" : token.includes("mortgage") ? "Mortgage" : "Moving";
          recordLifeCandidate({ type: "life", labelSafe: label, labelPrivate: label, snippet: sentence, strong: true });
          break;
        }
      }

      // Topics
      for (const bucket of TOPIC_BUCKETS) {
        let scoreDelta = 0;
        for (const kw of bucket.keywords) {
          if (loweredFlavor.includes(kw)) scoreDelta += 1;
        }
        if (scoreDelta > 0) {
          topicScores.set(bucket.key, (topicScores.get(bucket.key) ?? 0) + scoreDelta);
        }
      }

      // Fun phrases / habits
      for (const habit of HABIT_PHRASES) {
        const hits = countMatches(lowered, habit.pattern);
        if (hits > 0) {
          if (
            habit.phrase === "quick question" ||
            habit.phrase === "real quick" ||
            habit.phrase === "simple question" ||
            habit.phrase === "why is this broken" ||
            habit.phrase === "doesn't work" ||
            habit.phrase === "wtf"
          ) {
            recordConversationEvidence(habit.phrase);
          }
          habitCounts.set(habit.phrase, (habitCounts.get(habit.phrase) ?? 0) + hits);
          conversationHabitCounts.set(
            habit.phrase,
            (conversationHabitCounts.get(habit.phrase) ?? 0) + hits,
          );
          if (habit.phrase === "wtf") messageHasWtf = true;
          if (habit.phrase === "why is this broken" || habit.phrase === "doesn't work") messageHasBroken = true;
        }
      }
      if (messageHasWtf) conversationHasWtf = true;
      if (messageHasBroken) conversationHasBroken = true;

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
      if (messageAgainHits > 0) {
        againCount += messageAgainHits;
        recordConversationEvidence("again");
      }

      const messageStillHits = countMatches(lowered, STILL_PATTERN);
      if (messageStillHits > 0) {
        stillCount += messageStillHits;
        recordConversationEvidence("still");
      }
      if (messageAgainHits > 0 || messageStillHits > 0) conversationHasAgainStill = true;

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
        sessionFrictionSignals += 1;
        sessionLastFrictionIdx = sessionUserMessages;
      }

      // Word frequencies (prefer non-code, flavor-preserving text)
      const wordSource = entityLower || lowered;
      const tokens = tokenize(wordSource);
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
        const dayKey = formatDayKeyLocal(createdAt);
        activeDaysSet.add(dayKey);
        dayMessageCount.set(dayKey, (dayMessageCount.get(dayKey) ?? 0) + 1);
        if (isRage) {
          dayChaosCount.set(dayKey, (dayChaosCount.get(dayKey) ?? 0) + 1);
        }

        const monthKey = formatMonthKeyLocal(createdAt);
        monthCount.set(monthKey, (monthCount.get(monthKey) ?? 0) + 1);

        const hour = createdAt.getHours();
        hourCount[hour] += 1;
        if (hour >= 23 || hour <= 4) lateNightCount += 1;

        const ms = createdAt.getTime();
        if (ms <= midMs) {
          earlyPromptChars += len;
          earlyPromptCount += 1;
          earlyMessageCount += 1;
          if (hasHedge) earlyHedgeMessages += 1;
          if (hasConstraint) earlyConstraintMessages += 1;
        } else {
          latePromptChars += len;
          latePromptCount += 1;
          lateMessageCount += 1;
          if (hasHedge) lateHedgeMessages += 1;
          if (hasConstraint) lateConstraintMessages += 1;
        }
      }
    }

    flushSession();

    if (!conversationHasIncluded) return;

    totalConversations += 1;

    if (title) {
      const titleEntityText = stripCodeForEntities(anonymizeText(title, { redactNames: false }).sanitized);
      const titleSnippet = titleEntityText ? makeSnippet(titleEntityText, { maxWords: 10, maxChars: 110 }) : null;
      if (titleSnippet && !isBoringSnippet(titleSnippet)) conversationEvidenceSnippets.add(titleSnippet);
    }

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
        ? formatMonthKeyLocal(new Date(conversationFirstMs))
        : null;
    const startDay = conversationFirstMs != null ? formatDayKeyLocal(new Date(conversationFirstMs)) : null;
    const endDay = conversationLastMs != null ? formatDayKeyLocal(new Date(conversationLastMs)) : startDay;

    if (firstWinTurn != null && conversationFirstMs != null) {
      if (conversationFirstMs <= midMs) {
        earlyTurnsToWinSum += firstWinTurn;
        earlyTurnsToWinCount += 1;
      } else {
        lateTurnsToWinSum += firstWinTurn;
        lateTurnsToWinCount += 1;
      }
    }

    const evidenceKey = conversationId ?? `noid:${startDay ?? monthKey ?? stableHash(titleSafeLower)}`;

    if (!travelDestination && title) {
      const titleEntityText = stripCodeForEntities(anonymizeText(title, { redactNames: false }).sanitized);
      if (titleEntityText && TRAVEL_CUE_PATTERN.test(titleEntityText)) {
        const match = extractTravelDestinationMatch(titleEntityText);
        if (match) {
          travelDestination = match.destination;
          const snippet = makeSnippet(match.snippet, { maxWords: 8, maxChars: 80 });
          if (snippet) travelSnippets.add(snippet);
        }
      }
    }

    if (travelMessageHits > 0) {
      travelConversations.push({
        conversationId,
        startDay,
        endDay,
        month: monthKey,
        destination: travelDestination,
        snippets: Array.from(travelSnippets).slice(0, 3),
        messageHits: travelMessageHits,
        strongHits: travelStrongHits,
      });
    }

    for (const candidate of conversationLifeCandidates.values()) {
      const current =
        lifeHighlightAccumulators.get(candidate.key) ?? {
          key: candidate.key,
          type: candidate.type,
          labelSafe: candidate.labelSafe,
          labelPrivate: candidate.labelPrivate,
          chats: 0,
          messages: 0,
          strong: 0,
          days: new Set<string>(),
          months: new Map<string, number>(),
          evidence: new Map<string, RewindEvidencePointer>(),
        };

      current.chats += 1;
      current.messages += candidate.messageHits;
      current.strong += candidate.strongHits;
      if (startDay) current.days.add(startDay);
      if (endDay) current.days.add(endDay);
      if (monthKey) current.months.set(monthKey, (current.months.get(monthKey) ?? 0) + 1);
      if (!current.labelPrivate && candidate.labelPrivate) current.labelPrivate = candidate.labelPrivate;

      const existingEvidence = current.evidence.get(evidenceKey);
      if (existingEvidence) {
        candidate.snippets.forEach((s) => existingEvidence.snippets.push(s));
        existingEvidence.snippets = Array.from(new Set(existingEvidence.snippets)).slice(0, 3);
      } else {
        current.evidence.set(evidenceKey, {
          conversationId,
          startDay,
          endDay,
          snippets: Array.from(candidate.snippets).slice(0, 3),
        });
      }

      lifeHighlightAccumulators.set(candidate.key, current);
    }

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
      conversationId,
      topicKey,
      themeKey,
      month: monthKey,
      startDay,
      endDay,
      oneLineSummary,
      evidenceSnippets: Array.from(conversationEvidenceSnippets).slice(0, 10),
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
      hasBroken: conversationHasBroken,
      hasWtf: conversationHasWtf,
      hasAgainStill: conversationHasAgainStill,
      hasQuickIntro: conversationQuickIntro > 0,
    });

    if (bestTopic) {
      topicCounts.set(bestTopic.key, (topicCounts.get(bestTopic.key) ?? 0) + 1);
    }
  };

  const summary = (): RewindSummary => {
    const avgPromptChars =
      totalUserMessages > 0 ? Math.round(totalPromptChars / totalUserMessages) : null;

    const topWord: string | null =
      Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .find(([, count]) => count >= 8)?.[0] ?? null;

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

    const dayKeyUtcMs = (dayKey: string): number | null => {
      const parts = dayKey.split("-");
      if (parts.length !== 3) return null;
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
      return Date.UTC(year, month - 1, day);
    };

    const parseDayKeyLocal = (dayKey: string): Date | null => {
      const parts = dayKey.split("-");
      if (parts.length !== 3) return null;
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const weekStartKey = (dayKey: string) => {
      const date = parseDayKeyLocal(dayKey);
      if (!date) return dayKey;
      const day = date.getDay(); // 0=Sun..6=Sat
      const diffToMonday = (day + 6) % 7; // Mon => 0, Sun => 6
      const start = new Date(date.getTime());
      start.setDate(start.getDate() - diffToMonday);
      return formatDayKeyLocal(start);
    };

    const weekLabel = (weekKey: string) => {
      const date = parseDayKeyLocal(weekKey);
      if (!date) return weekKey;
      const monthName = monthNames[date.getMonth()] ?? "";
      const day = date.getDate();
      const year = String(date.getFullYear()).slice(-2);
      return `Week of ${monthName.slice(0, 3)} ${day} '${year}`;
    };

    const longestStreakDays = (() => {
      const days = Array.from(activeDaysSet).sort();
      if (days.length === 0) return null;
      let best = 1;
      let current = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = dayKeyUtcMs(days[i - 1]);
        const cur = dayKeyUtcMs(days[i]);
        if (prev == null || cur == null) continue;
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

      const signatureScore = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return -999;
        const lower = trimmed.toLowerCase();
        const tokens = lower.split(/\s+/).filter(Boolean);
        const significant = tokens.filter((t) => t.length >= 4 && !STOPWORDS.has(t));
        const hasDigits = /\d/.test(trimmed);
        const hasCamel = /\b[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*\b/.test(trimmed);
        const hasQuote = /["“”]/.test(trimmed);
        return (
          significant.length * 6 +
          Math.min(trimmed.length, 90) / 2 +
          (hasDigits ? 5 : 0) +
          (hasCamel ? 6 : 0) +
          (hasQuote ? 2 : 0)
        );
      };

      const clusters = new Map<
        string,
        {
          projectKey: string;
          clusterKey: string;
          chats: number;
          prompts: number;
          months: Set<string>;
          stackCounts: Map<string, number>;
          deliverableCounts: Map<RewindDeliverable, number>;
          wins: number;
          friction: number;
          evidence: RewindEvidencePointer[];
        }
      >();

      for (const conv of candidates) {
        let projectKey = conv.themeKey ?? conv.topicKey ?? (conv.intent === "debug" ? "debug" : conv.intent);
        // Normalize near-duplicates so builds don't split into clones.
        if (projectKey === "plan") projectKey = "planning";
        if (projectKey === "learn") projectKey = "learning";
        if (projectKey === "write") projectKey = "writing";
        if (projectKey === "build") projectKey = "coding";
        const clusterKey = projectKey;

        const current =
          clusters.get(clusterKey) ?? {
            projectKey,
            clusterKey,
            chats: 0,
            prompts: 0,
            months: new Set<string>(),
            stackCounts: new Map<string, number>(),
            deliverableCounts: new Map<RewindDeliverable, number>(),
            wins: 0,
            friction: 0,
            evidence: [],
          };

        current.chats += 1;
        current.prompts += conv.userMessages;
        if (conv.month) current.months.add(conv.month);
        current.wins += conv.winSignals;
        current.friction += conv.frictionSignals;
        for (const tool of conv.stack) {
          current.stackCounts.set(tool, (current.stackCounts.get(tool) ?? 0) + 1);
        }
        current.deliverableCounts.set(
          conv.deliverable,
          (current.deliverableCounts.get(conv.deliverable) ?? 0) + 1,
        );

        const projectSnippets = conv.evidenceSnippets.filter(
          (s) => !["please", "thank you", "thanks", "sorry", "again", "still", "maybe"].includes(s.toLowerCase()),
        );
        const snippets = (projectSnippets.length > 0 ? projectSnippets : conv.evidenceSnippets).slice(0, 3);
        if (snippets.length > 0) {
          current.evidence.push({
            conversationId: conv.conversationId,
            startDay: conv.startDay,
            endDay: conv.endDay,
            snippets,
          });
        }
        clusters.set(clusterKey, current);
      }

      const themeTitle = (key: string) => {
        switch (key) {
          case "automation":
            return "Automation Sprint";
          case "dashboard":
            return "Dashboard Era";
          case "api":
            return "API Season";
          case "data":
            return "Data Wrangling";
          case "deploy":
            return "Shipping Pipeline";
          case "debug":
            return "Bug Bash";
          case "writing":
            return "Rewrite Spiral";
          case "career":
            return "Career Moves";
          case "travel":
            return "Trip Planning";
          case "planning":
            return "Productivity System";
          case "plan":
            return "Productivity System";
          case "learning":
            return "Learning Sprint";
          case "learn":
            return "Learning Sprint";
          case "creative":
            return "Creative Playground";
          case "write":
            return "Rewrite Spiral";
          case "build":
            return "Build Cycle";
          case "coding":
            return "Build Cycle";
          default:
            return "Build Cycle";
        }
      };

      const pickTopDeliverable = (counts: Map<RewindDeliverable, number>): RewindDeliverable => {
        let best: RewindDeliverable = "other";
        let bestCount = counts.get(best) ?? 0;
        for (const [k, v] of counts.entries()) {
          if (v > bestCount) {
            bestCount = v;
            best = k;
          }
        }
        return best;
      };

      const inferArtifactOverride = (textLower: string, stack: string[]) => {
        const ctx = `${textLower} ${stack.join(" ").toLowerCase()}`;
        if (/\bchrome extension\b|\bbrowser extension\b/.test(ctx)) return "a browser extension";
        if (/\bdiscord\b/.test(ctx) && /\bbot\b/.test(ctx)) return "a Discord bot";
        if (/\btelegram\b/.test(ctx) && /\bbot\b/.test(ctx)) return "a Telegram bot";
        if (/\bslack\b/.test(ctx)) return "a Slack integration";
        if (/\bnotion\b/.test(ctx)) return "a Notion system";
        if (/\bairtable\b/.test(ctx)) return "an Airtable base";
        if (/\bgoogle sheets\b|\bsheets\b|\bexcel\b|\bspreadsheet\b/.test(ctx)) return "a spreadsheet workflow";
        if (/\bweb scraper\b|\bscraper\b|\bcrawler\b/.test(ctx)) return "a scraper";
        if (/\bcli\b|\bcommand[- ]line\b/.test(ctx)) return "a CLI tool";
        if (/\bchrome\b/.test(ctx) && /\bextension\b/.test(ctx)) return "a browser extension";
        if (/\bmobile app\b|\bios\b|\bandroid\b/.test(ctx)) return "a mobile app";
        return null;
      };

      const artifactNoun = (key: string, deliverable: RewindDeliverable, override: string | null) => {
        if (override) return override;
        if (key === "dashboard") return "a dashboard";
        if (key === "api") return "an API";
        if (key === "automation") return "an automation";
        if (key === "data") return "a data pipeline";
        if (key === "deploy") return "a deploy pipeline";
        if (key === "debug") return "a bug fix";
        if (key === "travel") return "a trip plan";
        if (key === "career") return "a career move";
        if (key === "planning" || key === "plan") return "a system";
        if (key === "learning" || key === "learn") return "a crash course";
        if (key === "creative") return "something creative";
        if (key === "writing" || key === "write") return deliverable === "email" ? "a message draft" : "a rewrite";
        if (key === "coding" || key === "build") return "a tool";
        if (deliverable === "code") return "a build";
        if (deliverable === "plan") return "a plan";
        if (deliverable === "email") return "a message";
        if (deliverable === "story") return "a story";
        if (deliverable === "analysis") return "an analysis";
        if (deliverable === "decision") return "a decision";
        return "something";
      };

      const whatBuilt = (
        key: string,
        deliverable: RewindDeliverable,
        stackTop: string | null,
        artifactOverride: string | null,
      ) => {
        const noun = artifactNoun(key, deliverable, artifactOverride);
        const stackHint = stackTop ? ` (${stackTop})` : "";
        switch (key) {
          case "automation":
            return `${noun}${stackHint} to do the boring parts for you.`;
          case "dashboard":
            return `${noun}${stackHint} so you could see what was going on.`;
          case "api":
            return `${noun}${stackHint} to make systems talk.`;
          case "data":
            return `${noun}${stackHint} to wrestle messy inputs into shape.`;
          case "deploy":
            return `${noun}${stackHint} so shipping was less of a gamble.`;
          case "debug":
            return `${noun}${stackHint} after enough “why is this broken”.`;
          case "writing":
          case "write":
            return `${noun}${stackHint} until it sounded like you.`;
          case "career":
            return `${noun}${stackHint} you actually cared about.`;
          case "travel":
            return `${noun}${stackHint} because surprises are overrated.`;
          case "planning":
          case "plan":
            return `${noun}${stackHint} to turn chaos into steps.`;
          case "learning":
          case "learn":
            return `${noun}${stackHint} until it clicked.`;
          case "creative":
            return `${noun}${stackHint} until one idea sparked.`;
          default:
            return `${noun}${stackHint} and kept iterating.`;
        }
      };

      const projectSummariesRaw: RewindProjectSummary[] = Array.from(clusters.values())
        .sort((a, b) => b.prompts - a.prompts)
        .slice(0, 5)
        .map((cluster) => {
          const monthsActive = Array.from(cluster.months).sort().map(monthLabel);
          const stack = pickTopFromCounts(cluster.stackCounts, 7);
          const stackTop =
            stack.find((t) => !["Git", "GitHub", "Windows", "Linux", "macOS"].includes(t)) ?? null;
          const topDeliverable = pickTopDeliverable(cluster.deliverableCounts);
          const intensity: RewindProjectSummary["intensity"] =
            cluster.chats >= 60 ? "obsessive" : cluster.chats >= 20 ? "steady" : "light";

          const lastMonthKey = Array.from(cluster.months).sort().slice(-1)[0] ?? null;
          const lastMonthDate = lastMonthKey ? new Date(`${lastMonthKey}-15T00:00:00Z`).getTime() : null;
          const daysSinceLast =
            lastMonthDate != null ? Math.floor((untilMs - lastMonthDate) / (24 * 60 * 60 * 1000)) : null;

          const statusGuess: RewindProjectSummary["statusGuess"] =
            daysSinceLast != null && daysSinceLast <= 45
              ? "recurring"
              : cluster.wins > 0 && cluster.wins >= cluster.friction
                ? "shipped"
                : daysSinceLast != null && daysSinceLast > 120 && cluster.friction > cluster.wins && cluster.chats >= 8
                  ? "abandoned"
                  : "unknown";

          const coreStack = stack.filter((t) => !["Git", "GitHub", "Windows", "Linux", "macOS", "VS Code"].includes(t));
          const stackPair =
            coreStack.length >= 2 ? `${coreStack[0]} → ${coreStack[1]}` : coreStack.length === 1 ? coreStack[0] : null;

          const labelSafe = themeTitle(cluster.projectKey);
          const labelPrivateBase = stackPair
            ? `${labelSafe} (${stackPair})`
            : stackTop
              ? `${labelSafe} (${stackTop})`
              : labelSafe;

          const signature = (() => {
            const all = cluster.evidence.flatMap((e) => e.snippets).map((s) => s.trim()).filter(Boolean);
            const unique = Array.from(new Set(all));
            const filtered = unique
              .filter((s) => {
                const lower = s.toLowerCase();
                if (lower.length < 10) return false;
                if (lower === "please" || lower === "thank you" || lower === "thanks" || lower === "sorry") return false;
                if (lower === "again" || lower === "still" || lower === "wtf") return false;
                if (lower.includes("[email]") || lower.includes("[phone]") || lower.includes("[card]")) return false;
                if (stack.some((t) => t.toLowerCase() === lower)) return false;
                return true;
              })
              .sort((a, b) => signatureScore(b) - signatureScore(a));
            return filtered[0] ?? null;
          })();

          const signatureShort = signature ? makeSnippet(signature, { maxWords: 7, maxChars: 64 }) : null;
          const labelPrivate = signatureShort ?? labelPrivateBase;

          const artifactOverride = inferArtifactOverride((signature ?? "").toLowerCase(), stack);
          const whatSafe = whatBuilt(cluster.projectKey, topDeliverable, stackTop, artifactOverride);
          const whatPrivate = (() => {
            const verbHint = (() => {
              if (!signature) return null;
              const cleaned = compressWhitespace(signature.replace(/[“”"]/g, ""));
              const lower = cleaned.toLowerCase();
              let fragment: string | null = null;
              if (lower.startsWith("how to ")) fragment = cleaned.slice(7);
              else if (lower.startsWith("help me ")) fragment = cleaned.slice(8);
              else if (lower.startsWith("can you ")) fragment = cleaned.slice(8);
              else {
                const match = /\bto\s+([a-z][^?!.]{2,120})/i.exec(cleaned);
                fragment = match?.[1] ?? null;
              }
              if (!fragment) return null;
              const clipped = makeSnippet(fragment, { maxWords: 10, maxChars: 80 });
              return clipped ? clipped.replace(/[.?!]+$/g, "") : null;
            })();

            if (verbHint) {
              const noun = artifactNoun(cluster.projectKey, topDeliverable, artifactOverride);
              const suffix = verbHint.toLowerCase().startsWith("to ") ? verbHint : `to ${verbHint}`;
              return `${noun} ${suffix}.`;
            }

            if (!stackPair) return whatSafe;
            if (cluster.projectKey === "automation") return `An automation to connect ${stackPair}.`;
            if (cluster.projectKey === "api") return `An integration to connect ${stackPair}.`;
            if (cluster.projectKey === "dashboard") return `A dashboard for ${stackPair}.`;
            if (cluster.projectKey === "data") return `A data pipeline around ${stackPair}.`;
            if (cluster.projectKey === "deploy") return `A deploy setup to ship ${stackPair}.`;
            return whatSafe;
          })();

          const monthsSorted = Array.from(cluster.months).sort();
          const range =
            monthsSorted.length >= 2
              ? `${monthLabel(monthsSorted[0])} → ${monthLabel(monthsSorted[monthsSorted.length - 1])}`
              : monthsSorted.length === 1
                ? monthLabel(monthsSorted[0])
                : null;

          const evidence = (() => {
            const seen = new Set<string>();
            const picked: RewindEvidencePointer[] = [];
            for (const e of cluster.evidence) {
              const k = e.conversationId ?? e.startDay ?? stableHash(e.snippets.join("|"));
              if (seen.has(k)) continue;
              seen.add(k);
              picked.push({ ...e, snippets: e.snippets.slice(0, 3) });
              if (picked.length >= 8) break;
            }
            return picked;
          })();

          return {
            key: `proj:${stableHash(cluster.clusterKey)}`,
            projectLabel: labelSafe,
            projectLabelPrivate: labelPrivate,
            whatYouBuilt: whatSafe,
            whatYouBuiltPrivate: whatPrivate,
            stack,
            monthsActive,
            range,
            chats: cluster.chats,
            prompts: cluster.prompts,
            intensity,
            statusGuess,
            evidence,
          };
        });

      const seen = new Map<string, number>();
      const projectSummaries = projectSummariesRaw.map((p) => {
        const n = (seen.get(p.projectLabel) ?? 0) + 1;
        seen.set(p.projectLabel, n);
        if (n === 1) return p;
        return { ...p, projectLabel: `${p.projectLabel} #${n}` };
      });

      return projectSummaries;
    })();

    const bossFights = (() => {
      const contextLabel = (key: string | null): string | null => {
        if (!key) return null;
        const theme = PROJECT_THEMES.find((t) => t.key === key);
        if (theme) return theme.label;
        const topic = TOPIC_BUCKETS.find((t) => t.key === key);
        if (topic) return topic.label;
        return null;
      };

      const peakMonthFor = (matches: RewindConversationSummary[]) => {
        const counts = new Map<string, number>();
        for (const conv of matches) {
          if (!conv.month) continue;
          counts.set(conv.month, (counts.get(conv.month) ?? 0) + 1);
        }
        const peak = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        return peak ? monthLabel(peak) : null;
      };

      const duringFor = (matches: RewindConversationSummary[]) => {
        const counts = new Map<string, number>();
        for (const conv of matches) {
          const key = conv.themeKey ?? conv.topicKey ?? null;
          if (!key) continue;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const topKey = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        return contextLabel(topKey);
      };

      const buildFight = (fight: {
        title: string;
        example: string;
        snippetPattern: RegExp;
        predicate: (c: RewindConversationSummary) => boolean;
      }): RewindBossFight | null => {
        const matches = conversations.filter(fight.predicate);
        if (matches.length === 0) return null;
        const peak = peakMonthFor(matches);
        const during = duringFor(matches);
        const intensityLine =
          peak ? `in ${matches.length.toLocaleString()} chats · peaked ${peak}` : `in ${matches.length.toLocaleString()} chats`;
        const evidence = matches
          .map((c) => {
            const snippets = c.evidenceSnippets.filter((s) => fight.snippetPattern.test(s)).slice(0, 3);
            if (snippets.length === 0) return null;
            return {
              conversationId: c.conversationId,
              startDay: c.startDay,
              endDay: c.endDay,
              snippets,
            };
          })
          .filter((e): e is RewindEvidencePointer => Boolean(e))
          .slice(0, 8);
        if (evidence.length === 0) return null;
        return {
          key: `bf:${stableHash(fight.title)}`,
          title: fight.title,
          chats: matches.length,
          peak,
          during,
          example: fight.example,
          intensityLine,
          evidence,
        };
      };

      const fights: Array<ReturnType<typeof buildFight>> = [
        buildFight({
          title: "The “doesn't work” era",
          example: "\"doesn't work\"",
          snippetPattern: /\b(why is this broken|doesn'?t work|not working|isn'?t working)\b/i,
          predicate: (c) => c.hasBroken,
        }),
        buildFight({
          title: "Again. Still. Again.",
          example: "\"again\" / \"still\"",
          snippetPattern: /\b(again|still)\b/i,
          predicate: (c) => c.hasAgainStill,
        }),
        buildFight({
          title: "WTF moments",
          example: "\"wtf\"",
          snippetPattern: /\bwtf\b/i,
          predicate: (c) => c.hasWtf,
        }),
        buildFight({
          title: "Decision paralysis",
          example: "\"should i\"",
          snippetPattern: /\b(should i|help me decide|can'?t decide|cannot decide|not sure|unsure|maybe)\b/i,
          predicate: (c) => c.indecisionSignals > 0,
        }),
      ];

      return fights
        .filter((f): f is RewindBossFight => Boolean(f))
        .sort((a, b) => b.chats - a.chats)
        .slice(0, 3);
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

    const rabbitHoles = (() => {
      const dayMs = 24 * 60 * 60 * 1000;
      const blacklist = new Set(["Git", "GitHub", "Windows", "Linux", "macOS"]);

      const formatDayRange = (startKey: string, endKey: string) => {
        const start = parseDayKeyLocal(startKey);
        const end = parseDayKeyLocal(endKey);
        if (!start || !end) return `${startKey} → ${endKey}`;
        const startMonth = (monthNames[start.getMonth()] ?? "").slice(0, 3);
        const endMonth = (monthNames[end.getMonth()] ?? "").slice(0, 3);
        if (startKey === endKey) return `${startMonth} ${start.getDate()}`;
        if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
          return `${startMonth} ${start.getDate()}–${end.getDate()}`;
        }
        return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}`;
      };

      const bestBurstWindow = (byDay: Map<string, number>) => {
        const days = Array.from(byDay.entries())
          .map(([dayKey, chats]) => ({ dayKey, chats, ms: dayKeyUtcMs(dayKey) }))
          .filter((d): d is { dayKey: string; chats: number; ms: number } => d.ms != null)
          .sort((a, b) => a.ms - b.ms);
        if (days.length === 0) return null;

        let start = 0;
        let sum = 0;
        let best:
          | { startKey: string; endKey: string; chats: number; days: number; density: number }
          | null = null;

        for (let end = 0; end < days.length; end++) {
          sum += days[end].chats;
          while (days[end].ms - days[start].ms > 6 * dayMs) {
            sum -= days[start].chats;
            start += 1;
          }
          const spanDays = Math.round((days[end].ms - days[start].ms) / dayMs) + 1;
          const density = spanDays > 0 ? sum / spanDays : 0;
          if (
            !best ||
            density > best.density ||
            (density === best.density && sum > best.chats) ||
            (density === best.density && sum === best.chats && spanDays < best.days)
          ) {
            best = { startKey: days[start].dayKey, endKey: days[end].dayKey, chats: sum, days: spanDays, density };
          }
        }
        return best;
      };

      const holes = new Map<string, { key: string; byDay: Map<string, number>; totalChats: number }>();
      for (const conv of conversations) {
        const dayKey = conv.startDay ?? conv.endDay;
        if (!dayKey) continue;
        const key = conv.stack.find((t) => !blacklist.has(t)) ?? null;
        if (!key) continue;
        const current = holes.get(key) ?? { key, byDay: new Map<string, number>(), totalChats: 0 };
        current.totalChats += 1;
        current.byDay.set(dayKey, (current.byDay.get(dayKey) ?? 0) + 1);
        holes.set(key, current);
      }

      const scored = Array.from(holes.values())
        .map((hole) => {
          const burst = bestBurstWindow(hole.byDay);
          if (!burst) return null;
          const fraction = hole.totalChats > 0 ? burst.chats / hole.totalChats : 0;
          const score = burst.density * 5 + fraction * 3 + burst.chats;
          return { hole, burst, score };
        })
        .filter(
          (x): x is { hole: { key: string; byDay: Map<string, number>; totalChats: number }; burst: NonNullable<ReturnType<typeof bestBurstWindow>>; score: number } =>
            Boolean(x),
        )
        .filter((x) => x.burst.chats >= 3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return scored.map(({ hole, burst }) => {
        const range = formatDayRange(burst.startKey, burst.endKey);
        const why =
          burst.days <= 3 && burst.chats >= 5
            ? "It took over your brain for a few days."
            : burst.days <= 7 && burst.chats >= 6
              ? "It ate a whole week."
              : "A brief obsession.";
        return {
          key: `rh:${stableHash(hole.key)}`,
          title: hole.key,
          range,
          chats: burst.chats,
          days: burst.days,
          why,
          excerpt: null,
          evidence: conversations
            .filter((c) => c.startDay && c.endDay && c.stack.includes(hole.key))
            .filter((c) => {
              if (!c.startDay) return false;
              const ms = dayKeyUtcMs(c.startDay);
              const start = dayKeyUtcMs(burst.startKey);
              const end = dayKeyUtcMs(burst.endKey);
              if (ms == null || start == null || end == null) return true;
              return ms >= start && ms <= end;
            })
            .slice(0, 8)
            .map((c) => ({
              conversationId: c.conversationId,
              startDay: c.startDay,
              endDay: c.endDay,
              snippets: [hole.key],
            })),
        };
      });
    })();

    const trips = (() => {
      if (travelConversations.length === 0) return { tripCount: 0, topTrips: [] };

      const formatRange = (start: string | null, end: string | null) => {
        if (!start) return null;
        if (!end || end === start) return monthLabel(start.slice(0, 7)) + ` ${start.slice(-2)}`;
        const startDate = parseDayKeyLocal(start);
        const endDate = parseDayKeyLocal(end);
        if (!startDate || !endDate) return `${start} → ${end}`;
        const startMonth = (monthNames[startDate.getMonth()] ?? "").slice(0, 3);
        const endMonth = (monthNames[endDate.getMonth()] ?? "").slice(0, 3);
        if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
          return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`;
        }
        return `${startMonth} ${startDate.getDate()}-${endMonth} ${endDate.getDate()}`;
      };

      const byDestination = new Map<string, typeof travelConversations>();
      const unknownDestination: typeof travelConversations = [];
      for (const conv of travelConversations) {
        if (!conv.destination) {
          unknownDestination.push(conv);
          continue;
        }
        const key = conv.destination.toLowerCase();
        const current = byDestination.get(key) ?? [];
        current.push(conv);
        byDestination.set(key, current);
      }

      const clusters: RewindWrappedSummary["trips"]["topTrips"] = [];

      for (const [destKey, convs] of byDestination.entries()) {
        const sorted = [...convs].sort((a, b) => (dayKeyUtcMs(a.startDay ?? "") ?? 0) - (dayKeyUtcMs(b.startDay ?? "") ?? 0));
        let current: typeof sorted = [];
        let lastMs: number | null = null;

        const flush = () => {
          if (current.length === 0) return;
          const destination = current[0]?.destination ?? destKey;
          const chats = current.length;
          const messageHits = current.reduce((sum, c) => sum + c.messageHits, 0);
          const strongHits = current.reduce((sum, c) => sum + c.strongHits, 0);
          if (chats < 2 && messageHits < 3) {
            current = [];
            lastMs = null;
            return;
          }

          const start = current.map((c) => c.startDay).filter(Boolean).sort()[0] ?? null;
          const end = current.map((c) => c.endDay ?? c.startDay).filter(Boolean).sort().slice(-1)[0] ?? start;
          const peakMonth =
            current
              .map((c) => c.month)
              .filter((m): m is string => typeof m === "string")
              .sort()[0] ?? null;

          let confidence = 0.25;
          if (chats >= 2) confidence += 0.4;
          if (messageHits >= 3) confidence += 0.2;
          if (strongHits >= 2) confidence += 0.2;
          confidence = clamp01(confidence);
          let level: "high" | "medium" | "low" = confidence >= 0.75 ? "high" : confidence >= 0.6 ? "medium" : "low";
          if (level === "high" && strongHits === 0) level = "medium";

          const evidence = current
            .slice(0, 10)
            .map((c) => ({
              conversationId: c.conversationId,
              startDay: c.startDay,
              endDay: c.endDay,
              snippets: c.snippets.slice(0, 3),
            }));

          const key = `trip:${stableHash(destKey)}:${stableHash(String(start ?? ""))}`;

          clusters.push({
            key,
            month: peakMonth ? monthLabel(peakMonth) : null,
            range: formatRange(start, end),
            destination,
            title: "Trip planning",
            titlePrivate: destination ? `Trip planning: ${destination}` : null,
            line: "Flights. Stays. And \"what should we do\" energy.",
            confidence,
            level,
            excerpt: destination ? destination : null,
            evidence,
          });

          current = [];
          lastMs = null;
        };

        for (const conv of sorted) {
          const ms = conv.startDay ? dayKeyUtcMs(conv.startDay) : null;
          if (ms == null) continue;
          if (lastMs != null && ms - lastMs > 30 * 24 * 60 * 60 * 1000) {
            flush();
          }
          current.push(conv);
          lastMs = ms;
        }
        flush();
      }

      if (unknownDestination.length > 0) {
        const sorted = [...unknownDestination].sort((a, b) => (dayKeyUtcMs(a.startDay ?? "") ?? 0) - (dayKeyUtcMs(b.startDay ?? "") ?? 0));
        let current: typeof sorted = [];
        let lastMs: number | null = null;

        const flush = () => {
          if (current.length === 0) return;
          const chats = current.length;
          const messageHits = current.reduce((sum, c) => sum + c.messageHits, 0);
          const strongHits = current.reduce((sum, c) => sum + c.strongHits, 0);
          if (chats < 2 && messageHits < 4) {
            current = [];
            lastMs = null;
            return;
          }

          const start = current.map((c) => c.startDay).filter(Boolean).sort()[0] ?? null;
          const end = current.map((c) => c.endDay ?? c.startDay).filter(Boolean).sort().slice(-1)[0] ?? start;
          const peakMonth =
            current
              .map((c) => c.month)
              .filter((m): m is string => typeof m === "string")
              .sort()[0] ?? null;

          const snippetHint = current.flatMap((c) => c.snippets).filter(Boolean)[0] ?? null;
          const hint = snippetHint ? makeSnippet(snippetHint, { maxWords: 8, maxChars: 72 }) : null;

          let confidence = 0.2;
          if (chats >= 2) confidence += 0.35;
          if (messageHits >= 4) confidence += 0.2;
          if (strongHits >= 2) confidence += 0.2;
          confidence = clamp01(confidence);
          let level: "high" | "medium" | "low" = confidence >= 0.75 ? "high" : confidence >= 0.6 ? "medium" : "low";
          if (level === "high" && strongHits === 0) level = "medium";

          const evidence = current
            .slice(0, 10)
            .map((c) => ({
              conversationId: c.conversationId,
              startDay: c.startDay,
              endDay: c.endDay,
              snippets: c.snippets.slice(0, 3),
            }));

          const key = `trip:unknown:${stableHash(String(start ?? ""))}:${stableHash(String(hint ?? ""))}`;

          clusters.push({
            key,
            month: peakMonth ? monthLabel(peakMonth) : null,
            range: formatRange(start, end),
            destination: null,
            title: "Trip planning",
            titlePrivate: hint ? `Trip planning: ${hint}` : null,
            line: "Flights. Stays. And \"what should we do\" energy.",
            confidence,
            level,
            excerpt: hint,
            evidence,
          });

          current = [];
          lastMs = null;
        };

        for (const conv of sorted) {
          const ms = conv.startDay ? dayKeyUtcMs(conv.startDay) : null;
          if (ms == null) {
            current.push(conv);
            continue;
          }
          if (lastMs != null && ms - lastMs > 30 * 24 * 60 * 60 * 1000) {
            flush();
          }
          current.push(conv);
          lastMs = ms;
        }
        flush();
      }

      clusters.sort((a, b) => {
        const levelScore = (x: typeof a) => (x.level === "high" ? 3 : x.level === "medium" ? 2 : 1);
        return levelScore(b) - levelScore(a) || b.confidence - a.confidence || b.evidence.length - a.evidence.length;
      });
      const visible = clusters.filter((t) => t.level !== "low");
      return { tripCount: visible.length, topTrips: visible.slice(0, 3) };
    })();

    const lifeHighlights = (() => {
      const peakMonthLabel = (months: Map<string, number>): string | null => {
        const best = Array.from(months.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        return best ? monthLabel(best) : null;
      };

      const titleFor = (type: string, label: string) => {
        switch (type) {
          case "language":
            return `${label} practice`;
          case "career":
            return `${label} season`;
          case "fitness":
            return `${label} era`;
          case "food":
            return `${label} phase`;
          case "life":
            return label;
          default:
            return label;
        }
      };

      const lineFor = (type: string, label: string) => {
        switch (type) {
          case "language":
            return `You kept coming back to ${label}. Not just once.`;
          case "career":
            return "Real-life moves made it into the chat log. Respect.";
          case "fitness":
            return `You had a ${label.toLowerCase()} era. We saw it.`;
          case "food":
            return `You asked about ${label.toLowerCase()}. Priorities.`;
          case "life":
            return "Real-life logistics made an appearance.";
          default:
            return "It came up enough to count.";
        }
      };

      const candidates = Array.from(lifeHighlightAccumulators.values()).filter((c) => {
        const dayCount = c.days.size;
        const hasSpread = c.chats >= 2 || dayCount >= 2;

        // Truth-first gating: a single keyword in one chat should never become a "life highlight".
        if (c.type === "language") {
          // Language mentions are especially prone to false positives from meta-prompts/examples.
          return hasSpread && c.messages >= 3 && c.strong >= 2;
        }

        if (c.type === "fitness") {
          return hasSpread && c.messages >= 3 && c.strong >= 1;
        }

        if (c.type === "food") {
          return hasSpread && c.messages >= 3 && c.strong >= 1;
        }

        // Career / life ops: still require repetition + some spread.
        return hasSpread && (c.chats >= 2 || c.messages >= 4) && c.strong >= 1;
      });

      const out: RewindWrappedSummary["lifeHighlights"] = [];
      for (const c of candidates) {
        let confidence = 0.15;
        if (c.chats >= 2) confidence += 0.35;
        if (c.messages >= 3) confidence += 0.2;
        if (c.strong >= 1) confidence += 0.15;
        if (c.strong >= 3) confidence += 0.1;
        if (c.days.size >= 2) confidence += 0.1;
        if (c.days.size >= 4) confidence += 0.05;
        if (c.chats >= 4) confidence += 0.1;
        confidence = clamp01(confidence);
        let level: "high" | "medium" | "low" = confidence >= 0.75 ? "high" : confidence >= 0.6 ? "medium" : "low";
        if (level === "high" && c.strong === 0) level = "medium";
        if (c.days.size <= 1 && level === "high") level = "medium";

        const month = peakMonthLabel(c.months);
        const evidence = Array.from(c.evidence.values())
          .sort((a, b) => (dayKeyUtcMs(a.startDay ?? "") ?? 0) - (dayKeyUtcMs(b.startDay ?? "") ?? 0))
          .slice(0, 8);
        const excerpt = evidence.flatMap((e) => e.snippets).filter(Boolean)[0] ?? null;

        out.push({
          key: c.key,
          type: c.type,
          month,
          title: titleFor(c.type, c.labelSafe),
          titlePrivate: c.labelPrivate ? titleFor(c.type, c.labelPrivate) : null,
          line: lineFor(c.type, c.labelSafe),
          confidence,
          level,
          excerpt,
          evidence,
        });
      }

      out.sort((a, b) => {
        const levelScore = (x: typeof a) => (x.level === "high" ? 3 : x.level === "medium" ? 2 : 1);
        return levelScore(b) - levelScore(a) || b.confidence - a.confidence;
      });

      return out.slice(0, 10);
    })();

    const bestMoments = (() => {
      const pickMonth = (m: string | null) => (m ? monthLabel(m) : null);
      const evidenceFor = (conv: RewindConversationSummary | null, snippetsPreferred: string[]): RewindEvidencePointer[] => {
        if (!conv) return [];
        const base = snippetsPreferred.length > 0 ? snippetsPreferred : conv.evidenceSnippets;
        const snippets = Array.from(new Set(base.filter(Boolean))).slice(0, 3);
        if (snippets.length === 0) return [];
        return [
          {
            conversationId: conv.conversationId,
            startDay: conv.startDay,
            endDay: conv.endDay,
            snippets,
          },
        ];
      };

      const funniest = (() => {
        const candidate = conversations
          .filter((c) => c.hasQuickIntro)
          .sort((a, b) => b.userMessages - a.userMessages)[0];
        if (!candidate) return null;
        const phrase =
          candidate.evidenceSnippets.find((s) => /quick question|real quick|simple question/i.test(s)) ?? null;
        if (!phrase) return null;
        const evidence = evidenceFor(candidate, [phrase]);
        if (evidence.length === 0) return null;
        return {
          key: `moment:${stableHash("quick")}:${stableHash(candidate.conversationId ?? candidate.startDay ?? "")}`,
          title: "The “quick question” lie",
          month: pickMonth(candidate.month),
          line: `You said “${phrase}”. It turned into ${candidate.userMessages.toLocaleString()} prompts.`,
          excerpt: phrase,
          evidence,
        };
      })();

      const intense = (() => {
        const candidate = [...conversations].sort((a, b) => b.maxPromptChars - a.maxPromptChars)[0];
        if (!candidate || candidate.maxPromptChars <= 0) return null;
        if (candidate.evidenceSnippets.length === 0) return null;
        const evidence = evidenceFor(candidate, candidate.evidenceSnippets.slice(0, 1));
        if (evidence.length === 0) return null;
        return {
          key: `moment:${stableHash("intense")}:${stableHash(candidate.conversationId ?? candidate.startDay ?? "")}`,
          title: "Most intense moment",
          month: pickMonth(candidate.month),
          line: `One prompt hit ${candidate.maxPromptChars.toLocaleString()} characters. You meant business.`,
          excerpt: null,
          evidence,
        };
      })();

      const biggestWin = (() => {
        const candidate = conversations
          .filter((c) => c.comeback)
          .sort((a, b) => b.winSignals - a.winSignals)[0];
        if (!candidate) return null;
        const winSnippets = candidate.evidenceSnippets.filter((s) =>
          /\b(it worked|it works|solved|fixed|perfect|nailed it|done|thanks?)\b/i.test(s),
        );
        const evidence = evidenceFor(candidate, winSnippets);
        if (evidence.length === 0) return null;
        return {
          key: `moment:${stableHash("win")}:${stableHash(candidate.conversationId ?? candidate.startDay ?? "")}`,
          title: "Biggest win",
          month: pickMonth(candidate.month),
          line: "Stuck → solved. You pulled it off.",
          excerpt: null,
          evidence,
        };
      })();

      const facepalm = (() => {
        const candidate = conversations
          .filter((c) => c.mood === "frustrated" && c.winSignals === 0)
          .sort((a, b) => b.frictionSignals - a.frictionSignals)[0];
        if (!candidate) return null;
        const brokenSnippets = candidate.evidenceSnippets.filter((s) =>
          /\b(why is this broken|doesn'?t work|not working|isn'?t working)\b/i.test(s),
        );
        const evidence = evidenceFor(candidate, brokenSnippets);
        if (evidence.length === 0) return null;
        return {
          key: `moment:${stableHash("facepalm")}:${stableHash(candidate.conversationId ?? candidate.startDay ?? "")}`,
          title: "Biggest facepalm",
          month: pickMonth(candidate.month),
          line: "You tried everything. The universe said no.",
          excerpt: brokenSnippets[0] ?? null,
          evidence,
        };
      })();

      const wholesome = (() => {
        const candidate = conversations.filter((c) => c.mood === "flow").sort((a, b) => b.winSignals - a.winSignals)[0];
        if (!candidate) return null;
        const winSnippets = candidate.evidenceSnippets.filter((s) =>
          /\b(it worked|it works|solved|fixed|perfect|nailed it|done|thanks?)\b/i.test(s),
        );
        const evidence = evidenceFor(candidate, winSnippets);
        if (evidence.length === 0) return null;
        return {
          key: `moment:${stableHash("wholesome")}:${stableHash(candidate.conversationId ?? candidate.startDay ?? "")}`,
          title: "Most wholesome streak",
          month: pickMonth(candidate.month),
          line: "Low chaos. High momentum. More of that.",
          excerpt: null,
          evidence,
        };
      })();

      const out: RewindWrappedSummary["bestMoments"] = [];
      [funniest, intense, biggestWin, facepalm, wholesome].forEach((m) => {
        if (m) out.push(m);
      });
      return out.slice(0, 5);
    })();

    const growthUpgrades = (() => {
      const upgrades: RewindWrappedSummary["growthUpgrades"] = [];

      if (earlyMessageCount >= 25 && lateMessageCount >= 25) {
        const earlyHedgeRate = earlyHedgeMessages / earlyMessageCount;
        const lateHedgeRate = lateHedgeMessages / lateMessageCount;
        const deltaPts = Math.round((lateHedgeRate - earlyHedgeRate) * 100);
        if (Math.abs(deltaPts) >= 8) {
          upgrades.push({
            title: "Less “maybe”, more direct",
            line:
              deltaPts < 0
                ? "You got more decisive as the year went on."
                : "You got more cautious later in the year (still valid).",
            delta: `${Math.abs(deltaPts)} pts`,
          });
        }

        const earlyConstraintRate = earlyConstraintMessages / earlyMessageCount;
        const lateConstraintRate = lateConstraintMessages / lateMessageCount;
        const constraintDeltaPts = Math.round((lateConstraintRate - earlyConstraintRate) * 100);
        if (Math.abs(constraintDeltaPts) >= 8) {
          upgrades.push({
            title: "More constraints, fewer guesses",
            line:
              constraintDeltaPts > 0
                ? "You started telling the AI exactly what you wanted."
                : "You loosened up later in the year. Freedom arc.",
            delta: `${Math.abs(constraintDeltaPts)} pts`,
          });
        }
      }

      if (earlyTurnsToWinCount >= 8 && lateTurnsToWinCount >= 8) {
        const avgEarly = earlyTurnsToWinSum / earlyTurnsToWinCount;
        const avgLate = lateTurnsToWinSum / lateTurnsToWinCount;
        const diff = Math.round(avgLate - avgEarly);
        if (Math.abs(diff) >= 1) {
          upgrades.push({
            title: "Faster from stuck → solved",
            line: diff < 0 ? "You got to the win in fewer turns." : "You took longer later in the year (bigger problems).",
            delta: `${Math.abs(diff)} turns`,
          });
        }
      }

      if (promptLengthChangePercent != null && Math.abs(promptLengthChangePercent) >= 10) {
        upgrades.push({
          title: "Your prompt style changed",
          line:
            promptLengthChangePercent < 0
              ? "Early-year: essays. End-of-year: commands."
              : "More context, more control. You stopped winging it.",
          delta: `${Math.abs(promptLengthChangePercent)}%`,
        });
      }

      return upgrades.slice(0, 5);
    })();

    const youVsYou = (() => {
      const lines: string[] = [];
      const busiestByChats = Array.from(monthStats.entries()).sort((a, b) => b[1].chats - a[1].chats)[0];
      if (busiestByChats && monthStats.size >= 3) {
        const [monthKey, stats] = busiestByChats;
        const avg = totalConversations / monthStats.size;
        const ratio = avg > 0 ? stats.chats / avg : 0;
        if (ratio >= 1.3) {
          lines.push(`${monthLabel(monthKey)} was ${ratio.toFixed(1)}× your average month.`);
        }
      }

      const mostDecisive = (() => {
        const entries = Array.from(monthStats.entries());
        const withEnough = entries.filter(([, s]) => s.chats >= 10);
        if (withEnough.length === 0) return null;
        const best = withEnough
          .map(([k, s]) => ({ k, score: s.chats > 0 ? s.indecision / s.chats : 0 }))
          .sort((a, b) => a.score - b.score)[0];
        return best?.k ? monthLabel(best.k) : null;
      })();

      if (mostDecisive) lines.push(`Most decisive month: ${mostDecisive}. (Lowest “should I” energy.)`);
      if (lateNightPercent <= 10) lines.push(`Late-night chats were only ${lateNightPercent}%. You spiraled offline, apparently.`);
      return lines.slice(0, 3);
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
        bossFights[0]?.example
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

    const deepDive: RewindDeepDive = (() => {
      const pct = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

      const dist = <TKey extends string>(
        map: Map<TKey, number>,
        labelFor: (key: TKey) => string,
      ): Array<{ key: TKey; label: string; count: number; pct: number }> => {
        const total = Array.from(map.values()).reduce((sum, v) => sum + v, 0);
        return Array.from(map.entries())
          .map(([key, count]) => ({ key, label: labelFor(key), count, pct: pct(count, total) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
      };

      const intentLabel = (key: ForensicIntent) =>
        ({
          info_seeking: "Info-seeking",
          decision_support: "Decision support",
          brainstorming: "Brainstorming",
          drafting_editing: "Drafting & editing",
          coding_technical: "Coding & technical",
          planning: "Planning",
          emotional_processing: "Emotional processing",
          conflict_scripting: "Conflict scripting",
          self_reflection: "Self-reflection",
          productivity_accountability: "Productivity",
        })[key];

      const domainLabel = (key: ForensicDomain) =>
        ({
          work_career: "Work/career",
          relationships: "Relationships",
          health_fitness: "Health/fitness",
          money: "Money",
          creative: "Creative",
          learning: "Learning",
          admin_life_ops: "Life ops",
          travel: "Travel",
          other: "Other",
        })[key];

      const cognitiveLabel = (key: ForensicCognitiveMode) =>
        ({
          exploratory: "Exploring",
          convergent: "Deciding",
          debugging: "Debugging",
          reflective: "Reflecting",
        })[key];

      const toneLabel = (key: ForensicTone) =>
        ({
          calm: "Calm",
          frustrated: "Frustrated",
          anxious: "Anxious",
          excited: "Excited",
          uncertain: "Uncertain",
          motivated: "Motivated",
          tired: "Tired",
        })[key];

      const helpLabel = (key: ForensicHelpType) =>
        ({
          structure: "Structure",
          reassurance: "Reassurance",
          critique: "Critique",
          step_by_step: "Step-by-step",
          examples: "Examples",
          templates: "Templates",
          accountability: "Accountability",
        })[key];

      const avgSessionMins = sessionDurationMinsCount > 0 ? Math.round(sessionDurationMinsSum / sessionDurationMinsCount) : null;
      const avgPromptsPerSession = totalSessions > 0 ? Math.round(sessionPromptsSum / totalSessions) : null;

      const topOpeners = Array.from(openerCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((o) => ({
          label: o.label,
          count: o.count,
          excerpt: Array.from(o.excerpts)[0] ?? null,
          evidence: Array.from(o.evidence.values()).slice(0, 3),
        }));

      const topEndings = Array.from(endingCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((e) => ({ label: e.label, count: e.count, evidence: Array.from(e.evidence.values()).slice(0, 3) }));

      const exploratorySessions = forensicCognitiveModeCounts.get("exploratory") ?? 0;
      const convergentSessions = forensicCognitiveModeCounts.get("convergent") ?? 0;
      const line =
        convergentSessions > 0
          ? `Options mode: ${exploratorySessions.toLocaleString()} sessions. Decision mode: ${convergentSessions.toLocaleString()} sessions.`
          : `Mostly options mode: ${exploratorySessions.toLocaleString()} sessions of exploring.`;

      const signatureOpeningMoves = Array.from(openingPhraseCounts.entries())
        .filter(([phrase, count]) => {
          if (count < 4) return false;
          if (phrase === "can you" || phrase === "please help" || phrase === "help me" || phrase === "i need") return false;
          const tokens = phrase.split(/\s+/).filter(Boolean);
          const significant = tokens.filter((t) => t.length >= 4 && !STOPWORDS.has(t));
          return significant.length >= 1;
        })
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([phrase, count]) => ({ phrase, count }));

      const constraints: RewindDeepDive["signaturePrompts"]["constraints"] = [];
      if (behavior.stepByStepCount >= 10) {
        constraints.push({
          label: "Step-by-step",
          count: behavior.stepByStepCount,
          line: `You asked for "step by step" ${behavior.stepByStepCount.toLocaleString()} times. You like clean sequences.`,
        });
      }
      const templateCount = forensicHelpTypeCounts.get("templates") ?? 0;
      if (templateCount >= 12) {
        constraints.push({
          label: "Templates",
          count: templateCount,
          line: "You don't want vibes. You want a starting point you can copy/paste.",
        });
      }
      const critiqueCount = forensicHelpTypeCounts.get("critique") ?? 0;
      if (critiqueCount >= 10) {
        constraints.push({
          label: "Critique",
          count: critiqueCount,
          line: "You asked for critique more than comfort. Respect.",
        });
      }
      const exampleCount = forensicHelpTypeCounts.get("examples") ?? 0;
      if (exampleCount >= 12) {
        constraints.push({
          label: "Examples",
          count: exampleCount,
          line: "You learn by pattern-matching. 'Show me' is your move.",
        });
      }
      if (constraints.length === 0) {
        constraints.push({ label: "Momentum", count: 0, line: "You mostly used AI to keep momentum - quick asks, quick pivots." });
      }

      const resolvedRate = totalSessions > 0 ? Math.round((resolvedSessions / totalSessions) * 100) : 0;

      const loops = Array.from(loopCounts.values())
        .filter((l) => l.count >= 3)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((l) => {
          const evidence = Array.from(l.evidence.values()).slice(0, 3);
          const confidence = clamp01(0.45 + Math.min(l.count / 14, 0.5));

          const script = (() => {
            switch (l.key) {
              case "start_friction":
                return {
                  cost: "You lose time at the starting line. Momentum dies before it begins.",
                  experiment:
                    "Start every 'start' session with: 3 options + 1 recommended path + a 10-minute v1. Then force a v2.",
                  metric: `Raise your resolved-session rate from ${resolvedRate}% to ${Math.min(99, resolvedRate + 10)}%.`,
                };
              case "reassurance":
                return {
                  cost: "You get relief, then the same worry comes back in a new outfit.",
                  experiment:
                    "When you want reassurance, ask for a 3-step plan + one tiny action to take today (not a pep talk).",
                  metric: `Reduce abandoned sessions by 10% (baseline: ${abandonedSessions.toLocaleString()} abandoned).`,
                };
              case "decision_paralysis":
                return {
                  cost: "You gather angles, but delay the commit.",
                  experiment:
                    "Use a decision prompt: constraints first, then 'pick 1', then 'tell me what to do next in 20 minutes'.",
                  metric: `Increase decision-mode sessions by 10% without lowering your resolved rate (${resolvedRate}%).`,
                };
              case "perfection":
                return {
                  cost: "You polish the draft instead of shipping it.",
                  experiment:
                    "Set a hard rule: 2 drafts max. After v2, you send/ship, then you iterate based on reality.",
                  metric: `Increase resolved sessions while lowering prompts-per-session (baseline: ${avgPromptsPerSession ?? 0}).`,
                };
              case "avoidance":
                return {
                  cost: "You rehearse the message more than you send it.",
                  experiment:
                    "Ask for 3 versions, pick one, and send it within 10 minutes. Then debrief what happened.",
                  metric: "More sessions that end with a send / done / solved signal.",
                };
              default:
                return {
                  cost: "It keeps pulling you back in.",
                  experiment: "Run a smaller loop: ask 3 questions, pick 1 action, do it, then come back.",
                  metric: "More sessions ending with a win signal.",
                };
            }
          })();

          return {
            key: l.key,
            title: l.title,
            observation: `This showed up in ${l.count.toLocaleString()} sessions.`,
            evidenceLine: `${l.count.toLocaleString()} sessions (not a one-off).`,
            evidence,
            cost: script.cost,
            experiment: script.experiment,
            successMetric: script.metric,
            confidence,
          };
        });

      const relationshipStyle = (() => {
        const roleCounts = new Map<string, number>();
        const addRole = (role: string, count: number) => roleCounts.set(role, (roleCounts.get(role) ?? 0) + count);

        for (const [intent, count] of forensicIntentCounts.entries()) {
          switch (intent) {
            case "coding_technical":
              addRole("Co-builder", count);
              break;
            case "drafting_editing":
              addRole("Editor", count);
              break;
            case "planning":
              addRole("Planner", count);
              break;
            case "decision_support":
              addRole("Strategist", count);
              break;
            case "brainstorming":
              addRole("Idea generator", count);
              break;
            case "info_seeking":
              addRole("Tutor", count);
              break;
            case "emotional_processing":
              addRole("Coach", count);
              break;
            case "self_reflection":
              addRole("Mirror", count);
              break;
            case "conflict_scripting":
              addRole("Scriptwriter", count);
              break;
            case "productivity_accountability":
              addRole("Accountability buddy", count);
              break;
          }
        }

        const total = Array.from(roleCounts.values()).reduce((sum, v) => sum + v, 0);
        const roles = Array.from(roleCounts.entries())
          .map(([role, count]) => ({ role, count, pct: pct(count, total) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        const primary = roles[0]?.role ?? "Second brain";
        const secondary = roles[1]?.role ?? null;
        const line = secondary
          ? `Mostly a ${primary.toLowerCase()}. Second most: ${secondary.toLowerCase()}.`
          : `Mostly a ${primary.toLowerCase()}.`;

        return { primary, line, roles };
      })();

      const insights: RewindInsight[] = (() => {
        const out: RewindInsight[] = [];
        const topOpener = topOpeners[0] ?? null;
        if (topOpener && topOpener.count >= 10) {
          const confidence = clamp01(0.45 + Math.min(topOpener.count / 40, 0.45));
          out.push({
            key: "insight:opening",
            title: "Your opening move",
            observation: `Most sessions started as ${topOpener.label.toLowerCase()}.`,
            evidence: {
              counts: [`Top opening move: ${topOpener.label} (${topOpener.count.toLocaleString()} sessions).`],
              excerpts: topOpener.excerpt ? [topOpener.excerpt] : [],
              pointers: topOpener.evidence.slice(0, 3),
            },
            interpretation: "You use AI to get traction fast: direction first, details second.",
            cost: "When the opener is fuzzy, the rest of the session drifts.",
            experiment: "Start with constraints: goal, deadline, and what 'done' looks like. Then ask for a v1 immediately.",
            successMetric: `More sessions ending resolved (baseline: ${resolvedRate}%).`,
            confidence,
          });
        }

        const topLoop = loops[0] ?? null;
        if (topLoop) {
          out.push({
            key: `insight:loop:${topLoop.key}`,
            title: topLoop.title,
            observation: topLoop.observation,
            evidence: {
              counts: [topLoop.evidenceLine],
              excerpts: [],
              pointers: topLoop.evidence.slice(0, 3),
            },
            interpretation: "This isn't a flaw. It's a predictable pattern you can design around.",
            cost: topLoop.cost,
            experiment: topLoop.experiment,
            successMetric: topLoop.successMetric,
            confidence: topLoop.confidence,
          });
        }

        const upgrade = growthUpgrades[0] ?? null;
        if (upgrade) {
          out.push({
            key: "insight:growth",
            title: "Your growth signal",
            observation: upgrade.title + ".",
            evidence: { counts: upgrade.delta ? [upgrade.delta] : [], excerpts: [], pointers: [] },
            interpretation: upgrade.line,
            cost: "If you don't notice the upgrade, you keep using the old playbook.",
            experiment: "Pick one prompt habit to lock in for 30 days (constraints, decision prompts, or v2 rule).",
            successMetric: "More sessions that end with a win signal (solved/fixed/done).",
            confidence: 0.62,
          });
        }

        if (relationshipStyle.roles.length > 0) {
          out.push({
            key: "insight:relationship",
            title: "Your AI relationship style",
            observation: `You mostly treated AI like a ${relationshipStyle.primary.toLowerCase()}.`,
            evidence: { counts: relationshipStyle.roles.slice(0, 2).map((r) => `${r.role}: ${r.pct}%`), excerpts: [], pointers: [] },
            interpretation: "You don't outsource thinking. You outsource friction.",
            cost: "When you ask for vibes, you get vibes back.",
            experiment: "When it matters, ask for: assumptions → options → a recommendation → next steps.",
            successMetric: `More convergent (decision) sessions without lowering resolved rate (${resolvedRate}%).`,
            confidence: 0.58,
          });
        }

        const boss = bossFights[0] ?? null;
        if (boss && boss.chats >= 8) {
          out.push({
            key: "insight:boss",
            title: "The boss fight you replayed",
            observation: `${boss.title}. It kept showing up.`,
            evidence: {
              counts: [`${boss.chats.toLocaleString()} chats · peak: ${boss.peak ?? "unknown"}`],
              excerpts: [boss.example],
              pointers: boss.evidence.slice(0, 3),
            },
            interpretation: "You hit the same friction point often enough that it's worth a dedicated fix.",
            cost: "You spend energy re-solving the same problem.",
            experiment: "Write a one-page 'debug checklist' for your top boss fight, then reuse it every time.",
            successMetric: "Fewer abandoned sessions in the months after the checklist.",
            confidence: clamp01(0.45 + Math.min(boss.chats / 30, 0.45)),
          });
        }

        return out.slice(0, 6);
      })();

      const actionPlan: RewindActionPlan = (() => {
        const keepDoing: string[] = [];
        const adjust: string[] = [];
        const stopDoing: string[] = [];

        if (behavior.stepByStepCount >= 10) keepDoing.push("Keep asking for step-by-step when you're stuck. It works for you.");
        if (projects.length >= 3) keepDoing.push("Keep using AI as a co-builder. You ship more when you do.");
        if (trips.tripCount >= 1) keepDoing.push("Keep using AI to plan logistics. You like fewer surprises.");
        if (keepDoing.length < 3) keepDoing.push("Keep using AI as a second brain for quick momentum.");

        const topLoop = loops[0] ?? null;
        if (topLoop?.key === "start_friction") adjust.push("Add a 'v1 in 10 minutes' rule for anything you're starting.");
        if (topLoop?.key === "decision_paralysis") adjust.push("Switch from options → decision prompts when it's time to commit.");
        if (topLoop?.key === "reassurance") adjust.push("Trade reassurance for a tiny plan + one action for today.");
        if (adjust.length < 3) adjust.push("End sessions with a next step you can do in under 20 minutes.");

        if (behavior.quickQuestionCount >= 10) stopDoing.push('Stop calling them "quick questions." You and I both know.');
        if (behavior.brokenCount >= 15) stopDoing.push("Stop brute-forcing when you're frustrated. Switch to hypotheses → checks → fixes.");
        if (stopDoing.length < 3) stopDoing.push("Stop ending sessions mid-spiral. Ask for a crisp next step, then log off.");

        const promptTemplates: Array<{ title: string; template: string }> = [
          {
            title: "Start a thing (fast)",
            template:
              "Goal: [what you want].\nConstraints: [time/budget/tools].\nAsk me 5 clarifying questions.\nThen give 3 approaches and pick 1.\nThen draft a v1 I can use in 10 minutes.",
          },
          {
            title: "Make a decision",
            template:
              "I need to choose between A/B/C.\nMy constraints: [musts], [nice-to-haves].\nAsk up to 3 questions.\nThen pick 1 option and justify it.\nThen give the next 3 actions (20 minutes each).",
          },
          {
            title: "Debug like a grown-up",
            template:
              "What I'm trying to do: ...\nWhat happened: ...\nWhat I expected: ...\nEnvironment: ...\nGive 3 hypotheses.\nFor each: how to test → how to fix.\nThen tell me which to try first.",
          },
          {
            title: "Rewrite with constraints",
            template:
              "Rewrite this for: [audience].\nTone: [e.g., confident, warm, direct].\nConstraints: [length, bullets, no jargon].\nGive 3 variants and explain the differences in one line each.\nText: ...",
          },
          {
            title: "Get unstuck (no pep talk)",
            template:
              "I'm stuck on: ...\nAsk me 5 questions to locate the real blocker.\nThen propose 2 experiments I can run today.\nEach experiment should take < 20 minutes.\nEnd with a one-line success metric.",
          },
        ];

        return {
          keepDoing: keepDoing.slice(0, 3),
          adjust: adjust.slice(0, 3),
          stopDoing: stopDoing.slice(0, 3),
          promptTemplates,
        };
      })();

      const useMap: RewindDeepDive["useMap"] = {
        totalSessions,
        avgSessionMins,
        avgPromptsPerSession,
        resolvedSessions,
        abandonedSessions,
        intents: dist(forensicIntentCounts, intentLabel),
        domains: dist(forensicDomainCounts, domainLabel),
        cognitiveModes: dist(forensicCognitiveModeCounts, cognitiveLabel),
        tones: dist(forensicToneCounts, toneLabel),
        helpTypes: dist(forensicHelpTypeCounts, helpLabel),
        topOpeners,
        topEndings,
        ratios: { exploratorySessions, convergentSessions, line },
      };

      return {
        useMap,
        signaturePrompts: { openingMoves: signatureOpeningMoves, constraints },
        loops,
        relationshipStyle,
        insights,
        actionPlan,
      };
    })();

    const wrapped: RewindWrappedSummary = {
      archetype,
      hook,
      projects,
      bossFights,
      trips,
      wins,
      comebackMoment,
      timeline,
      weirdRabbitHole,
      rabbitHoles,
      lifeHighlights,
      bestMoments,
      growthUpgrades,
      youVsYou,
      forecast,
      deepDive,
      closingLine,
    };

    return {
      coverage,
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
      privacyScan,
    };
  };

  return { addConversation, summary };
}

export function analyzeChatExport(
  conversations: unknown[],
  options?: { now?: Date; daysBack?: number; since?: Date; until?: Date },
): RewindSummary {
  const analyzer = createRewindAnalyzer(options);
  for (const conv of conversations) analyzer.addConversation(conv);
  return analyzer.summary();
}
