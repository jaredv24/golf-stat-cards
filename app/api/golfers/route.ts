import { NextResponse } from "next/server";
import { golferInputSchema } from "@/lib/schema";
import { saveGolfer } from "@/lib/store";

export const runtime = "nodejs";

const AVATAR_DATA_URL_PATTERN = /^data:image\/png;base64,([A-Za-z0-9+/]+=*)$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { avatarDataUrl, ...fields } = body as Record<string, unknown>;

  const parsed = golferInputSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const match =
    typeof avatarDataUrl === "string" ? avatarDataUrl.match(AVATAR_DATA_URL_PATTERN) : null;
  if (!match) {
    return NextResponse.json({ error: "Pick an avatar first" }, { status: 400 });
  }
  const avatar = Buffer.from(match[1], "base64");

  let golfer;
  try {
    golfer = await saveGolfer(parsed.data, avatar);
  } catch (err) {
    console.error("Failed to save golfer profile", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ golfer }, { status: 201 });
}
