import { NextResponse } from "next/server";
import type { Profile } from "@/types/profile";

const baseMockProfile: Omit<Profile, "id"> = {
  thinkingStyle: "Analytical, iterative, tends to sanity-check ideas.",
  communicationStyle: "Direct, concise, prefers bullet points and concrete steps.",
  strengths: [
    "Breaks big problems into smaller pieces",
    "Asks follow-up questions when uncertain",
    "Comfortable with ambiguity early in the process",
  ],
  blindSpots: [
    "Sometimes jumps to implementation before scoping",
    "Can under-specify constraints for complex tasks",
    "Occasionally over-trusts the first draft from AI",
  ],
  suggestedWorkflows: [
    "Force yourself to write a 3-bullet spec before asking AI to code",
    "Ask AI to list edge cases before you commit to a design",
    "Have AI generate alternative options before picking one",
  ],
  confidence: "medium",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body?.mode as string | undefined;
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (mode !== "text" || !text) {
      return NextResponse.json(
        { error: "Invalid request. Provide text mode with content." },
        { status: 400 },
      );
    }

    const profile: Profile = {
      id: crypto.randomUUID(),
      ...baseMockProfile,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Analyze endpoint failed", error);
    return NextResponse.json(
      { error: "Unable to analyze the provided text." },
      { status: 500 },
    );
  }
}
