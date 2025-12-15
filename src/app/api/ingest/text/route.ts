import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeConversation } from "@/lib/analyzeConversation";
import { normalizeTextInput } from "@/lib/normalizeInput";
import { inferMindCard } from "@/lib/inferMindCard";
import { logAnalysisError } from "@/lib/logAnalysisError";
import type { Profile } from "@/types/profile";
import type { MindCard } from "@/types/mindCard";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text as string | undefined;
    const clientId =
      typeof body?.clientId === "string" && body.clientId.trim().length > 0 ? body.clientId.trim() : null;

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least a few sentences of text." },
        { status: 400 },
      );
    }

    const normalizedForAnalysis = normalizeTextInput(text.trim(), { redactNames: false });
    const normalizedForStorage = normalizeTextInput(text.trim(), { redactNames: true });
    const analysis = await analyzeConversation({
      normalizedText: normalizedForAnalysis.normalizedText,
      inputCharCount: normalizedForAnalysis.inputCharCount,
      userMessageCount: normalizedForAnalysis.userMessageCount,
      sourceMode: "text",
    });

    const sampleText =
      normalizedForStorage.normalizedText.length > 1200
        ? normalizedForStorage.normalizedText.slice(0, 1200)
        : normalizedForStorage.normalizedText;

    const shouldGenerateMindCard =
      analysis.profile.confidence !== "low" &&
      normalizedForAnalysis.userMessageCount >= 6 &&
      normalizedForAnalysis.inputCharCount >= 500;

    const mindCard: MindCard | null = shouldGenerateMindCard
      ? await inferMindCard({
          profile: {
            ...analysis.profile,
            id: "",
          },
          sampleText,
        })
      : null;

    const dbProfile = await prisma.profile.create({
      data: {
        clientId,
        sourceMode: normalizedForStorage.sourceMode,
        confidence: analysis.profile.confidence,
        thinkingStyle: analysis.profile.thinkingStyle,
        communicationStyle: analysis.profile.communicationStyle,
        strengthsJson: analysis.profile.strengths,
        blindSpotsJson: analysis.profile.blindSpots,
        suggestedJson: analysis.profile.suggestedWorkflows,
        rawText: normalizedForStorage.normalizedText,
        model: analysis.modelUsed,
        promptVersion: analysis.promptVersion,
        inputCharCount: normalizedForAnalysis.inputCharCount,
        inputSourceHost: normalizedForStorage.inputSourceHost,
        promptTokens: analysis.promptTokens,
        completionTokens: analysis.completionTokens,
        mindCard: mindCard as unknown as Prisma.InputJsonValue,
      },
    });

    let submissionCount = 1;
    if (clientId) {
      submissionCount = await prisma.profile.count({ where: { clientId } });
    }
    const tier: "first_impression" | "building_profile" | "full_profile" =
      submissionCount <= 1 ? "first_impression" : submissionCount < 5 ? "building_profile" : "full_profile";

    const responseProfile: Profile = {
      ...analysis.profile,
      id: dbProfile.id,
      sourceMode: normalizedForStorage.sourceMode,
      inputCharCount: normalizedForAnalysis.inputCharCount,
      model: analysis.modelUsed,
      promptVersion: analysis.promptVersion,
    };

    return NextResponse.json({
      profileId: dbProfile.id,
      profile: responseProfile,
      mindCard,
      submissionCount,
      tier,
    });
  } catch (error) {
    console.error("Text ingest failed", error);
    await logAnalysisError({
      clientId: undefined,
      sourceMode: "text",
      errorCode: "analysis_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      meta: { stack: error instanceof Error ? error.stack : String(error) },
    });
    return NextResponse.json(
      { error: "Unable to process the pasted text." },
      { status: 500 },
    );
  }
}
