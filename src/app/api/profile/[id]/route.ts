import { NextResponse } from "next/server";
import { cleanupExpired, deleteProfile, getProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  cleanupExpired();
  const profile = getProfile(params.id);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const removed = deleteProfile(params.id);
  if (!removed) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
