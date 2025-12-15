import OpenAI from "openai";
import type { Profile } from "@/types/profile";
import type { MindCard } from "@/types/mindCard";
import { config } from "./config";

const PROMPT_VERSION_MINDCARD = "v0.1-mindcard";

export interface MindCardInput {
  profile: Profile;
  sampleText: string;
}

export const inferMindCard = async (input: MindCardInput): Promise<MindCard> => {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `
You are a personality psychologist and careers coach.

You will receive:
- A structured behavioral profile of a user (how they think and communicate with an AI assistant).
- A short excerpt of their anonymized conversation text.

Your job is to infer a playful but grounded set of "test-like" impressions about them.
These impressions are NOT clinical or official diagnostics. They are AI-generated guesses for personal insight and reflection only.

You must respond ONLY with a JSON object matching this TypeScript type:

interface BrainScores {
  reasoning: number;           // 0-100
  curiosity: number;           // 0-100
  structure: number;           // 0-100
  emotionalAttunement: number; // 0-100
}

interface BigFiveScores {
  openness: number;         // 0-100
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface MBTIGuess {
  type: string; // e.g. "INTP", "ENFP", or "uncertain"
  confidence: "low" | "medium" | "high";
  blurb: string;
}

interface LoveLanguageGuess {
  primary: string;   // e.g. "Words of affirmation", "Acts of service"
  secondary?: string;
  blurb: string;
}

interface RoleArchetypes {
  primaryArchetype: string;    // e.g. "Reflective Strategist"
  alternativeArchetypes: string[];
  suggestedRoles: string[];    // e.g. ["Product strategist", "Coach", "Analyst"]
  blurb: string;
}

interface BrainIndex {
  overall: number;    // 0-100: how their thinking comes across to AI
  explanation: string;
}

interface MindCard {
  archetypeName: string;      // headline label, e.g. "Reflective Strategist"
  archetypeTagline: string;   // one-sentence hook
  brainScores: BrainScores;
  bigFive: BigFiveScores;
  mbti: MBTIGuess;
  loveLanguage: LoveLanguageGuess;
  roles: RoleArchetypes;
  brainIndex: BrainIndex;
}

GUIDELINES:

- This is for reflection and curiosity, NOT real IQ or clinical assessment.
- Make the archetypeName and archetypeTagline catchy but believable, based on the profile.
- BrainScores should roughly match the existing thinkingStyle and communicationStyle patterns.
- BigFiveScores should be approximate impressions based on how they phrase things and what they care about.
- MBTIGuess should pick a likely type OR "uncertain" if the conversation is too narrow.
- LoveLanguageGuess is a "vibe" based on how they relate to help, feedback, and connection. It is approximate.
- Roles should be broad "roles or domains they might thrive in", not specific job titles.
- BrainIndex overall is about how their thinking presents to AI: complexity, structure, tradeoff-awareness, nuance, etc.
- Avoid clinical language, diagnoses, or strong claims.
- Do NOT add disclaimers inside the fields; the UI will handle that. Just provide the JSON data itself.
- Do not repeat any personal names, emails, phone numbers, addresses, usernames, or unique identifiers from the text.

Respond ONLY with a JSON object that matches MindCard. Do not wrap it in markdown or add commentary.
  `.trim();

  const userContent = `
Here is the structured profile of this user, based on how they used an AI assistant:

${JSON.stringify(input.profile, null, 2)}

Here is a short excerpt of their anonymized conversation text:

${input.sampleText.slice(0, 2000)}

Use both the profile and the text snippet to infer a MindCard as described.
  `.trim();

  const completion = await client.chat.completions.create({
    model: config.openAiModel || "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.5,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty MindCard response from OpenAI");

  return JSON.parse(raw) as MindCard;
};

export { PROMPT_VERSION_MINDCARD };
