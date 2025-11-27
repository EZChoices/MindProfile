import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeConversation } from "@/lib/analyzeConversation";
import { normalizeTextInput } from "@/lib/normalizeInput";
import type { Profile } from "@/types/profile";

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

    const normalized = normalizeTextInput(text.trim());
    const analysis = await analyzeConversation({
      normalizedText: normalized.normalizedText,
      inputCharCount: normalized.inputCharCount,
      userMessageCount: normalized.userMessageCount,
      sourceMode: "text",
    });

    const dbProfile = await prisma.profile.create({
      data: {
        sourceMode: normalized.sourceMode,
        confidence: analysis.profile.confidence,
        thinkingStyle: analysis.profile.thinkingStyle,
        communicationStyle: analysis.profile.communicationStyle,
        strengthsJson: analysis.profile.strengths,
        blindSpotsJson: analysis.profile.blindSpots,
        suggestedJson: analysis.profile.suggestedWorkflows,
        rawText: normalized.normalizedText,
        model: analysis.modelUsed,
        promptVersion: analysis.promptVersion,
        inputCharCount: normalized.inputCharCount,
        inputSourceHost: normalized.inputSourceHost,
        promptTokens: analysis.promptTokens,
        completionTokens: analysis.completionTokens,
      },
    });

    const responseProfile: Profile = {
      ...analysis.profile,
      id: dbProfile.id,
      sourceMode: normalized.sourceMode,
      inputCharCount: normalized.inputCharCount,
      model: analysis.modelUsed,
      promptVersion: analysis.promptVersion,
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
