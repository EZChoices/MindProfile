import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import type { Profile } from "@/types/profile";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const normalizeConfidence = (value: string | undefined): Profile["confidence"] => {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing");
      return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll("images").filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "no_images" }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "too_many_images" }, { status: 400 });
    }

    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: "Here are screenshots of the conversation. Focus on the human's behavior, not the AI's wording.",
      },
    ];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mime = file.type || "image/png";
      const dataUrl = `data:${mime};base64,${base64}`;
      content.push({ type: "image_url", image_url: { url: dataUrl } });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a psychologist and productivity coach.
You will receive 1–5 screenshots of a chat between a human and an AI assistant.
First, silently reconstruct the conversation (who said what).
Then infer a short cognitive + communication profile of the human only.
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
          content,
        },
      ],
    });

    const contentJson = response.choices[0]?.message?.content;
    if (!contentJson) {
      throw new Error("Empty response content from OpenAI (screenshots)");
    }

    const parsed = JSON.parse(contentJson) as Partial<Profile>;
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

    const profileId = crypto.randomUUID();
    const profileWithId: Profile = { ...profile, id: profileId };
    await prisma.profileRecord.create({
      data: {
        id: profileId,
        ingestionType: "screenshots",
        sourceMeta: "screenshots",
        anonymizedText: `Screenshots (${files.length}) provided for profiling.`,
        profileJson: JSON.stringify(profileWithId),
      },
    });

    return NextResponse.json({ profile: profileWithId, profileId });
  } catch (error) {
    console.error("Analyze screenshots endpoint failed", error);
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
