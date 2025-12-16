import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Profile id is required" }, { status: 400 });
  }

  try {
    const record = await prisma.profile.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const download = request.nextUrl.searchParams.get("download") === "1";
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    if (download) {
      headers.set("Content-Disposition", `attachment; filename="mindprofile-profile-${id}.json"`);
    }

    return NextResponse.json(record, { headers });
  } catch (error) {
    console.error("GET /api/profile/[id] failed", error);
    return NextResponse.json(
      { error: "Unexpected error fetching profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Profile id is required" }, { status: 400 });
  }

  try {
    await prisma.profile.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("DELETE /api/profile/[id] failed", error);

    return NextResponse.json(
      { ok: false, error: "Unable to delete profile" },
      { status: 500 },
    );
  }
}
