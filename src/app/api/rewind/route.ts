import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import AdmZip from "adm-zip";
import { prisma } from "@/lib/prisma";
import { analyzeChatExport } from "@/lib/rewind";
import { logAnalysisError } from "@/lib/logAnalysisError";

const parseExportFile = async (file: File): Promise<unknown[] | null> => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();
  const lowerType = file.type.toLowerCase();

  try {
    if (lowerName.endsWith(".zip") || lowerType.includes("zip")) {
      const zip = new AdmZip(buffer);
      const entry = zip
        .getEntries()
        .find((e) => e.entryName.toLowerCase().endsWith("conversations.json"));
      if (!entry) return null;
      const jsonText = entry.getData().toString("utf8");
      const parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? parsed : null;
    }

    if (lowerName.endsWith(".json") || lowerType.includes("json") || !lowerType) {
      const jsonText = buffer.toString("utf8");
      const parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? parsed : null;
    }
  } catch {
    return null;
  }

  return null;
};

export async function POST(request: Request) {
  let clientId: string | null = null;
  try {
    const formData = await request.formData();
    const clientIdRaw = formData.get("clientId");
    clientId =
      typeof clientIdRaw === "string" && clientIdRaw.trim().length > 0 ? clientIdRaw.trim() : null;

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "no_file" }, { status: 400 });
    }
    if (!file.size) {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }

    const conversations = await parseExportFile(file);
    if (!conversations) {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }
    if (conversations.length === 0) {
      return NextResponse.json({ error: "no_data" }, { status: 400 });
    }

    const rewind = analyzeChatExport(conversations);
    const year = new Date().getFullYear();

    const dbRewind = await prisma.yearSummary.create({
      data: {
        clientId,
        year,
        summaryJson: rewind as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ rewind, rewindId: dbRewind.id });
  } catch (error) {
    console.error("Rewind endpoint failed", error);
    await logAnalysisError({
      clientId,
      sourceMode: "full_history",
      errorCode: "rewind_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      meta: { stack: error instanceof Error ? error.stack : String(error) },
    });
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
