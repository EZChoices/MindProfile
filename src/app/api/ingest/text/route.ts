import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProfileSummary } from "@/lib/profiler";

const toConfidenceLabel = (value: number) => {
  if (value >= 0.66) return "high" as const;
  if (value < 0.33) return "low" as const;
  return "medium" as const;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text as string | undefined;

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least a few sentences of text." },
        { status: 400 },
      );
    }

    const trimmed = text.trim();
    const { sanitizedText, summary } = await generateProfileSummary(trimmed, "text");

    const confidence = toConfidenceLabel(summary.confidence);

    const dbProfile = await prisma.profile.create({
      data: {
        sourceMode: "text",
        confidence,
        thinkingStyle: summary.thinkingStyle,
        communicationStyle: summary.communicationStyle,
        strengthsJson: JSON.stringify(summary.strengths ?? []),
        blindSpotsJson: JSON.stringify(summary.blindSpots ?? []),
        suggestedJson: JSON.stringify(summary.recommendations ?? []),
        rawText: sanitizedText,
      },
    });

    const responseProfile = {
      id: dbProfile.id,
      thinkingStyle: summary.thinkingStyle,
      communicationStyle: summary.communicationStyle,
      strengths: summary.strengths ?? [],
      blindSpots: summary.blindSpots ?? [],
      suggestedWorkflows: summary.recommendations ?? [],
      confidence,
    };

    return NextResponse.json({ profileId: dbProfile.id, profile: responseProfile });
  } catch (error) {
    console.error("Text ingest failed", error);
    return NextResponse.json(
      { error: "Unable to process the pasted text." },
      { status: 500 },
    );
  }
}
