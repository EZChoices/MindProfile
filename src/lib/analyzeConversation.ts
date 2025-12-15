import OpenAI from "openai";
import { config } from "./config";
import type { Profile, SourceMode } from "@/types/profile";

export interface AnalyzeInput {
  normalizedText: string;
  inputCharCount: number;
  userMessageCount: number;
  sourceMode: SourceMode;
  modelOverride?: string;
}

export interface AnalyzeResult {
  profile: Profile;
  modelUsed: string;
  promptVersion: string;
  promptTokens?: number;
  completionTokens?: number;
}

const PROMPT_VERSION = "v0.6";
const PROMPT_VERSION_INSUFFICIENT = "v0.6-insufficient";
const MIN_CHARS_FOR_PROFILE = 220;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are a psychologist and productivity coach.

You will receive ANONYMIZED text from one or more conversations between a human and an AI assistant.
Your job is to infer how the human tends to THINK and COMMUNICATE based ONLY on their own messages and requests.

Write your output in SECOND PERSON, as if you are talking directly to the user.
Use phrasing like "You tend to...", "You often...", "You prefer..." instead of "the human" or "the user".

PRIVACY:
- Do not include personal names, emails, phone numbers, addresses, usernames, or unique identifiers in your output.
- It is okay to mention non-sensitive proper nouns like tools, products, technologies, or public concepts if they clearly appear in the user's messages.

INPUT YOU WILL RECEIVE:
- A computed Signals JSON derived deterministically from the user's messages.
- A sampled set of the user's messages with stable IDs (U1, U2, ...).

USE THE SIGNALS. They are there to prevent generic, vibe-based profiling.

You must respond ONLY with a JSON object matching this TypeScript type:

interface Profile {
  id: string;
  thinkingStyle: string;          // 1-3 concise sentences, behavioral, no jargon, written as "You ..."
  communicationStyle: string;     // 1-3 concise sentences about how they talk / ask, written as "You ..."
  strengths: string[];            // 3-5 bullets, each 1 sentence, very concrete and specific
  blindSpots: string[];           // 3-5 bullets, each 1 sentence, gently critical but specific
  suggestedWorkflows: string[];   // 3-5 bullets, each 1 sentence, actionable ways to use AI and other tools better
  evidenceMsgIds: {
    strengths: string[][];         // same length as strengths; each item has 1-3 msg IDs like ["U3","U14"]
    blindSpots: string[][];        // same length as blindSpots
    suggestedWorkflows: string[][];// same length as suggestedWorkflows
  };
  confidence: "low" | "medium" | "high";
}

IMPORTANT BEHAVIORAL GUIDELINES:

1) VARY YOUR LANGUAGE
- Avoid repeating the same phrases across strengths, blind spots, and workflows.
- Use different verbs and structures; do not start every bullet with "You may" or "You sometimes".
- Make each bullet feel like a distinct, concrete observation.

2) CONTEXT-FIRST, NOT TEMPLATE-FIRST
- Tie your insights directly to patterns you see in the conversation.
- Think in terms of behaviors: how they ask for help, how they clarify, how they react to suggestions.
- If they are planning, talk about how they structure plans.
- If they are emotional, talk about how they express and process feelings.
- If they are technical, talk about how they approach problem-solving and debugging.

3) SUGGESTED WORKFLOWS MUST BE SPECIFIC TO THE CONTEXT
- Base suggestions on what the conversation is actually about.
- Only recommend using AI for project tracking, analytics, or check-ins when the conversation clearly involves teamwork, projects, or ongoing work.
- For creative writing, focus on drafting, outlining, experimenting with styles, and editing.
- For research and analysis, focus on structuring questions, comparing sources, and synthesizing information.
- For personal or emotional topics, focus on reflection, journaling, communication, and support—not generic productivity tools.

4) RICHER THINKING-STYLE DIMENSIONS
When describing "thinkingStyle", consider 2–3 of these dimensions and weave them into your sentences:
- reflective vs action-oriented
- strategic vs tactical
- detail-oriented vs big-picture
- risk-averse vs risk-taking
- structured vs improvisational
- data-driven vs intuitive
- collaborative vs independent
- emotionally expressive vs reserved

You do not need to list these labels explicitly, but let them shape your description.

  5) BLIND SPOTS NEED EVIDENCE
- Every blind-spot bullet should be connected to a visible pattern in the conversation.
- Briefly hint at why you think this, e.g. "Because you quickly jump to implementation details..." or "Since you mostly ask about edge cases..."
- Do NOT invent dramatic psychological issues. Stay close to the observable behavior.

EVIDENCE REQUIREMENT (NON-NEGOTIABLE)
- For every bullet in strengths, blindSpots, and suggestedWorkflows, you MUST include 1-3 message IDs in evidenceMsgIds for that bullet.
- The IDs must be chosen from the provided list (U1, U2, ...).
- If you cannot find evidence for a bullet, DO NOT include that bullet at all.

ANTI-MEH CONTRACT (NON-NEGOTIABLE)
- thinkingStyle and communicationStyle must each reference at least one metric or top pattern from Signals (e.g. constraintRate, revisionRate, topConstraintPatterns).
- Do NOT put message IDs like [U1, U2] inside the bullet text. Evidence goes ONLY in evidenceMsgIds.
- Every bullet MUST contain at least ONE concrete anchor. Acceptable anchors:
  (A) A metric reference (a number or percent) that matches the provided Signals JSON.
  (B) A named behavioral pattern from this list: constraint-setting, revision-seeking, decision-seeking, planning-mode, emotional-processing.
  (C) A \"when X → you do Y\" behavior (conditional + observable).
  (D) For suggestedWorkflows: include a concrete prompt template (e.g., Template: \"...\"), not just advice.
- Forbid adjective-only bullets (e.g., \"You are clear\" / \"You are thoughtful\"). If you can't be specific, omit the bullet.

6) CONFIDENCE
- Think about how much evidence you really have.
- "High" requires a reasonably rich conversation with multiple turns and clear patterns.
- "Medium" is for somewhat informative but limited data.
- "Low" is for thin or ambiguous evidence.
- If in doubt, choose the lower confidence.

7) NO META TALK
- Do not mention anonymization, tokens, the model, or your own process.
- Do not reference this prompt or JSON.
- Do not add extra fields or commentary outside the JSON object.

8) AVOID OVER-USING TEMPLATES
- Do not default to journaling, checklists, "structured schedules", or "regular check-ins" in every conversation.
- Use journaling or reflective writing ONLY when the conversation clearly involves emotions, inner processing, or long-term habit change, and at most once in suggestedWorkflows.
- Use checklists, templates, or highly structured schedules ONLY when the user is dealing with complex planning, projects, or technical work, and at most once in suggestedWorkflows.
- Mention AI, tools, automation, or dashboards in at most ONE suggestedWorkflow bullet, and ONLY when it is clearly relevant to the topic (e.g., data analysis, market research, or content generation).
- Avoid generic traits like "You are proactive", "You communicate clearly", "You are open to feedback", or "You seek reassurance" unless they are unusually obvious in THIS conversation.
- Prefer more distinctive traits when appropriate, such as creativity, humor, empathy, curiosity, persistence, practicality, willingness to experiment, comfort with ambiguity, etc.

Respond ONLY with valid JSON matching the Profile type. Do not wrap it in markdown.
`.trim();

const buildInsufficientDataProfile = (): Profile => ({
  id: "",
  thinkingStyle: "There isn’t enough conversation here to reliably infer your thinking style.",
  communicationStyle:
    "From this small snippet alone, it’s hard to say much about how you usually communicate.",
  strengths: ["You’re curious enough to start experimenting with AI."],
  blindSpots: [
    "With only a very short message, it’s easy to misinterpret your usual behavior.",
    "Important patterns in how you think and communicate may be completely missing here.",
  ],
  suggestedWorkflows: [
    "Paste a longer conversation where you explain your thinking or ask for help on a real task.",
    "Include a few back-and-forth turns so we can see how you clarify, react, and adjust.",
    "Avoid sharing sensitive details, but don’t be afraid to include real problems or decisions.",
  ],
  confidence: "low",
});

const overrideConfidence = (
  profile: Profile,
  inputCharCount: number,
  userMessageCount: number,
): Profile => {
  const result: Profile = { ...profile };

  // Very little signal: tiny snippet or only 1–2 user messages
  if (inputCharCount < 250 || userMessageCount <= 2) {
    result.confidence = "low";
    return result;
  }

  // Rich signal: decent length OR plenty of user turns
  if (inputCharCount >= 700 || userMessageCount >= 6) {
    result.confidence = "high";
    return result;
  }

  // Everything in the middle
  result.confidence = "medium";
  return result;
};

export async function analyzeConversation(input: AnalyzeInput): Promise<AnalyzeResult> {
  if (input.inputCharCount < MIN_CHARS_FOR_PROFILE) {
    const insufficient = buildInsufficientDataProfile();
    const profile: Profile = {
      ...insufficient,
      id: "",
      sourceMode: input.sourceMode,
      inputCharCount: input.inputCharCount,
    };
    const adjusted = overrideConfidence(profile, input.inputCharCount, input.userMessageCount);
    return {
      profile: adjusted,
      modelUsed: "none",
      promptVersion: PROMPT_VERSION_INSUFFICIENT,
    };
  }

  const model = input.modelOverride || config.openAiModel || "gpt-4.1-mini";

  type Turn = { id: string; text: string };

  const scoreTurnForSignal = (text: string) => {
    const t = text.toLowerCase();
    let score = 0;

    const hasConstraint =
      /\btone\b/.test(t) ||
      /\bshorter\b/.test(t) ||
      /\brewrite\b/.test(t) ||
      /\bbullet\b/.test(t) ||
      /\bstructure\b/.test(t) ||
      /\bstep[- ]by[- ]step\b/.test(t) ||
      /\bv\d+\b/.test(t) ||
      /\bword\b/.test(t);
    if (hasConstraint) score += 3;

    const hasDecision =
      /\bshould i\b/.test(t) ||
      /\bchoose\b/.test(t) ||
      /\bwhich one\b/.test(t) ||
      /\btrade-?off\b/.test(t) ||
      /\bpros and cons\b/.test(t);
    if (hasDecision) score += 3;

    const hasSelfDisclosure =
      /\bi feel\b/.test(t) ||
      /\bi keep\b/.test(t) ||
      /\bi struggle\b/.test(t) ||
      /\bi['’]m\b/.test(t) ||
      /\bi am\b/.test(t) ||
      /\bi['’]m worried\b/.test(t) ||
      /\bi am worried\b/.test(t);
    if (hasSelfDisclosure) score += 2;

    score += Math.floor(text.length / 200);

    if (/\d/.test(text)) score += 2;

    return score;
  };

  const selectRepresentativeTurns = (
    turnsAll: Turn[],
    options?: { maxTurns?: number; maxChars?: number },
  ) => {
    type SampleReason = "all" | "representative";
    const maxTurns = options?.maxTurns ?? 80;
    const earlyCount = 20;
    const lateCount = 20;
    const signalCount = Math.max(0, maxTurns - earlyCount - lateCount);

    if (turnsAll.length <= maxTurns) {
      const result: { turns: Turn[]; sampleReason: SampleReason; sampledTurnCountTarget: number } = {
        turns: turnsAll,
        sampleReason: "all",
        sampledTurnCountTarget: turnsAll.length,
      };
      return result;
    }

    const early = turnsAll.slice(0, earlyCount);
    const late = turnsAll.slice(Math.max(0, turnsAll.length - lateCount));

    const picked = new Map<string, Turn>();
    early.forEach((t) => picked.set(t.id, t));
    late.forEach((t) => picked.set(t.id, t));

    const scored: Array<{ idx: number; turn: Turn; score: number }> = [];
    turnsAll.forEach((turn, idx) => {
      if (picked.has(turn.id)) return;
      scored.push({ idx, turn, score: scoreTurnForSignal(turn.text) });
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.turn.text.length !== a.turn.text.length) return b.turn.text.length - a.turn.text.length;
      return a.idx - b.idx;
    });

    for (const item of scored.slice(0, signalCount)) {
      picked.set(item.turn.id, item.turn);
    }

    const ordered = turnsAll.filter((t) => picked.has(t.id));
    const result: { turns: Turn[]; sampleReason: SampleReason; sampledTurnCountTarget: number } = {
      turns: ordered,
      sampleReason: "representative",
      sampledTurnCountTarget: ordered.length,
    };
    return result;
  };

  const normalizeTurnWhitespace = (text: string) =>
    text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]*\n[ \t]*/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const extractUserTurns = (transcript: string): Turn[] => {
    const lines = transcript.replace(/\r\n/g, "\n").split("\n");
    const turns: Array<{ role: "user" | "assistant"; text: string }> = [];

    let currentRole: "user" | "assistant" | null = null;
    let buffer: string[] = [];

    const flush = () => {
      if (!currentRole) return;
      const text = buffer.join("\n").trim();
      buffer = [];
      if (!text) return;
      turns.push({ role: currentRole, text });
    };

    const startsUser = (line: string) => /^\s*(user|human)\s*:/i.test(line);
    const startsAssistant = (line: string) => /^\s*(assistant|ai|chatgpt|claude|gemini)\s*:/i.test(line);
    const stripPrefix = (line: string) => line.replace(/^\s*[^:]{2,20}:\s*/i, "");

    for (const line of lines) {
      if (startsUser(line)) {
        flush();
        currentRole = "user";
        buffer.push(stripPrefix(line));
        continue;
      }
      if (startsAssistant(line)) {
        flush();
        currentRole = "assistant";
        buffer.push(stripPrefix(line));
        continue;
      }
      if (!currentRole) currentRole = "user";
      buffer.push(line);
    }
    flush();

    const userTurns = turns.filter((t) => t.role === "user").map((t, idx) => ({
      id: `U${idx + 1}`,
      text: normalizeTurnWhitespace(t.text),
    }));

    if (userTurns.length > 0) return userTurns;

    const fallback = normalizeTurnWhitespace(transcript);
    return fallback.length ? [{ id: "U1", text: fallback }] : [];
  };

  const userTurnsAll = extractUserTurns(input.normalizedText);
  const selected = selectRepresentativeTurns(userTurnsAll, { maxTurns: 80, maxChars: 12000 });
  const userTurns = selected.turns;
  const derivedUserMessageCount = userTurnsAll.length > 0 ? userTurnsAll.length : input.userMessageCount;

  const userTurnBlockResult = (() => {
    const maxChars = 12000;
    const parts: string[] = [];
    const includedTurnIds: string[] = [];
    let used = 0;
    for (const t of userTurns) {
      const maxTurnChars = 800;
      const trimmed =
        t.text.length > maxTurnChars ? t.text.slice(0, maxTurnChars - 1).trimEnd() + "…" : t.text;
      const block = `${t.id}:\n${trimmed}`;
      if (used + block.length + 2 > maxChars) continue;
      parts.push(block);
      includedTurnIds.push(t.id);
      used += block.length + 2;
    }
    return { block: parts.join("\n\n"), includedTurnIds };
  })();
  const userTurnBlock = userTurnBlockResult.block;
  const includedTurnIds = userTurnBlockResult.includedTurnIds;

  const computeSignals = (turns: Turn[]) => {
    const totalUserTurns = turns.length;
    const lengths = turns.map((t) => t.text.length);
    const avgTurnLength =
      totalUserTurns > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / totalUserTurns) : 0;

    const countTurnsMatching = (pattern: RegExp) =>
      turns.reduce((acc, t) => (pattern.test(t.text) ? acc + 1 : acc), 0);

    const constraintTurns = countTurnsMatching(
      /\b(tone|shorter|rewrite|bullet|structure|step[- ]by[- ]step|v\d+|word)\b/i,
    );
    const revisionTurns = countTurnsMatching(/\b(v\d+|rewrite|revise|edit|shorter|clearer|v2)\b/i);
    const decisionTurns = countTurnsMatching(/\b(should i|choose|which one|trade-?off|pros and cons)\b/i);
    const planningTurns = countTurnsMatching(/\b(plan|planning|timeline|schedule|roadmap|itinerary|checklist|steps?)\b/i);
    const emotionalTurns = countTurnsMatching(
      /\b(i feel|i keep|i struggle|i['’]m|i am|worried|anxious|stressed|overwhelmed|frustrated)\b/i,
    );

    const rate = (hits: number) => (totalUserTurns > 0 ? Number((hits / totalUserTurns).toFixed(3)) : 0);

    const constraintPatternCounts: Array<{ key: string; label: string; count: number }> = [
      { key: "word_count", label: "word count", count: countTurnsMatching(/\b(\d+\s*words?|word count)\b/i) },
      { key: "tone", label: "tone calibration", count: countTurnsMatching(/\btone\b/i) },
      { key: "shorter_clearer", label: "shorter/clearer", count: countTurnsMatching(/\b(shorter|clearer)\b/i) },
      { key: "step_by_step", label: "step-by-step", count: countTurnsMatching(/\bstep[- ]by[- ]step\b/i) },
      { key: "structure", label: "structure/bullets", count: countTurnsMatching(/\b(structure|bullet)\b/i) },
      { key: "versions", label: "versions (v2+)", count: countTurnsMatching(/\bv\d+\b/i) },
    ];
    const topConstraintPatterns = constraintPatternCounts
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((p) => p.label);

    type DomainKey =
      | "coding_technical"
      | "career_writing"
      | "planning"
      | "learning"
      | "creative"
      | "relationships"
      | "money"
      | "health_fitness"
      | "travel"
      | "other";

    const DOMAIN_RULES: Array<{ key: DomainKey; label: string; regex: RegExp }> = [
      { key: "coding_technical", label: "coding/technical", regex: /\b(code|bug|error|api|function|script|deploy|prisma|next\.js|react|typescript|sql|db)\b/i },
      { key: "career_writing", label: "career writing", regex: /\b(resume|cv|cover letter|hiring manager|recruiter|outreach|linkedin|interview|job)\b/i },
      { key: "planning", label: "planning", regex: /\b(plan|timeline|schedule|roadmap|milestone|checklist|itinerary)\b/i },
      { key: "learning", label: "learning", regex: /\b(explain|learn|study|understand|tutorial|lesson)\b/i },
      { key: "creative", label: "creative", regex: /\b(story|poem|novel|lyrics|character|plot)\b/i },
      { key: "relationships", label: "relationships", regex: /\b(relationship|dating|partner|breakup|friend|family)\b/i },
      { key: "money", label: "money", regex: /\b(budget|salary|rent|mortgage|tax|invest|credit)\b/i },
      { key: "health_fitness", label: "health/fitness", regex: /\b(workout|gym|diet|health|sleep|run|fitness)\b/i },
      { key: "travel", label: "travel", regex: /\b(flight|hotel|visa|trip|travel|itinerary|airport)\b/i },
    ];

    const domainCounts = new Map<DomainKey, number>();
    for (const t of turns) {
      const text = t.text;
      const matched = DOMAIN_RULES.find((rule) => rule.regex.test(text));
      const key: DomainKey = matched?.key ?? "other";
      domainCounts.set(key, (domainCounts.get(key) ?? 0) + 1);
    }
    const topDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => DOMAIN_RULES.find((r) => r.key === k)?.label ?? "other");

    return {
      totalUserTurns,
      sampledTurns: includedTurnIds.length,
      sampledTurnsTarget: selected.sampledTurnCountTarget,
      sampling: selected.sampleReason,
      avgTurnLength,
      constraintRate: rate(constraintTurns),
      revisionRate: rate(revisionTurns),
      decisionRate: rate(decisionTurns),
      planningRate: rate(planningTurns),
      emotionalLanguageRate: rate(emotionalTurns),
      topConstraintPatterns,
      topDomains,
    };
  };

  const signals = computeSignals(userTurnsAll);

  const userContent = `
Approximate input length (characters): ${input.inputCharCount}
Approximate user messages: ${derivedUserMessageCount}

Signals (computed from ALL user turns):
${JSON.stringify(signals, null, 2)}

Here are the user's messages only (each turn is separate):

${userTurnBlock}
  `.trim();

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  const parsed = JSON.parse(content) as Partial<Profile>;

  const stripInlineMsgIdCitations = (value: string) =>
    value
      .replace(/\[\s*(?:U\d+\s*(?:,\s*U\d+\s*)*)\]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  const isMsgId = (value: string) => /^U\d+$/.test(value);

  const normalizeMsgIdList = (ids: unknown) => {
    if (!Array.isArray(ids)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of ids) {
      const id = typeof raw === "string" ? raw.trim() : "";
      if (!id || !isMsgId(id) || seen.has(id)) continue;
      if (!userTurnsAll.find((t) => t.id === id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= 3) break;
    }
    return out;
  };

  const hasConcreteAnchor = (text: string, kind: "bullet" | "workflow") => {
    const lower = text.toLowerCase();
    if (/\d/.test(text)) return true;
    if (/\b(constraint-setting|revision-seeking|decision-seeking|planning-mode|emotional-processing)\b/i.test(text)) {
      return true;
    }
    if (/\b(tone|shorter|rewrite|bullet|structure|step[- ]by[- ]step|v\d+|word)\b/i.test(text)) return true;
    if (/\b(should i|choose|which one|trade-?off|pros and cons)\b/i.test(lower)) return true;
    if (/\b(i feel|i keep|i struggle|worried|anxious|stressed|overwhelmed|frustrated)\b/i.test(lower)) return true;
    if ((/\bwhen\b/.test(lower) || /\bif\b/.test(lower)) && (text.includes("→") || /\bthen\b/.test(lower))) {
      return true;
    }
    if (kind === "workflow") {
      if (/\btemplate\s*:/i.test(text)) return true;
      if (/"[^"]{8,}"/.test(text)) return true;
    }
    return false;
  };

  const normalizeBullets = (items: unknown, ids: unknown, kind: "bullet" | "workflow") => {
    const itemList = Array.isArray(items) ? items.map((v) => stripInlineMsgIdCitations(String(v))).filter(Boolean) : [];
    const idLists = Array.isArray(ids) ? ids : [];
    const outItems: string[] = [];
    const outIds: string[][] = [];

    for (let idx = 0; idx < itemList.length; idx++) {
      const item = itemList[idx];
      const msgIds = normalizeMsgIdList((idLists as unknown[])[idx]);
      if (msgIds.length === 0) continue;
      if (!hasConcreteAnchor(item, kind)) continue;
      outItems.push(item);
      outIds.push(msgIds);
    }

    return { items: outItems, ids: outIds };
  };

  const strengthsNormalized = normalizeBullets(parsed.strengths, parsed.evidenceMsgIds?.strengths, "bullet");
  const blindSpotsNormalized = normalizeBullets(parsed.blindSpots, parsed.evidenceMsgIds?.blindSpots, "bullet");
  const workflowsNormalized = normalizeBullets(
    parsed.suggestedWorkflows,
    parsed.evidenceMsgIds?.suggestedWorkflows,
    "workflow",
  );

  let profile: Profile = {
    id: "",
    thinkingStyle: stripInlineMsgIdCitations(parsed.thinkingStyle || ""),
    communicationStyle: stripInlineMsgIdCitations(parsed.communicationStyle || ""),
    strengths: strengthsNormalized.items,
    blindSpots: blindSpotsNormalized.items,
    suggestedWorkflows: workflowsNormalized.items,
    evidenceMsgIds: {
      strengths: strengthsNormalized.ids,
      blindSpots: blindSpotsNormalized.ids,
      suggestedWorkflows: workflowsNormalized.ids,
    },
    confidence: parsed.confidence ?? "low",
    sourceMode: input.sourceMode,
    inputCharCount: input.inputCharCount,
  };

  profile.signals = signals;

  profile = overrideConfidence(profile, input.inputCharCount, derivedUserMessageCount);

  const STOPWORDS = new Set([
    "the",
    "and",
    "that",
    "this",
    "with",
    "from",
    "your",
    "you",
    "for",
    "are",
    "was",
    "were",
    "have",
    "has",
    "had",
    "but",
    "not",
    "just",
    "like",
    "into",
    "about",
    "when",
    "then",
    "than",
    "what",
    "how",
    "why",
    "can",
    "could",
    "should",
    "would",
    "want",
    "need",
    "make",
    "made",
    "use",
    "using",
    "used",
    "help",
    "please",
  ]);

  const tokenize = (text: string) =>
    text
      .toLowerCase()
      .split(/[^a-z0-9']+/g)
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => t.length >= 3)
      .filter((t) => !STOPWORDS.has(t))
      .filter((t) => !/^\d+$/.test(t));

  const excerpt = (text: string, maxChars = 160) => {
    const cleaned = normalizeTurnWhitespace(text);
    if (cleaned.length <= maxChars) return cleaned;
    return cleaned.slice(0, maxChars - 1).trimEnd() + "…";
  };

  const buildReceiptsFromMsgIds = (ids: string[] | null | undefined) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    const seen = new Set<string>();
    const receipts: Array<{ msgId: string; excerpt: string }> = [];
    for (const raw of ids) {
      const id = typeof raw === "string" ? raw.trim() : "";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const turn = userTurnsAll.find((t) => t.id === id);
      if (!turn) continue;
      receipts.push({ msgId: id, excerpt: excerpt(turn.text) });
      if (receipts.length >= 3) break;
    }
    return receipts;
  };

  const evidenceForList = (items: string[], msgIdLists?: string[][]) => {
    return items.map((item, idx) => {
      const modelReceipts = buildReceiptsFromMsgIds(msgIdLists?.[idx]);
      const itemTokens = new Set(tokenize(item));
      const scored = userTurnsAll
        .map((turn) => {
          const turnTokens = tokenize(turn.text);
          let overlap = 0;
          for (const tok of turnTokens) {
            if (itemTokens.has(tok)) overlap += 1;
          }
          return { turn, overlap };
        })
        .sort((a, b) => b.overlap - a.overlap);

      const strong = scored.filter((s) => s.overlap >= 2);
      const weak = scored.filter((s) => s.overlap >= 1);
      const picked = (strong.length > 0 ? strong : weak).slice(0, 2);
      const overlapReceipts =
        picked.length > 0 ? picked.map((p) => ({ msgId: p.turn.id, excerpt: excerpt(p.turn.text) })) : [];

      const receipts = modelReceipts.length > 0 ? modelReceipts : overlapReceipts;

      return {
        item,
        relatedMessageCount: weak.length,
        receipts,
      };
    });
  };

  profile.evidence = {
    strengths: evidenceForList(profile.strengths, profile.evidenceMsgIds?.strengths),
    blindSpots: evidenceForList(profile.blindSpots, profile.evidenceMsgIds?.blindSpots),
    suggestedWorkflows: evidenceForList(profile.suggestedWorkflows, profile.evidenceMsgIds?.suggestedWorkflows),
  };

  return {
    profile,
    modelUsed: model,
    promptVersion: PROMPT_VERSION,
    promptTokens: completion.usage?.prompt_tokens ?? undefined,
    completionTokens: completion.usage?.completion_tokens ?? undefined,
  };
}
