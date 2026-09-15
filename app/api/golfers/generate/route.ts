import { NextResponse } from "next/server";
import { golferInputSchema } from "@/lib/schema";
import { generate8BitAvatarOptions } from "@/lib/openai-image";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_OPTION_COUNT = 3;

export async function POST(request: Request) {
  const formData = await request.formData();
  const photo = formData.get("photo");
  const favoriteColor = formData.get("favoriteColor");

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "Photo is required" }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.has(photo.type)) {
    return NextResponse.json(
      { error: "Photo must be a JPEG, PNG, or WEBP image" },
      { status: 400 }
    );
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 8MB)" }, { status: 400 });
  }

  const colorCheck = golferInputSchema.shape.favoriteColor.safeParse(favoriteColor);
  if (!colorCheck.success) {
    return NextResponse.json(
      { error: colorCheck.error.issues[0]?.message ?? "Pick a valid favorite color" },
      { status: 400 }
    );
  }

  try {
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const avatars = await generate8BitAvatarOptions(
      photoBuffer,
      photo.type,
      colorCheck.data,
      AVATAR_OPTION_COUNT
    );
    const dataUrls = avatars.map((buf) => `data:image/png;base64,${buf.toString("base64")}`);
    return NextResponse.json({ avatars: dataUrls });
  } catch (err) {
    console.error("Avatar generation failed", err);
    const message = err instanceof Error ? err.message : "Avatar generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
