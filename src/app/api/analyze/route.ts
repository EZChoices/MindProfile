import { NextResponse } from "next/server";
import { load } from "cheerio";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import type { Profile } from "@/types/profile";

type IngestionType = "text" | "url";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedHosts = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "g.co",
  "ai.google.com",
];

const anonymizeText = (text: string): string => {
  let sanitized = text.replace(/\b\S+@\S+\.\S+\b/g, "[EMAIL]");
  sanitized = sanitized.replace(/https?:\/\/\S+/g, "[URL]");
  sanitized = sanitized.replace(/\d{7,}/g, "[PHONE]");
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  sanitized = sanitized.replace(/\s{2,}/g, " ");
  return sanitized.trim();
};

const normalizeConfidence = (value: string | undefined): Profile["confidence"] => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
};

const extractTextFromHtml = (html: string): string => {
  const $ = load(html);
  $("script, style").remove();
  const mainText = $("main").text();
  const bodyText = $("body").text();
  const text = (mainText || bodyText || "").replace(/\s+/g, " ").trim();
  return text;
};

const isAllowedUrl = (url: URL) => {
  const protocolOk = url.protocol === "http:" || url.protocol === "https:";
  return protocolOk && allowedHosts.some((host) => url.hostname.toLowerCase().endsWith(host));
};

const generateProfile = async (anonymizedText: string): Promise<Profile> => {
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

  return {
    id: parsed.id || crypto.randomUUID(),
    thinkingStyle: parsed.thinkingStyle || "",
    communicationStyle: parsed.communicationStyle || "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
    suggestedWorkflows: Array.isArray(parsed.suggestedWorkflows) ? parsed.suggestedWorkflows : [],
    confidence: normalizeConfidence(parsed.confidence),
  };
};

const persistProfile = async (input: {
  ingestionType: IngestionType;
  sourceMeta: string;
  anonymizedText: string;
  profile: Profile;
}) => {
  // If persistence fails (or DB not configured), fall back to returning a non-shareable profile.
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL missing; returning non-persisted profile");
    const profileId = crypto.randomUUID();
    return { profileWithId: { ...input.profile, id: profileId }, profileId: null as string | null };
  }

  try {
    const profileId = crypto.randomUUID();
    const profileWithId: Profile = { ...input.profile, id: profileId };

    await prisma.profileRecord.create({
      data: {
        id: profileId,
        ingestionType: input.ingestionType,
        sourceMeta: input.sourceMeta,
        anonymizedText: input.anonymizedText,
        profileJson: JSON.stringify(profileWithId),
      },
    });

    return { profileWithId, profileId };
  } catch (error) {
    console.error("Persisting profile failed; returning non-persisted profile", error);
    const profileId = crypto.randomUUID();
    return { profileWithId: { ...input.profile, id: profileId }, profileId: null as string | null };
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body?.mode as string | undefined;

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing");
      return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
    }

    if (mode === "text") {
      const rawText = typeof body?.text === "string" ? body.text : "";
      const text = rawText.trim();

      if (!text || text.length < 50) {
        return NextResponse.json(
          { error: "invalid_input", message: "Provide text mode with at least 50 characters." },
          { status: 400 },
        );
      }

      const anonymizedText = anonymizeText(text);
      const profile = await generateProfile(anonymizedText);
      const { profileWithId, profileId } = await persistProfile({
        ingestionType: "text",
        sourceMeta: "text",
        anonymizedText,
        profile,
      });
      return NextResponse.json({ profile: profileWithId, profileId });
    }

    if (mode === "url") {
      const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(rawUrl);
      } catch {
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      if (!rawUrl || !isAllowedUrl(parsedUrl)) {
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      let html: string;
      try {
        const res = await fetch(parsedUrl.toString());
        if (!res.ok) {
          return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
        }
        html = await res.text();
      } catch (error) {
        console.error("Failed to fetch shared URL", error);
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      const extracted = extractTextFromHtml(html);
      if (!extracted || extracted.length < 50) {
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      const anonymizedText = anonymizeText(extracted);
      const profile = await generateProfile(anonymizedText);
      const { profileWithId, profileId } = await persistProfile({
        ingestionType: "url",
        sourceMeta: parsedUrl.hostname,
        anonymizedText,
        profile,
      });
      return NextResponse.json({ profile: profileWithId, profileId });
    }

    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  } catch (error) {
    console.error("Analyze endpoint failed", error);
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
