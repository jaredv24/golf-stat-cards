import OpenAI from "openai";
import { toFile } from "openai/uploads";

const SHIRTS = [
  "a crisp white polo shirt",
  "a navy blue polo shirt",
  "a red polo shirt",
  "a light blue polo shirt",
  "a yellow polo shirt",
  "a forest green polo shirt",
  "a black polo shirt",
  "a pink polo shirt",
  "an orange polo shirt",
];

const BOTTOMS = [
  "khaki golf pants",
  "navy golf shorts",
  "plaid golf shorts",
  "gray golf pants",
  "white golf shorts",
  "stone-colored golf pants",
  "olive golf shorts",
];

const HEADWEAR = [
  "a white golf cap",
  "a navy golf visor",
  "a flat driving cap",
  "a bucket hat",
  null,
  null,
];

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function randomOutfit(): string {
  const shirt = pick(SHIRTS);
  const bottom = pick(BOTTOMS);
  const hat = pick(HEADWEAR);
  return hat ? `${shirt}, ${bottom}, and ${hat}` : `${shirt} and ${bottom}`;
}

function buildPrompt(): string {
  return [
    "Convert this photo into a retro 8-bit pixel art video game character",
    "portrait, waist-up and front-facing, like a classic sports game character",
    "select screen. Base the character on this specific person's face and",
    "general build/physique so they're recognizable — keep their hairstyle,",
    "skin tone, approximate body shape, and expression.",
    `Dress the character in typical golf attire: ${randomOutfit()}.`,
    "Chunky visible pixels, a limited nostalgic color palette like a 1990s",
    "console sports game, bold clean outlines. Simple flat-color background",
    "(plain color or a soft green fairway), no text, no watermark.",
  ].join(" ");
}

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
    prompt: buildPrompt(),
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
