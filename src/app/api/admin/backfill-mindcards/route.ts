import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inferMindCard } from "@/lib/inferMindCard";
import type { Profile } from "@/types/profile";

export const dynamic = "force-dynamic";

type RecordSelection = {
  id: string;
  confidence: string;
  thinkingStyle: string;
  communicationStyle: string;
  strengthsJson: unknown;
  blindSpotsJson: unknown;
  suggestedJson: unknown;
  rawText: string;
};

const parseArray = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export async function GET(request: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  const provided = request.nextUrl.searchParams.get("key");

  if (adminKey && provided !== adminKey) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }

  const batchSize = Number(request.nextUrl.searchParams.get("take") ?? 10);

  const missing = (await prisma.profile.findMany({
    where: { mindCard: { equals: Prisma.DbNull } },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(batchSize, 50)),
    select: {
      id: true,
      confidence: true,
      thinkingStyle: true,
      communicationStyle: true,
      strengthsJson: true,
      blindSpotsJson: true,
      suggestedJson: true,
      rawText: true,
    },
  })) as RecordSelection[];

  if (missing.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0 });
  }

  const updatedIds: string[] = [];
  for (const record of missing) {
    try {
      const profile: Profile = {
        id: record.id,
        confidence:
          record.confidence === "low" || record.confidence === "high"
            ? record.confidence
            : "medium",
        thinkingStyle: record.thinkingStyle,
        communicationStyle: record.communicationStyle,
        strengths: parseArray(record.strengthsJson),
        blindSpots: parseArray(record.blindSpotsJson),
        suggestedWorkflows: parseArray(record.suggestedJson),
      };

      const sampleText =
        record.rawText.length > 1200 ? record.rawText.slice(0, 1200) : record.rawText;

      const mindCard = await inferMindCard({
        profile: { ...profile, id: "" },
        sampleText,
      });

      await prisma.profile.update({
        where: { id: record.id },
        data: {
          mindCard: mindCard as unknown as Prisma.InputJsonValue,
        },
      });

      updatedIds.push(record.id);
    } catch (error) {
      console.error("Failed to backfill mindCard", { id: record.id, error });
    }
  }

  const remaining = await prisma.profile.count({ where: { mindCard: { equals: Prisma.DbNull } } });

  return NextResponse.json({
    ok: true,
    processed: updatedIds.length,
    updatedIds,
    remaining,
  });
}
