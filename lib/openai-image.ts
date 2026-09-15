import { readFile } from "node:fs/promises";
import path from "node:path";
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

const STYLE_REFERENCE_PATH = path.join(process.cwd(), "lib", "assets", "style-reference.png");

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
    "The first image is a photo of a real person. The second image is an",
    "art style reference. Create a full-body, front-facing, standing",
    "character illustration of the person from the first image, matching",
    "the rendering style of the second reference image as closely as",
    "possible: clean anime/manga-style linework, soft cel shading, large",
    "detailed expressive eyes with a clear iris and highlight, smooth hair",
    "rendering with gradient shading.",
    "Base the character's likeness on the first image: face shape,",
    "hairstyle, facial hair style (beard, mustache, or clean-shaven —",
    "match exactly), skin tone, and expression, so they're recognizable.",
    "Give everyone a normal, average build and face, not heavy,",
    "regardless of what the photo shows below the neck. No hat or",
    "headwear.",
    `Dress the character in typical golf attire: ${buildOutfit(favoriteColor)}.`,
    "Simple, softly shaded background (plain color or a soft green",
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
  const [photoFile, styleReferenceFile] = await Promise.all([
    toFile(photo, "photo", { type: mimeType }),
    toFile(await readFile(STYLE_REFERENCE_PATH), "style-reference.png", { type: "image/png" }),
  ]);

  const response = await openai.images.edit({
    // gpt-image-2.5-sunburst (released 2026-09-08) trades some speed for
    // meaningfully more detail/instruction-following than gpt-image-1 —
    // worth it here since likeness/detail quality is the whole feature.
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst",
    image: [photoFile, styleReferenceFile],
    prompt: buildPrompt(favoriteColor),
    size: "1024x1024",
    // "low" keeps per-avatar cost minimal — this is a fun tournament keepsake,
    // not a print asset.
    quality: "low",
    // input_fidelity isn't supported by gpt-image-2.5-sunburst (only the
    // gpt-image-1 family) — likeness grounding here comes from the model
    // itself plus the input photo/style reference.
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
