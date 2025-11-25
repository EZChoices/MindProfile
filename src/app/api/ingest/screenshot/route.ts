import { NextResponse } from "next/server";
import { generateProfileSummary } from "@/lib/profiler";
import { ocrImage } from "@/lib/ocr";
import { storeProfile } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploads = formData.getAll("files").filter((entry) => entry instanceof File) as File[];

    if (uploads.length === 0) {
      return NextResponse.json(
        { error: "Please attach at least one screenshot image." },
        { status: 400 },
      );
    }

    const ocrTexts = await Promise.all(uploads.map((file) => ocrImage(file)));
    const combined = ocrTexts.join("\n\n");

    const { sanitizedText, summary } = await generateProfileSummary(
      combined,
      "screenshot",
    );

    const profile = storeProfile({
      sanitizedText,
      summary,
      ingestionType: "screenshot",
      source: `${uploads.length} screenshot${uploads.length > 1 ? "s" : ""}`,
      meta: { files: uploads.length },
    });

    return NextResponse.json({ profileId: profile.id, profile });
  } catch (error) {
    console.error("Screenshot ingest failed", error);
    return NextResponse.json(
      { error: "Unable to process the screenshots." },
      { status: 500 },
    );
  }
}
