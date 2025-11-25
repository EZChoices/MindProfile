import { OpenAI } from "openai";
import { config } from "./config";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function ocrImage(file: File): Promise<string> {
  if (!client) {
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const label = file.name || "upload";
    return `Image note (${label}, ~${sizeKb}kb): [OCR placeholder] The user and AI exchanged ideas about goals, tasks, and feedback.`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const response = await client.chat.completions.create({
      model: config.openAiVisionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the full visible text from this screenshot." },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type || "image/png"};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 512,
      temperature: 0,
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("No OCR text returned");
    return text;
  } catch (error) {
    console.error("OCR failed, falling back to stub", error);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const label = file.name || "upload";
    return `Image note (${label}, ~${sizeKb}kb): [OCR fallback] Extracted text unavailable; treat as a short chat about goals and feedback.`;
  }
}
