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

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function buildOutfit(favoriteColor: string): string {
  const shirt = `a polo shirt in this exact color: ${favoriteColor}`;
  const bottom = pick(BOTTOMS);
  return `${shirt} and ${bottom}`;
}

function buildPrompt(favoriteColor: string): string {
  return [
    "Convert this photo into a pixel art video game character in the style",
    "of Stardew Valley — full body, head to toe, standing and",
    "front-facing. Charming and stylized, not realistic or photographic:",
    "clean bold outlines, simple shapes, a warm color palette, visible",
    "pixels. Keep the rendering style, line weight, and shading approach",
    "consistent and simple throughout — no mixing of flat cartoon shading",
    "with realistic/painterly shading.",
    "Eyes must be simple and clean: open, forward-facing, a small dot or",
    "oval pupil on a visible eye shape. Not closed, not squinting, not",
    "drawn as thick lashes or eyeliner.",
    "Clearly capture this specific person's face shape, hairstyle, and",
    "facial hair style (beard, mustache, or clean-shaven — match the photo",
    "exactly), along with their skin tone and expression, so they're",
    "recognizable. Give everyone a normal, average build and face, not",
    "heavy, regardless of what the photo shows below the neck. No hat or",
    "headwear.",
    `Dress the character in typical golf attire: ${buildOutfit(favoriteColor)}.`,
    "Simple flat-color background (plain color or a soft green fairway),",
    "no text, no watermark.",
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

/**
 * Generates `count` avatar variations in a single request (via the `n`
 * param) rather than N independent calls — independent calls were drifting
 * noticeably in rendering style/detail level from each other, since each
 * one is an unrelated generation with no shared context.
 */
export async function generate8BitAvatarOptions(
  photo: Buffer,
  mimeType: string,
  favoriteColor: string,
  count: number
): Promise<Buffer[]> {
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
    n: count,
  });

  const items = response.data;
  if (!items || items.length === 0) {
    throw new Error("OpenAI did not return any images");
  }

  return Promise.all(
    items.map(async (data) => {
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
    })
  );
}
