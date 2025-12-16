import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const clampInt = (value: string | null, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
};

const toFilenameStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

const authorizeAdmin = (request: NextRequest) => {
  const adminKey = process.env.ADMIN_KEY;
  const provided = request.nextUrl.searchParams.get("key");
  if (adminKey && provided !== adminKey) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }
  return null;
};

export async function GET(request: NextRequest) {
  const unauthorized = authorizeAdmin(request);
  if (unauthorized) return unauthorized;

  const format = (request.nextUrl.searchParams.get("format") || "jsonl").toLowerCase();
  const includeRawText = request.nextUrl.searchParams.get("includeRawText") === "1";
  const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "1";
  const download = request.nextUrl.searchParams.get("download") === "1";
  const id = request.nextUrl.searchParams.get("id")?.trim() || null;

  const take = clampInt(request.nextUrl.searchParams.get("take"), 500, 1, 5000);

  const where = includeDeleted ? {} : { deletedAt: null };

  const select = {
    id: true,
    createdAt: true,
    clientId: true,
    sourceMode: true,
    confidence: true,
    thinkingStyle: true,
    communicationStyle: true,
    strengthsJson: true,
    blindSpotsJson: true,
    suggestedJson: true,
    rawText: includeRawText,
    model: true,
    promptVersion: true,
    inputCharCount: true,
    inputSourceHost: true,
    promptTokens: true,
    completionTokens: true,
    deletedAt: true,
    resonance: true,
    feedbackText: true,
    feedbackAt: true,
    mindCard: true,
  } as const;

  const records = id
    ? await prisma.profile.findMany({ where: { id }, select })
    : await prisma.profile.findMany({ where, orderBy: { createdAt: "desc" }, take, select });

  if (id && records.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const now = new Date();
  const stamp = toFilenameStamp(now);
  const baseName = `mindprofile-profiles-${stamp}${includeRawText ? "-with-rawtext" : ""}`;

  const headers = new Headers({
    "Cache-Control": "no-store",
  });

  if (download) {
    const ext = format === "json" ? "json" : "jsonl";
    headers.set("Content-Disposition", `attachment; filename="${baseName}.${ext}"`);
  }

  if (format === "json") {
    return NextResponse.json(
      {
        exportedAt: now.toISOString(),
        count: records.length,
        includeRawText,
        includeDeleted,
        records,
      },
      { headers },
    );
  }

  headers.set("Content-Type", "application/x-ndjson; charset=utf-8");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const record of records) {
        controller.enqueue(encoder.encode(`${JSON.stringify(record)}\n`));
      }
      controller.close();
    },
  });

  return new NextResponse(stream, { headers });
}

