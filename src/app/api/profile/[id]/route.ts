import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
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

    return NextResponse.json(record);
  } catch (error) {
    console.error("GET /api/profile/[id] failed", error);
    return NextResponse.json(
      { error: "Unexpected error fetching profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
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
