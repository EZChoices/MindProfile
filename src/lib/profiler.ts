import { OpenAI } from "openai";
import { anonymizeText } from "./anonymize";
import { config } from "./config";
import type { IngestionType, ProfileSummary } from "./types";

const splitSentences = (text: string) =>
  text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const topicSignals = [
  { key: "builder", keywords: ["code", "api", "function", "script", "deploy"] },
  { key: "writer", keywords: ["write", "blog", "article", "tone", "voice"] },
  { key: "analyst", keywords: ["data", "metric", "research", "insight", "analyze"] },
  { key: "manager", keywords: ["project", "timeline", "roadmap", "stakeholder", "team"] },
  { key: "student", keywords: ["learn", "study", "explain", "understand", "why"] },
];

const pickCommunicationStyle = (text: string) => {
  const questions = (text.match(/\?/g) || []).length;
  const pleaseCount = (text.match(/\bplease\b/gi) || []).length;
  const thanksCount = (text.match(/\bthanks|thank you\b/gi) || []).length;

  if (questions > 6) return "Highly inquisitive, probes for nuance and alternatives.";
  if (pleaseCount + thanksCount > 2) return "Polite, collaborative tone with clear asks.";
  if (text.length > 1500)
    return "Long-form, provides context up front and expects structured replies.";
  return "Direct and succinct; prefers quick iterations over long briefs.";
};

const pickThinkingStyle = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = splitSentences(text);
  const avgSentence =
    sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) /
    Math.max(1, sentences.length);
  const bulletLike = (text.match(/^-|\n-/gm) || []).length;

  if (avgSentence > 24 || bulletLike > 3) {
    return "Systems-first thinker who breaks work into steps and dependencies.";
  }
  if (words < 180) {
    return "Fast, exploratory thinker who skims ideas and iterates aloud.";
  }
  if (text.match(/\bbrainstorm|idea|concept|creative\b/i)) {
    return "Divergent thinker, comfortable ideating and riffing.";
  }
  return "Pragmatic problem-solver with a bias toward action.";
};

const buildStrengths = (signals: Set<string>, text: string) => {
  const strengths = new Set<string>();

  if (signals.has("builder"))
    strengths.add("Translates ambiguous asks into concrete steps and code.");
  if (signals.has("writer"))
    strengths.add("Tunes tone and voice; cares about phrasing and clarity.");
  if (signals.has("analyst"))
    strengths.add("Looks for evidence and structure before deciding.");
  if (signals.has("manager"))
    strengths.add("Thinks in milestones and outcomes, not just tasks.");
  if (signals.has("student"))
    strengths.add("Learns quickly by asking why and requesting examples.");

  const followUps = (text.match(/\bcan we|what about|could you\b/gi) || []).length;
  if (followUps > 2) strengths.add("Asks for alternatives and edge cases.");

  if (strengths.size < 3) {
    strengths.add("Comfortable delegating detail to the AI to save time.");
    strengths.add("Shares enough context to keep responses relevant.");
  }

  return Array.from(strengths).slice(0, 5);
};

const buildBlindSpots = (signals: Set<string>, text: string) => {
  const blindSpots = new Set<string>();
  const words = text.split(/\s+/).filter(Boolean).length;
  const questions = (text.match(/\?/g) || []).length;

  if (words < 120) blindSpots.add("Thin sample size; profile may miss edge behaviors.");
  if (questions < 2) blindSpots.add("Few clarifying questions; risks accepting assumptions.");
  if (!signals.has("analyst"))
    blindSpots.add("Could add metrics or success criteria to tighten outputs.");
  if (!signals.has("manager"))
    blindSpots.add("Sometimes jumps to solutions without mapping constraints.");

  return Array.from(blindSpots).slice(0, 5);
};

const buildUsagePatterns = (signals: Set<string>, text: string) => {
  const patterns = new Set<string>();
  const snippets = (text.match(/```/g) || []).length;

  if (snippets > 0 || signals.has("builder"))
    patterns.add("Leans on AI as a coding co-pilot for drafts and fixes.");
  if (signals.has("writer")) patterns.add("Uses AI to reshape tone, intros, and outlines.");
  if (signals.has("analyst"))
    patterns.add("Checks reasoning and requests structured breakdowns.");
  if (patterns.size < 2) {
    patterns.add("Prefers quick iterations rather than monolithic replies.");
  }
  return Array.from(patterns).slice(0, 4);
};

const buildRecommendations = (signals: Set<string>) => {
  const recs = new Set<string>([
    "Start prompts with goal, constraints, and who the output is for.",
    "Ask the model to surface assumptions before executing a plan.",
    "Request a quick outline first, then dive deep on the best branch.",
  ]);

  if (signals.has("builder"))
    recs.add("Use 'before/after' code snippets so the model diff-checks changes.");
  if (signals.has("writer"))
    recs.add("Share audience and tone sliders (e.g., '40% crisp, 60% warm').");
  if (signals.has("analyst"))
    recs.add("Have the model provide confidence with rationale for each claim.");

  return Array.from(recs).slice(0, 5);
};

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const buildFallbackProfile = (
  sanitized: string,
  ingestionType: IngestionType,
): ProfileSummary => {
  const lowered = sanitized.toLowerCase();
  const signals = new Set<string>();

  for (const topic of topicSignals) {
    if (topic.keywords.some((kw) => lowered.includes(kw))) {
      signals.add(topic.key);
    }
  }

  const words = sanitized.split(/\s+/).filter(Boolean).length;
  const signalScore = signals.size / 5;
  const confidence = clamp(
    0.45 + Math.min(words / 1500, 0.4) + signalScore * 0.15,
    0.55,
    0.96,
  );

  return {
    headline:
      ingestionType === "link"
        ? "Single-session snapshot based on the shared conversation."
        : "Behavioral snapshot generated from the provided sample.",
    thinkingStyle: pickThinkingStyle(sanitized),
    communicationStyle: pickCommunicationStyle(sanitized),
    strengths: buildStrengths(signals, sanitized),
    blindSpots: buildBlindSpots(signals, sanitized),
    usagePatterns: buildUsagePatterns(signals, sanitized),
    recommendations: buildRecommendations(signals),
    confidence: Number(confidence.toFixed(2)),
  };
};

const buildPrompt = (sanitized: string, ingestionType: IngestionType) => `
You are MindProfile, a behavioral analyst for AI conversations.
Input: An anonymized transcript between a human and an AI.
Goal: Describe the human's thinking and communication style, strengths, blind spots, usage patterns, and 3-5 recommended workflows.
Return JSON with keys: headline, thinkingStyle, communicationStyle, strengths (array), blindSpots (array), usagePatterns (array), recommendations (array), confidence (0-1).
Context level: ${ingestionType}.
Transcript:
${sanitized}
`;

export const generateProfileSummary = async (
  rawText: string,
  ingestionType: IngestionType,
): Promise<{ sanitizedText: string; summary: ProfileSummary }> => {
  const { sanitized } = anonymizeText(rawText);

  if (!client) {
    return { sanitizedText: sanitized, summary: buildFallbackProfile(sanitized, ingestionType) };
  }

  try {
    const response = await client.chat.completions.create({
      model: config.openAiModel,
      messages: [
        {
          role: "user",
          content: buildPrompt(sanitized, ingestionType),
        },
      ],
      max_tokens: 700,
      temperature: 0.5,
    });

    const text = response.choices[0]?.message?.content?.trim();
    const parsed = text ? (JSON.parse(text) as Partial<ProfileSummary>) : {};
    const fallback = buildFallbackProfile(sanitized, ingestionType);

    const summary: ProfileSummary = {
      headline:
        parsed.headline ||
        (ingestionType === "link"
          ? "Single-session snapshot based on the shared conversation."
          : "Behavioral snapshot generated from the provided sample."),
      thinkingStyle: parsed.thinkingStyle || fallback.thinkingStyle,
      communicationStyle: parsed.communicationStyle || fallback.communicationStyle,
      strengths: parsed.strengths?.length ? parsed.strengths : fallback.strengths,
      blindSpots: parsed.blindSpots?.length ? parsed.blindSpots : fallback.blindSpots,
      usagePatterns: parsed.usagePatterns?.length ? parsed.usagePatterns : fallback.usagePatterns,
      recommendations:
        parsed.recommendations?.length ? parsed.recommendations : fallback.recommendations,
      confidence: Number(parsed.confidence || fallback.confidence || 0.82),
    };

    return { sanitizedText: sanitized, summary };
  } catch (error) {
    console.error("LLM profiling failed, using fallback", error);
    return { sanitizedText: sanitized, summary: buildFallbackProfile(sanitized, ingestionType) };
  }
};
