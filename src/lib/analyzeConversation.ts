import OpenAI from "openai";
import { config } from "./config";
import type { Profile, SourceMode } from "@/types/profile";

export interface AnalyzeInput {
  normalizedText: string;
  inputCharCount: number;
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

const PROMPT_VERSION = "v0.2";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are a psychologist and productivity coach.

You will receive ANONYMIZED text from one or more conversations between a human and an AI assistant.
Your job is to infer how the human tends to THINK and COMMUNICATE based ONLY on their messages and requests.

Write your output in SECOND PERSON, as if you are talking directly to the user.
Use phrasing like "You tend to...", "You often...", "You prefer..." instead of "The human" or "The user".

You must respond ONLY with a JSON object matching this TypeScript type:

interface Profile {
  id: string;
  thinkingStyle: string;          // 1–2 concise sentences, behavioral, no jargon, written as "You ..."
  communicationStyle: string;     // 1–2 concise sentences about how they talk / ask, written as "You ..."
  strengths: string[];            // 3–5 bullets, each 1 sentence, very concrete, starting with "You..." where natural
  blindSpots: string[];           // 3–5 bullets, each 1 sentence, gently critical but specific
  suggestedWorkflows: string[];   // 3–5 bullets, each 1 sentence, actionable ways to use AI better
  confidence: "low" | "medium" | "high";
}

Guidelines:
- Be SPECIFIC and BEHAVIORAL, not vague.
- Avoid generic filler like "may be", "sometimes", "in general" unless necessary.
- Prefer concrete patterns like "You ask for X before doing Y" or "You jump straight to implementation."
- Do NOT summarize the topic of the conversation.
- Focus only on the human, not the AI.
- Do not mention anonymization or missing context.
- Do not add extra fields.
`.trim();

const confidenceFromLength = (inputCharCount: number): Profile["confidence"] => {
  if (inputCharCount < 400) return "low";
  if (inputCharCount < 1500) return "medium";
  return "high";
};

export async function analyzeConversation(input: AnalyzeInput): Promise<AnalyzeResult> {
  const model = input.modelOverride || config.openAiModel || "gpt-4.1-mini";

  const userContent = `
Approximate input length (characters): ${input.inputCharCount}

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
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  const parsed = JSON.parse(content) as Partial<Profile>;
  const heuristicConfidence = confidenceFromLength(input.inputCharCount);
  const profile: Profile = {
    id: parsed.id || "", // overwritten by caller with DB id
    thinkingStyle: parsed.thinkingStyle || "",
    communicationStyle: parsed.communicationStyle || "",
    strengths: parsed.strengths ?? [],
    blindSpots: parsed.blindSpots ?? [],
    suggestedWorkflows: parsed.suggestedWorkflows ?? [],
    confidence: parsed.confidence ?? heuristicConfidence,
    sourceMode: input.sourceMode,
    inputCharCount: input.inputCharCount,
    model,
    promptVersion: PROMPT_VERSION,
  };

  // Apply heuristic override regardless of model output
  profile.confidence = heuristicConfidence;

  return {
    profile,
    modelUsed: model,
    promptVersion: PROMPT_VERSION,
    promptTokens: completion.usage?.prompt_tokens ?? undefined,
    completionTokens: completion.usage?.completion_tokens ?? undefined,
  };
}
