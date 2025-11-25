import { NextResponse } from "next/server";
import { generateProfileSummary } from "@/lib/profiler";
import { scrapeConversationFromUrl } from "@/lib/scraper";
import { storeProfile } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body?.url as string | undefined;

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let scrapedText: string | null = null;
    let sourceLabel: string | undefined;

    try {
      const { text, title } = await scrapeConversationFromUrl(url);
      scrapedText = text;
      sourceLabel = title ?? url;
    } catch (err) {
      console.error("Link scrape failed", err);
      // If scraping fails, keep going with a stub to avoid blocking the user.
      scrapedText =
        "User shared a conversation link but the content could not be fetched. Provide a generic, example-based profile.";
      sourceLabel = url;
    }

    const { sanitizedText, summary } = await generateProfileSummary(
      scrapedText,
      "link",
    );

    const profile = storeProfile({
      sanitizedText,
      summary,
      ingestionType: "link",
      source: sourceLabel,
      meta: { url },
    });

    return NextResponse.json({
      profileId: profile.id,
      profile,
    });
  } catch (error) {
    console.error("Link ingest failed", error);
    return NextResponse.json(
      { error: "Unable to process the link." },
      { status: 500 },
    );
  }
}
