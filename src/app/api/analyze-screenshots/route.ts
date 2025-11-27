import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeConversation } from "@/lib/analyzeConversation";
import { normalizeScreenshotInput } from "@/lib/normalizeInput";
import { ocrImage } from "@/lib/ocr";
import { inferMindCard } from "@/lib/inferMindCard";
import type { Profile } from "@/types/profile";
import type { MindCard } from "@/types/mindCard";

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

    const ocrTexts: string[] = [];
    for (const file of files) {
      const text = await ocrImage(file);
      ocrTexts.push(text);
    }

    const normalized = normalizeScreenshotInput(ocrTexts);
    if (!normalized.normalizedText || normalized.inputCharCount < 50) {
      return NextResponse.json(
        { error: "invalid_url_or_content", message: "Screenshots produced too little text." },
        { status: 400 },
      );
    }

    const analysis = await analyzeConversation({
      normalizedText: normalized.normalizedText,
      inputCharCount: normalized.inputCharCount,
      userMessageCount: normalized.userMessageCount,
      sourceMode: "screenshots",
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

    return NextResponse.json({ profile: responseProfile, profileId: dbProfile.id, mindCard });
  } catch (error) {
    console.error("Analyze screenshots endpoint failed", error);
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
