import { anonymizeText } from "./anonymize";
import type { SourceMode } from "@/types/profile";

export interface NormalizedInput {
  normalizedText: string;
  inputCharCount: number;
  sourceMode: SourceMode;
  inputSourceHost?: string | null;
}

const cleanWhitespace = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const normalizeTextInput = (raw: string): NormalizedInput => {
  const { sanitized } = anonymizeText(raw);
  const normalizedText = cleanWhitespace(sanitized);
  return {
    normalizedText,
    inputCharCount: normalizedText.length,
    sourceMode: "text",
    inputSourceHost: null,
  };
};

export const normalizeUrlInput = (rawText: string, url: string): NormalizedInput => {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  })();

  const { sanitized } = anonymizeText(rawText);
  const normalizedText = cleanWhitespace(sanitized);
  return {
    normalizedText,
    inputCharCount: normalizedText.length,
    sourceMode: "url",
    inputSourceHost: host,
  };
};

export const normalizeScreenshotInput = (ocrTexts: string[]): NormalizedInput => {
  const joined = cleanWhitespace(ocrTexts.filter(Boolean).join("\n\n"));
  const { sanitized } = anonymizeText(joined);
  const normalizedText = cleanWhitespace(sanitized);
  return {
    normalizedText,
    inputCharCount: normalizedText.length,
    sourceMode: "screenshots",
    inputSourceHost: null,
  };
};
