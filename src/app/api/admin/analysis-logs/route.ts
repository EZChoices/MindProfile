import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  const provided = request.nextUrl.searchParams.get("key");
  if (adminKey && provided !== adminKey) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }

  const take = Math.max(1, Math.min(Number(request.nextUrl.searchParams.get("take")) || 25, 100));

  const logs = await prisma.analysisLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      createdAt: true,
      clientId: true,
      sourceMode: true,
      inputCharCount: true,
      errorCode: true,
      message: true,
      meta: true,
    },
  });

  const remaining = await prisma.analysisLog.count();

  return NextResponse.json({ logs, total: remaining });
}
