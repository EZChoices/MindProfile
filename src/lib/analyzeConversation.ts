import OpenAI from "openai";
import { config } from "./config";
import type { Profile, SourceMode } from "@/types/profile";
import type { MindCard } from "@/types/mindCard";

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

const PROMPT_VERSION = "v0.4";
const PROMPT_VERSION_INSUFFICIENT = "v0.4-insufficient";
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

You must respond ONLY with a JSON object matching this TypeScript type:

interface Profile {
  id: string;
  thinkingStyle: string;          // 1–3 concise sentences, behavioral, no jargon, written as "You ..."
  communicationStyle: string;     // 1–3 concise sentences about how they talk / ask, written as "You ..."
  strengths: string[];            // 3–5 bullets, each 1 sentence, very concrete and specific
  blindSpots: string[];           // 3–5 bullets, each 1 sentence, gently critical but specific
  suggestedWorkflows: string[];   // 3–5 bullets, each 1 sentence, actionable ways to use AI and other tools better
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

  const userContent = `
Approximate input length (characters): ${input.inputCharCount}
Approximate user messages: ${input.userMessageCount}

Here is the anonymized conversation text (may include multiple chats):

${input.normalizedText}
  `.trim();

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.6,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  const parsed = JSON.parse(content) as Partial<Profile>;

  let profile: Profile = {
    id: "",
    thinkingStyle: parsed.thinkingStyle || "",
    communicationStyle: parsed.communicationStyle || "",
    strengths: parsed.strengths ?? [],
    blindSpots: parsed.blindSpots ?? [],
    suggestedWorkflows: parsed.suggestedWorkflows ?? [],
    confidence: parsed.confidence ?? "low",
    sourceMode: input.sourceMode,
    inputCharCount: input.inputCharCount,
  };

  profile = overrideConfidence(profile, input.inputCharCount, input.userMessageCount);

  return {
    profile,
    modelUsed: model,
    promptVersion: PROMPT_VERSION,
    promptTokens: completion.usage?.prompt_tokens ?? undefined,
    completionTokens: completion.usage?.completion_tokens ?? undefined,
  };
}
