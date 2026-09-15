import { put, list } from "@vercel/blob";
import { nanoid } from "nanoid";
import type { GolferInput, GolferProfile } from "./schema";

function profilePath(id: string) {
  return `golfers/${id}/profile.json`;
}

function avatarPath(id: string) {
  return `golfers/${id}/avatar.png`;
}

export async function saveGolfer(input: GolferInput, avatar: Buffer): Promise<GolferProfile> {
  const id = nanoid(10);

  const avatarBlob = await put(avatarPath(id), avatar, {
    access: "public",
    contentType: "image/png",
  });

  const profile: GolferProfile = {
    ...input,
    id,
    avatarUrl: avatarBlob.url,
    createdAt: new Date().toISOString(),
  };

  await put(profilePath(id), JSON.stringify(profile), {
    access: "public",
    contentType: "application/json",
  });

  return profile;
}

export async function getGolfer(id: string): Promise<GolferProfile | null> {
  const { blobs } = await list({ prefix: profilePath(id) });
  const match = blobs.find((b) => b.pathname === profilePath(id));
  if (!match) return null;

  const res = await fetch(match.url, { cache: "no-store" });
  return (await res.json()) as GolferProfile;
}
