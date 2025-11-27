import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED = new Set(["positive", "mixed", "negative"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profileId = typeof body?.profileId === "string" ? body.profileId.trim() : "";
    const resonance = typeof body?.resonance === "string" ? body.resonance.trim() : "";
    const feedbackText =
      typeof body?.feedbackText === "string" && body.feedbackText.trim().length > 0
        ? body.feedbackText.trim()
        : null;

    if (!profileId) {
      return NextResponse.json({ error: "profile_required" }, { status: 400 });
    }
    if (!ALLOWED.has(resonance)) {
      return NextResponse.json({ error: "invalid_resonance" }, { status: 400 });
    }

    const existing = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!existing) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        resonance,
        feedbackText,
        feedbackAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile feedback failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
