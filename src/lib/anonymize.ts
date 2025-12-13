const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /\b(?:\+?\d[\d\s().-]{7,}\d)\b/g;
const URL_REGEX = /\bhttps?:\/\/[^\s)]+/gi;
const NAME_REGEX = /\b([A-Z][a-z]{2,})\b/g;

const NAME_STOPWORDS = new Set([
  "The",
  "And",
  "This",
  "That",
  "You",
  "Your",
  "ChatGPT",
  "Claude",
  "Gemini",
  "GPT",
  "AI",
  "LLM",
  "MindProfile",
  "Wtf",
  "Toaster",
  "Idiot",
  "Useless",
  "Stupid",
  "Dumb",
  "Garbage",
  "Trash",
  "Clown",
  "Bot",
  "Npc",
  "Moron",
  "Fuck",
  "Fucking",
  "Shit",
  "Damn",
]);

const compressWhitespace = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();

export interface AnonymizeResult {
  sanitized: string;
  replacements: {
    emails: number;
    phones: number;
    urls: number;
    names: number;
  };
}

export const anonymizeText = (text: string): AnonymizeResult => {
  let emails = 0;
  let phones = 0;
  let urls = 0;
  let names = 0;

  let sanitized = text.replace(EMAIL_REGEX, () => {
    emails += 1;
    return "[email]";
  });

  sanitized = sanitized.replace(PHONE_REGEX, () => {
    phones += 1;
    return "[phone]";
  });

  sanitized = sanitized.replace(URL_REGEX, () => {
    urls += 1;
    return "[url]";
  });

  sanitized = sanitized.replace(NAME_REGEX, (match) => {
    if (NAME_STOPWORDS.has(match)) return match;
    names += 1;
    return "[name]";
  });

  return {
    sanitized: compressWhitespace(sanitized),
    replacements: { emails, phones, urls, names },
  };
};
