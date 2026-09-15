import { NextResponse } from "next/server";
import { golferInputSchema } from "@/lib/schema";
import { generate8BitAvatar } from "@/lib/openai-image";
import { saveGolfer } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const photo = formData.get("photo");

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

  const parsed = golferInputSchema.safeParse({
    name: formData.get("name"),
    age: formData.get("age"),
    height: formData.get("height"),
    favoriteColor: formData.get("favoriteColor"),
    handicap: formData.get("handicap"),
    driving: formData.get("driving"),
    irons: formData.get("irons"),
    wedges: formData.get("wedges"),
    putting: formData.get("putting"),
    pressure: formData.get("pressure"),
    strength: formData.get("strength"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  let golfer;
  try {
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const avatar = await generate8BitAvatar(photoBuffer, photo.type, parsed.data.favoriteColor);
    golfer = await saveGolfer(parsed.data, avatar);
  } catch (err) {
    console.error("Failed to create golfer profile", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ golfer }, { status: 201 });
}
