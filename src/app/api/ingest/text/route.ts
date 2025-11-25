import { NextResponse } from "next/server";
import { generateProfileSummary } from "@/lib/profiler";
import { storeProfile } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text as string | undefined;

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide at least a few sentences of text." },
        { status: 400 },
      );
    }

    const { sanitizedText, summary } = await generateProfileSummary(text, "text");

    const profile = storeProfile({
      sanitizedText,
      summary,
      ingestionType: "text",
      source: "Pasted conversation",
      meta: { characters: text.length },
    });

    return NextResponse.json({ profileId: profile.id, profile });
  } catch (error) {
    console.error("Text ingest failed", error);
    return NextResponse.json(
      { error: "Unable to process the pasted text." },
      { status: 500 },
    );
  }
}
