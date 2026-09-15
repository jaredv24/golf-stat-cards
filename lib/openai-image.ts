import OpenAI from "openai";
import { toFile } from "openai/uploads";

const PROMPT = [
  "Convert this photo into a retro 8-bit pixel art video game character portrait,",
  "front-facing, head and shoulders. Chunky visible pixels, a limited nostalgic",
  "color palette like a classic sports game on a 1990s console, bold clean",
  "outlines. Keep the person's hairstyle, skin tone, and expression recognizable.",
  "Simple flat-color background, no text, no watermark.",
].join(" ");

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function generate8BitAvatar(photo: Buffer, mimeType: string): Promise<Buffer> {
  const openai = getClient();
  const file = await toFile(photo, "photo", { type: mimeType });

  const response = await openai.images.edit({
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    image: file,
    prompt: PROMPT,
    size: "1024x1024",
    // "low" keeps per-avatar cost minimal — this is a fun tournament keepsake,
    // not a print asset.
    quality: "low",
  });

  const data = response.data?.[0];
  if (!data) {
    throw new Error("OpenAI did not return an image");
  }

  if (data.b64_json) {
    return Buffer.from(data.b64_json, "base64");
  }
  if (data.url) {
    const res = await fetch(data.url);
    if (!res.ok) {
      throw new Error(`Failed to download generated image (${res.status})`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error("OpenAI response had neither b64_json nor url");
}
