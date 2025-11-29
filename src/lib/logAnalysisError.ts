import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface AnalysisErrorLogInput {
  clientId?: string | null;
  sourceMode?: string | null;
  inputCharCount?: number | null;
  errorCode?: string | null;
  message?: string | null;
  meta?: unknown;
}

export async function logAnalysisError(input: AnalysisErrorLogInput) {
  try {
    await prisma.analysisLog.create({
      data: {
        clientId: input.clientId ?? null,
        sourceMode: input.sourceMode ?? null,
        inputCharCount: input.inputCharCount ?? null,
        errorCode: input.errorCode ?? null,
        message: input.message ?? null,
        meta: (input.meta ?? null) as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("Failed to log analysis error", error);
  }
}
