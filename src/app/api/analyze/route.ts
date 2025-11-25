import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { Profile } from "@/types/profile";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anonymizeText = (text: string): string => {
  let sanitized = text.replace(/\b\S+@\S+\.\S+\b/g, "[EMAIL]");
  sanitized = sanitized.replace(/https?:\/\/\S+/g, "[URL]");
  sanitized = sanitized.replace(/\d{7,}/g, "[PHONE]");
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  return sanitized.trim();
};

const normalizeConfidence = (value: string | undefined): Profile["confidence"] => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body?.mode as string | undefined;
    const rawText = typeof body?.text === "string" ? body.text : "";
    const text = rawText.trim();

    if (mode !== "text" || !text || text.length < 50) {
      return NextResponse.json(
        { error: "invalid_input", message: "Provide text mode with at least 50 characters." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing");
      return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
    }

    const anonymizedText = anonymizeText(text);

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a psychologist and productivity coach.
Given an anonymized conversation between a human and an AI assistant,
infer a short cognitive + communication profile of the human.

Respond ONLY with a JSON object matching this TypeScript type:

interface Profile {
  id: string;
  thinkingStyle: string;
  communicationStyle: string;
  strengths: string[];
  blindSpots: string[];
  suggestedWorkflows: string[];
  confidence: "low" | "medium" | "high";
}
          `.trim(),
        },
        {
          role: "user",
          content: `
Here is the anonymized conversation:

${anonymizedText}
          `.trim(),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response content from OpenAI");
    }

    const parsed = JSON.parse(content) as Partial<Profile>;

    const profile: Profile = {
      id: parsed.id || crypto.randomUUID(),
      thinkingStyle: parsed.thinkingStyle || "",
      communicationStyle: parsed.communicationStyle || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
      suggestedWorkflows: Array.isArray(parsed.suggestedWorkflows)
        ? parsed.suggestedWorkflows
        : [],
      confidence: normalizeConfidence(parsed.confidence),
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Analyze endpoint failed", error);
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
