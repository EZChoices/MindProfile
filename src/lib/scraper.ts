const stripTags = (html: string) =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|br|li|ul|ol|section|article)>/gi, "$&\n")
    .replace(/<[^>]+>/g, " ");

const normalize = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\n\s*/g, "\n")
    .trim();

export interface ScrapeResult {
  text: string;
  title?: string;
}

export async function scrapeConversationFromUrl(
  url: string,
): Promise<ScrapeResult> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https links are supported.");
  }

  const res = await fetch(url, {
    headers: {
      "user-agent": "MindProfileBot/0.1",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Unable to fetch link (status ${res.status}).`);
  }

  const html = await res.text();
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim();

  const plain = normalize(stripTags(html));
  const clipped = plain.slice(0, 15000);

  if (!clipped) {
    throw new Error("No readable text found in the shared page.");
  }

  return { text: clipped, title };
}
