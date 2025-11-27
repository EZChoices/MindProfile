import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeConversation } from "@/lib/analyzeConversation";
import { normalizeTextInput } from "@/lib/normalizeInput";
import { inferMindCard } from "@/lib/inferMindCard";
import type { Profile } from "@/types/profile";
import type { MindCard } from "@/types/mindCard";

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

    const sampleText =
      normalized.normalizedText.length > 1200
        ? normalized.normalizedText.slice(0, 1200)
        : normalized.normalizedText;

    const mindCard: MindCard = await inferMindCard({
      profile: {
        ...analysis.profile,
        id: "",
      },
      sampleText,
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
        mindCard: mindCard as unknown as Prisma.InputJsonValue,
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

    return NextResponse.json({ profileId: dbProfile.id, profile: responseProfile, mindCard });
  } catch (error) {
    console.error("Text ingest failed", error);
    return NextResponse.json(
      { error: "Unable to process the pasted text." },
      { status: 500 },
    );
  }
}
