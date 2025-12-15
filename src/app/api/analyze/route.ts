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

const buildCookieHeader = (setCookieHeader: string | null): string | null => {
  if (!setCookieHeader) return null;
  const rawEntries: string[] = [];
  let current = "";
  let inExpires = false;

  for (let i = 0; i < setCookieHeader.length; i++) {
    const char = setCookieHeader[i];
    const next = setCookieHeader.slice(i, i + 8).toLowerCase();
    if (next === "expires=") {
      inExpires = true;
    }
    if (char === "," && !inExpires) {
      if (current.trim()) rawEntries.push(current.trim());
      current = "";
      continue;
    }
    current += char;
    if (char === ";" && inExpires) {
      inExpires = false;
    }
  }
  if (current.trim()) rawEntries.push(current.trim());

  const cookies = rawEntries
    .map((entry) => entry.split(";")[0]?.trim())
    .filter((entry): entry is string => Boolean(entry));

  return cookies.length ? cookies.join("; ") : null;
};

const extractTextFromHtml = (html: string): string => {
  const $ = load(html);
  $("script, style").remove();
  const mainText = $("main").text();
  const bodyText = $("body").text();
  const text = (mainText || bodyText || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
};

const parseNextDataFromHtml = (html: string): { data: any | null; buildId: string | null } => {
  try {
    const $ = load(html);
    const script = $("#__NEXT_DATA__").html();
    const data = script ? JSON.parse(script) : null;
    const buildAttr = $("html").attr("data-build");
    const buildId =
      (data && typeof data?.buildId === "string" ? data.buildId : null) ||
      (typeof buildAttr === "string" && buildAttr.length ? buildAttr : null);
    return { data, buildId };
  } catch (error) {
    console.warn("Failed to parse __NEXT_DATA__", error);
    return { data: null, buildId: null };
  }
};

const normalizeChatGptMessage = (message: any): { role: "user" | "assistant"; content: string } | null => {
  const roleRaw =
    message?.message?.author?.role ??
    message?.author?.role ??
    message?.message?.role ??
    message?.role ??
    null;
  if (roleRaw !== "user" && roleRaw !== "assistant") return null;

  const content = message?.message?.content ?? message?.content;
  if (!content) return null;

  let text: string | null = null;
  if (Array.isArray(content.parts)) {
    const parts = content.parts.filter((p: unknown) => typeof p === "string") as string[];
    text = parts.join("\n");
  } else if (typeof content.text === "string") {
    text = content.text;
  } else if (typeof content === "string") {
    text = content;
  }

  const cleaned = (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned.length) return null;
  return { role: roleRaw, content: cleaned };
};

const combineChatGptMessages = (messages: any[]): string | null => {
  const parts: string[] = [];
  for (const msg of messages) {
    const normalized = normalizeChatGptMessage(msg);
    if (!normalized) continue;
    const label = normalized.role === "user" ? "User:" : "AI:";
    parts.push(`${label} ${normalized.content}`);
  }
  const combined = parts.join("\n").trim();
  return combined.length ? combined : null;
};

const extractChatGptShareTextFromData = (data: any): string | null => {
  try {
    if (!data) return null;
    const pageProps = data?.props?.pageProps ?? data?.pageProps;
    const shared =
      pageProps?.sharedConversation ||
      pageProps?.serverResponse?.sharedConversation ||
      pageProps?.serverResponse ||
      null;

    if (Array.isArray(shared?.messages) && shared.messages.length) {
      const combined = combineChatGptMessages(shared.messages);
      if (combined) return combined;
    }

    const mappingSource =
      (shared?.mapping && typeof shared.mapping === "object" && shared.mapping) ||
      (pageProps?.serverResponse?.mapping && typeof pageProps.serverResponse.mapping === "object" && pageProps.serverResponse.mapping) ||
      null;

    if (mappingSource) {
      const mappingMessages = Object.values(mappingSource as Record<string, any>)
        .map((m: any) => m?.message)
        .filter(Boolean);
      mappingMessages.sort((a: any, b: any) => (a?.create_time ?? 0) - (b?.create_time ?? 0));
      const combined = combineChatGptMessages(mappingMessages);
      if (combined) return combined;
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
        if (current.messages && Array.isArray(current.messages) && current.messages.length) {
          const combined = combineChatGptMessages(current.messages);
          if (combined) return combined;
        }
        if (current.mapping && typeof current.mapping === "object") {
          const mappingMessages = Object.values(current.mapping as Record<string, any>)
            .map((m: any) => m?.message)
            .filter(Boolean);
          mappingMessages.sort((a: any, b: any) => (a?.create_time ?? 0) - (b?.create_time ?? 0));
          const combined = combineChatGptMessages(mappingMessages);
          if (combined) return combined;
        }
        Object.values(current).forEach((v) => queue.push(v));
      }
    }
  } catch (error) {
    console.error("Failed to parse ChatGPT share JSON", error);
  }
  return null;
};

const fetchChatGptShareTextFromDataEndpoint = async (
  parsedUrl: URL,
  buildId: string | null,
  cookieHeader?: string | null,
): Promise<string | null> => {
  const shareId = parsedUrl.pathname.split("/").filter(Boolean).pop();
  if (!shareId) {
    console.warn("ChatGPT share link missing shareId", { url: parsedUrl.toString() });
    return null;
  }
  if (!buildId) {
    console.warn("ChatGPT share page missing buildId for dynamic fetch", { url: parsedUrl.toString() });
    return null;
  }
  const dataUrl = `${parsedUrl.origin}/_next/data/${buildId}/share/${shareId}.json?shareParams=${shareId}`;
  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }
    const dataRes = await fetch(dataUrl, {
      headers,
    });
    if (!dataRes.ok) {
      console.warn("ChatGPT share data fetch failed", { url: dataUrl, status: dataRes.status });
      return null;
    }
    const data = await dataRes.json();
    const extracted = extractChatGptShareTextFromData(data);
    if (!extracted) {
      console.warn("ChatGPT share data missing sharedConversation", { url: dataUrl });
    }
    return extracted;
  } catch (error) {
    console.warn("Failed to fetch ChatGPT share dataUrl", { url: dataUrl, error });
    return null;
  }
};

const fetchChatGptShareTextFromShareApi = async (
  parsedUrl: URL,
  cookieHeader?: string | null,
): Promise<string | null> => {
  const shareId = parsedUrl.pathname.split("/").filter(Boolean).pop();
  if (!shareId) {
    console.warn("ChatGPT share link missing shareId for backend-api fetch", { url: parsedUrl.toString() });
    return null;
  }
  const apiUrl = `${parsedUrl.origin}/backend-api/share/${shareId}`;
  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (cookieHeader) headers.Cookie = cookieHeader;

    const res = await fetch(apiUrl, { headers });
    if (!res.ok) {
      console.warn("ChatGPT share backend-api fetch failed", { url: apiUrl, status: res.status });
      return null;
    }
    const data = await res.json();
    const extracted = extractChatGptShareTextFromData(data);
    if (!extracted) {
      console.warn("ChatGPT share backend-api missing conversation content", { url: apiUrl });
    }
    return extracted;
  } catch (error) {
    console.warn("Failed to fetch ChatGPT backend-api share data", { url: apiUrl, error });
    return null;
  }
};

const isAllowedUrl = (url: URL) => {
  const protocolOk = url.protocol === "http:" || url.protocol === "https:";
  return protocolOk && allowedHosts.some((host) => url.hostname.toLowerCase().endsWith(host));
};

const looksLikeBoilerplate = (text: string) => {
  const lower = text.toLowerCase();
  return (
    lower.length < 100 &&
    (lower.includes("log in") || lower.includes("by messaging chatgpt") || lower.includes("sign up for free"))
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

      const normalizedForAnalysis = normalizeTextInput(text, { redactNames: false });
      const normalizedForStorage = normalizeTextInput(text, { redactNames: true });
      const analysis = await analyzeConversation({
        normalizedText: normalizedForAnalysis.normalizedText,
        inputCharCount: normalizedForAnalysis.inputCharCount,
        userMessageCount: normalizedForAnalysis.userMessageCount,
        sourceMode: "text",
      });

      const sampleText =
        normalizedForStorage.normalizedText.length > 1200
          ? normalizedForStorage.normalizedText.slice(0, 1200)
          : normalizedForStorage.normalizedText;

      const shouldGenerateMindCard =
        analysis.profile.confidence !== "low" &&
        normalizedForAnalysis.userMessageCount >= 6 &&
        normalizedForAnalysis.inputCharCount >= 500;

      const mindCard: MindCard | null = shouldGenerateMindCard
        ? await inferMindCard({
            profile: {
              ...analysis.profile,
              id: "",
            },
            sampleText,
          })
        : null;

      const dbProfile = await prisma.profile.create({
        data: {
          clientId,
          sourceMode: normalizedForStorage.sourceMode,
          confidence: analysis.profile.confidence,
          thinkingStyle: analysis.profile.thinkingStyle,
          communicationStyle: analysis.profile.communicationStyle,
          strengthsJson: analysis.profile.strengths,
          blindSpotsJson: analysis.profile.blindSpots,
          suggestedJson: analysis.profile.suggestedWorkflows,
          rawText: normalizedForStorage.normalizedText,
          model: analysis.modelUsed,
          promptVersion: analysis.promptVersion,
          inputCharCount: normalizedForAnalysis.inputCharCount,
          inputSourceHost: normalizedForStorage.inputSourceHost,
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
        sourceMode: normalizedForStorage.sourceMode,
        inputCharCount: normalizedForAnalysis.inputCharCount,
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

      const perUrlMeta: Array<{ host: string | null; status?: number; extractedLength?: number; reason?: string }> = [];

      for (const rawUrl of shareUrls) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(rawUrl);
        } catch {
          perUrlMeta.push({ host: null, reason: "invalid_url" });
          continue;
        }

        if (!isAllowedUrl(parsedUrl)) continue;
        const host = parsedUrl.hostname.toLowerCase();
        const isChatGptShare = host.endsWith("chatgpt.com") || host.endsWith("chat.openai.com");

        try {
          const res = await fetch(parsedUrl.toString(), {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          if (!res.ok) continue;
          const html = await res.text();
          const { data: nextData, buildId } = isChatGptShare ? parseNextDataFromHtml(html) : { data: null, buildId: null };
          const cookieHeader = isChatGptShare ? buildCookieHeader(res.headers.get("set-cookie")) : null;
          let extractedShare = isChatGptShare ? extractChatGptShareTextFromData(nextData) : null;
          if (!extractedShare && isChatGptShare) {
            console.warn("ChatGPT share page missing embedded conversation, trying data endpoint", { host });
            extractedShare = await fetchChatGptShareTextFromDataEndpoint(parsedUrl, buildId, cookieHeader);
          }
          if (!extractedShare && isChatGptShare) {
            console.warn("ChatGPT share content unavailable after data endpoint, trying backend-api/share", { host });
            extractedShare = await fetchChatGptShareTextFromShareApi(parsedUrl, cookieHeader);
          }
          if (!extractedShare && isChatGptShare) {
            console.warn("ChatGPT share content unavailable after extraction attempts", { host });
          }
          const extracted = extractedShare || extractTextFromHtml(html);
          if (extracted && extracted.length >= 50 && !looksLikeBoilerplate(extracted)) {
            const trimmed = extracted.trim();
            collected.push(trimmed);
            lengths.push(trimmed.length);
            perUrlMeta.push({ host, status: res.status, extractedLength: trimmed.length });
          } else {
            perUrlMeta.push({
              host,
              status: res.status,
              extractedLength: extracted?.length ?? 0,
              reason: "boilerplate_or_short",
            });
          }
        } catch (error) {
          console.error("Failed to fetch shared URL", error);
          perUrlMeta.push({ host: null, reason: "fetch_failed" });
        }
      }

      if (collected.length === 0) {
        const shareHosts = shareUrls
          .map((u) => {
            try {
              return new URL(u).hostname;
            } catch {
              return null;
            }
          })
          .filter((h): h is string => typeof h === "string" && h.trim().length > 0);

        await logAnalysisError({
          clientId,
          sourceMode: "url",
          inputCharCount: 0,
          errorCode: "url_boilerplate_or_empty",
          message: "Share URL text looks like boilerplate/too short",
          meta: {
            shareHosts,
            lengths,
            sample: "",
            perUrlMeta,
            collectedCount: collected.length,
          },
        });
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      const combined = collected.join("\n\n---\n\n").trim();
      if (!combined) {
        const shareHosts = shareUrls
          .map((u) => {
            try {
              return new URL(u).hostname;
            } catch {
              return null;
            }
          })
          .filter((h): h is string => typeof h === "string" && h.trim().length > 0);

        await logAnalysisError({
          clientId,
          sourceMode: "url",
          inputCharCount: combined.length,
          errorCode: "url_boilerplate_or_empty",
          message: "Share URL text looks like boilerplate/too short",
          meta: {
            shareHosts,
            lengths,
            sample: combined.slice(0, 200),
            perUrlMeta,
            collectedCount: collected.length,
          },
        });
        return NextResponse.json({ error: "invalid_url_or_content" }, { status: 400 });
      }

      const normalizedForAnalysis = normalizeUrlInput(combined, shareUrls[0] || "", { redactNames: false });
      const normalizedForStorage = normalizeUrlInput(combined, shareUrls[0] || "", { redactNames: true });
      const analysis = await analyzeConversation({
        normalizedText: normalizedForAnalysis.normalizedText,
        inputCharCount: normalizedForAnalysis.inputCharCount,
        userMessageCount: normalizedForAnalysis.userMessageCount,
        sourceMode: "url",
      });

      const sampleText =
        normalizedForStorage.normalizedText.length > 1200
          ? normalizedForStorage.normalizedText.slice(0, 1200)
          : normalizedForStorage.normalizedText;

      const shouldGenerateMindCard =
        analysis.profile.confidence !== "low" &&
        normalizedForAnalysis.userMessageCount >= 6 &&
        normalizedForAnalysis.inputCharCount >= 500;

      const mindCard: MindCard | null = shouldGenerateMindCard
        ? await inferMindCard({
            profile: {
              ...analysis.profile,
              id: "",
            },
            sampleText,
          })
        : null;

      const dbProfile = await prisma.profile.create({
        data: {
          clientId,
          sourceMode: normalizedForStorage.sourceMode,
          confidence: analysis.profile.confidence,
          thinkingStyle: analysis.profile.thinkingStyle,
          communicationStyle: analysis.profile.communicationStyle,
          strengthsJson: analysis.profile.strengths,
          blindSpotsJson: analysis.profile.blindSpots,
          suggestedJson: analysis.profile.suggestedWorkflows,
          rawText: normalizedForStorage.normalizedText,
          model: analysis.modelUsed,
          promptVersion: analysis.promptVersion,
          inputCharCount: normalizedForAnalysis.inputCharCount,
          inputSourceHost: normalizedForStorage.inputSourceHost,
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
        sourceMode: normalizedForStorage.sourceMode,
        inputCharCount: normalizedForAnalysis.inputCharCount,
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
