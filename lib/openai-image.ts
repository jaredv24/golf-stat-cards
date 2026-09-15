import OpenAI from "openai";
import { toFile } from "openai/uploads";

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

function buildOutfit(favoriteColor: string): string {
  const shirt = `a polo shirt in this exact color: ${favoriteColor}`;
  const bottom = pick(BOTTOMS);
  const hat = pick(HEADWEAR);
  return hat ? `${shirt}, ${bottom}, and ${hat}` : `${shirt} and ${bottom}`;
}

function buildPrompt(favoriteColor: string): string {
  return [
    "Convert this photo into a retro 8-bit pixel art video game character",
    "portrait, waist-up and front-facing, like a classic sports game character",
    "select screen from the NES/SNES era. Keep the face SIMPLE and iconic —",
    "a handful of flat colors, basic blocky shapes, no realistic shading or",
    "fine detail. Just capture the broad traits that make them recognizable",
    "at a glance: hairstyle, hair color, face shape, skin tone, and a simple",
    "expression. Don't try to render precise, detailed facial features.",
    "Reflect their actual build if the photo shows their shoulders and",
    "torso; if only their face is visible, give them a normal, average",
    "build rather than guessing or exaggerating.",
    `Dress the character in typical golf attire: ${buildOutfit(favoriteColor)}.`,
    "Chunky visible pixels, a limited nostalgic color palette, bold clean",
    "outlines. Simple flat-color background (plain color or a soft green",
    "fairway), no text, no watermark.",
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

export async function generate8BitAvatar(
  photo: Buffer,
  mimeType: string,
  favoriteColor: string
): Promise<Buffer> {
  const openai = getClient();
  const file = await toFile(photo, "photo", { type: mimeType });

  const response = await openai.images.edit({
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    image: file,
    prompt: buildPrompt(favoriteColor),
    size: "1024x1024",
    // "low" keeps per-avatar cost minimal — this is a fun tournament keepsake,
    // not a print asset.
    quality: "low",
    // Defaults to "low", which lets the model take real liberties with faces.
    // "high" costs more tokens but is specifically meant to keep people
    // recognizable through an edit — worth it given this whole feature is a
    // likeness of the person.
    input_fidelity: "high",
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
