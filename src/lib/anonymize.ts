const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /\b(?:\+?\d[\d\s().-]{7,}\d)\b/g;
const URL_REGEX = /\bhttps?:\/\/[^\s)]+/gi;
const HANDLE_REGEX = /(^|\s)@([a-zA-Z0-9_]{2,30})\b/gm;
const IPV4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const OPENAI_KEY_REGEX = /\bsk-[a-zA-Z0-9]{20,}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CARD_LIKE_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
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
    handles: number;
    ips: number;
    ids: number;
    secrets: number;
    ssns: number;
    cards: number;
    names: number;
  };
}

export const anonymizeText = (text: string): AnonymizeResult => {
  let emails = 0;
  let phones = 0;
  let urls = 0;
  let handles = 0;
  let ips = 0;
  let ids = 0;
  let secrets = 0;
  let ssns = 0;
  let cards = 0;
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

  sanitized = sanitized.replace(HANDLE_REGEX, (match, prefix) => {
    if (typeof prefix !== "string") return match;
    handles += 1;
    return `${prefix}[handle]`;
  });

  sanitized = sanitized.replace(OPENAI_KEY_REGEX, () => {
    secrets += 1;
    return "[secret]";
  });

  sanitized = sanitized.replace(UUID_REGEX, () => {
    ids += 1;
    return "[id]";
  });

  sanitized = sanitized.replace(IPV4_REGEX, () => {
    ips += 1;
    return "[ip]";
  });

  sanitized = sanitized.replace(SSN_REGEX, () => {
    ssns += 1;
    return "[ssn]";
  });

  sanitized = sanitized.replace(CARD_LIKE_REGEX, () => {
    cards += 1;
    return "[card]";
  });

  sanitized = sanitized.replace(NAME_REGEX, (match) => {
    if (NAME_STOPWORDS.has(match)) return match;
    names += 1;
    return "[name]";
  });

  return {
    sanitized: compressWhitespace(sanitized),
    replacements: { emails, phones, urls, handles, ips, ids, secrets, ssns, cards, names },
  };
};
