import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { load } from "cheerio";
import { prisma } from "@/lib/prisma";
import { analyzeConversation } from "@/lib/analyzeConversation";
import { normalizeTextInput, normalizeUrlInput } from "@/lib/normalizeInput";
import { inferMindCard } from "@/lib/inferMindCard";
import { logAnalysisError } from "@/lib/logAnalysisError";
import type { Profile, SourceMode } from "@/types/profile";
import type { MindCard } from "@/types/mindCard";

const allowedHosts = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "g.co",
  "ai.google.com",
];

const extractTextFromHtml = (html: string): string => {
  const $ = load(html);
  $("script, style").remove();
  const mainText = $("main").text();
  const bodyText = $("body").text();
  const text = (mainText || bodyText || "").replace(/\s+/g, " ").trim();
  return text;
};

// Attempt to extract messages from ChatGPT share pages (__NEXT_DATA__)
const extractChatGptShareText = (html: string): string | null => {
  try {
    const $ = load(html);
    const script = $("#__NEXT_DATA__").html();
    if (!script) return null;
    const data = JSON.parse(script);

    // Try common paths ChatGPT uses
    const shared =
      data?.props?.pageProps?.sharedConversation ||
      data?.props?.pageProps?.serverResponse?.sharedConversation ||
      data?.props?.pageProps?.serverResponse ||
      null;

    const messages =
      shared?.messages ||
      shared?.mapping && Object.values(shared.mapping as Record<string, any>).map((m: any) => m.message).filter(Boolean) ||
      [];

    if (Array.isArray(messages) && messages.length) {
      const parts: string[] = [];
      for (const msg of messages) {
        const content = msg?.message?.content ?? msg?.content;
        if (!content) continue;
        if (Array.isArray(content.parts)) {
          parts.push(content.parts.join(" "));
        } else if (typeof content.text === "string") {
          parts.push(content.text);
        } else if (typeof content === "string") {
          parts.push(content);
        }
      }
      const combined = parts.join("\n").replace(/\s+/g, " ").trim();
      return combined.length ? combined : null;
    }

    // fallback: breadth search for message-like objects
    const queue: any[] = [data];
    while (queue.length) {
      const current = queue.shift();
      if (Array.isArray(current)) {
        current.forEach((item) => {
          if (item && typeof item === "object") queue.push(item);
        });
      } else if (current && typeof current === "object") {
        if (current.messages && Array.isArray(current.messages)) {
          const parts: string[] = [];
          for (const msg of current.messages) {
            const content = msg?.message?.content ?? msg?.content;
            if (!content) continue;
            if (Array.isArray(content.parts)) {
              parts.push(content.parts.join(" "));
            } else if (typeof content.text === "string") {
              parts.push(content.text);
            } else if (typeof content === "string") {
              parts.push(content);
            }
          }
          const combined = parts.join("\n").replace(/\s+/g, " ").trim();
          if (combined.length) return combined;
        }
        Object.values(current).forEach((v) => queue.push(v));
      }
    }
  } catch (error) {
    console.error("Failed to parse ChatGPT share JSON", error);
  }
  return null;
};

const isAllowedUrl = (url: URL) => {
  const protocolOk = url.protocol === "http:" || url.protocol === "https:";
  return protocolOk && allowedHosts.some((host) => url.hostname.toLowerCase().endsWith(host));
};

const looksLikeBoilerplate = (text: string) => {
  const lower = text.toLowerCase();
  return (
    lower.includes("by messaging chatgpt") ||
    lower.includes("log in sign up for free") ||
    lower.includes("terms of use") ||
    lower.includes("privacy policy") ||
    lower.length < 80
  );
};

export async function POST(request: Request) {
  let clientId: string | null = null;
  try {
    const body = await request.json();
    const mode = body?.mode as SourceMode | undefined;
    clientId = typeof body?.clientId === "string" && body.clientId.trim().length > 0 ? body.clientId.trim() : null;

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing");
      return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
    }

    if (mode === "text") {
      const rawText = typeof body?.text === "string" ? body.text : "";
      const text = rawText.trim();

      if (!text || text.length < 50) {
        return NextResponse.json(
          { error: "invalid_input", message: "Provide text mode with at least 50 characters." },
        { status: 400 },
        );
      }

      const normalized = normalizeTextInput(text);
      const analysis = await analyzeConversation({
        normalizedText: normalized.normalizedText,
        inputCharCount: normalized.inputCharCount,
        userMessageCount: normalized.userMessageCount,
        sourceMode: "text",
      });

      const sampleText =
        normalized.normalizedText.length > 1200
          ? normalized.normalizedText.slice(0, 1200)
          : normalized.normalizedText;

      const mindCard: MindCard = await inferMindCard({
        profile: {
          ...analysis.profile,
          id: "",
        },
        sampleText,
      });

      const dbProfile = await prisma.profile.create({
        data: {
          clientId,
          sourceMode: normalized.sourceMode,
          confidence: analysis.profile.confidence,
          thinkingStyle: analysis.profile.thinkingStyle,
          communicationStyle: analysis.profile.communicationStyle,
          strengthsJson: analysis.profile.strengths,
          blindSpotsJson: analysis.profile.blindSpots,
          suggestedJson: analysis.profile.suggestedWorkflows,
          rawText: normalized.normalizedText,
          model: analysis.modelUsed,
          promptVersion: analysis.promptVersion,
          inputCharCount: normalized.inputCharCount,
          inputSourceHost: normalized.inputSourceHost,
          promptTokens: analysis.promptTokens,
          completionTokens: analysis.completionTokens,
          mindCard: mindCard as unknown as Prisma.InputJsonValue,
        },
      });

      let submissionCount = 1;
      if (clientId) {
        submissionCount = await prisma.profile.count({ where: { clientId } });
      }

      const tier: "first_impression" | "building_profile" | "full_profile" =
        submissionCount <= 1 ? "first_impression" : submissionCount < 5 ? "building_profile" : "full_profile";

      const profile: Profile = {
        ...analysis.profile,
        id: dbProfile.id,
        sourceMode: normalized.sourceMode,
        inputCharCount: normalized.inputCharCount,
        model: analysis.modelUsed,
        promptVersion: analysis.promptVersion,
      };

      return NextResponse.json({ profile, profileId: dbProfile.id, mindCard, submissionCount, tier });
    }

    if (mode === "url") {
      const shareUrls: string[] = Array.isArray(body?.shareUrls)
        ? body.shareUrls.filter((u: unknown) => typeof u === "string").map((u: string) => u.trim()).filter(Boolean)
        : [];

      if (shareUrls.length === 0) {
        await logAnalysisError({
          clientId,
          sourceMode: "url",
          errorCode: "no_urls",
          message: "No share URLs provided",
        });
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      const collected: string[] = [];
      const lengths: number[] = [];

      const perUrlMeta: Array<{ url: string; status?: number; extractedLength?: number; reason?: string }> = [];

      for (const rawUrl of shareUrls) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(rawUrl);
        } catch {
          perUrlMeta.push({ url: rawUrl, reason: "invalid_url" });
          continue;
        }

        if (!isAllowedUrl(parsedUrl)) continue;

        try {
          const res = await fetch(parsedUrl.toString(), {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          if (!res.ok) continue;
          const html = await res.text();
          const extractedShare = extractChatGptShareText(html);
          const extracted = extractedShare || extractTextFromHtml(html);
          if (extracted && extracted.length >= 50 && !looksLikeBoilerplate(extracted)) {
            collected.push(extracted);
            lengths.push(extracted.length);
            perUrlMeta.push({ url: rawUrl, status: res.status, extractedLength: extracted.length });
          } else {
            perUrlMeta.push({
              url: rawUrl,
              status: res.status,
              extractedLength: extracted?.length ?? 0,
              reason: "boilerplate_or_short",
            });
          }
        } catch (error) {
          console.error("Failed to fetch shared URL", error);
          perUrlMeta.push({ url: rawUrl, reason: "fetch_failed" });
        }
      }

      const combined = collected.join("\n\n---\n\n").trim();
      if (!combined || combined.length < 50) {
        await logAnalysisError({
          clientId,
          sourceMode: "url",
          inputCharCount: combined.length,
          errorCode: "url_boilerplate_or_empty",
          message: "Share URL text looks like boilerplate/too short",
          meta: {
            shareUrls,
            lengths,
            sample: combined.slice(0, 200),
            perUrlMeta,
            collectedCount: collected.length,
          },
        });
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      const normalized = normalizeUrlInput(combined, shareUrls[0] || "");
      const analysis = await analyzeConversation({
        normalizedText: normalized.normalizedText,
        inputCharCount: normalized.inputCharCount,
        userMessageCount: normalized.userMessageCount,
        sourceMode: "url",
      });

      const sampleText =
        normalized.normalizedText.length > 1200
          ? normalized.normalizedText.slice(0, 1200)
          : normalized.normalizedText;

      const mindCard: MindCard = await inferMindCard({
        profile: {
          ...analysis.profile,
          id: "",
        },
        sampleText,
      });

      const dbProfile = await prisma.profile.create({
        data: {
          clientId,
          sourceMode: normalized.sourceMode,
          confidence: analysis.profile.confidence,
          thinkingStyle: analysis.profile.thinkingStyle,
          communicationStyle: analysis.profile.communicationStyle,
          strengthsJson: analysis.profile.strengths,
          blindSpotsJson: analysis.profile.blindSpots,
          suggestedJson: analysis.profile.suggestedWorkflows,
          rawText: normalized.normalizedText,
          model: analysis.modelUsed,
          promptVersion: analysis.promptVersion,
          inputCharCount: normalized.inputCharCount,
          inputSourceHost: normalized.inputSourceHost,
          promptTokens: analysis.promptTokens,
          completionTokens: analysis.completionTokens,
          mindCard: mindCard as unknown as Prisma.InputJsonValue,
        },
      });

      let submissionCount = 1;
      if (clientId) {
        submissionCount = await prisma.profile.count({ where: { clientId } });
      }
      const tier: "first_impression" | "building_profile" | "full_profile" =
        submissionCount <= 1 ? "first_impression" : submissionCount < 5 ? "building_profile" : "full_profile";

      const profile: Profile = {
        ...analysis.profile,
        id: dbProfile.id,
        sourceMode: normalized.sourceMode,
        inputCharCount: normalized.inputCharCount,
        model: analysis.modelUsed,
        promptVersion: analysis.promptVersion,
      };

      return NextResponse.json({ profile, profileId: dbProfile.id, mindCard, submissionCount, tier });
    }

    if (mode === "screenshots") {
      // This route expects FormData in a separate endpoint; keep here for completeness.
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  } catch (error) {
    console.error("Analyze endpoint failed", error);
    await logAnalysisError({
      clientId,
      errorCode: "analysis_failed",
      message: error instanceof Error ? error.message : "Unknown error",
      meta: { stack: error instanceof Error ? error.stack : String(error) },
    });
    return NextResponse.json({ error: "analysis_failed" }, { status: 500 });
  }
}
