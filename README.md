# 8-Bit Golf Stats

A simple tournament stat-card generator. A golfer uploads a photo, gets it
turned into a retro 8-bit pixel-art avatar, enters their handicap and a few
self-rated skills (driving, irons, wedges, putting, under pressure), and gets
a shareable stat card. The home page is a gallery of everyone who's signed up.

## Stack

Next.js 16 (App Router) + React 19 + Tailwind v4, [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
for storage (both the generated avatars and each golfer's profile JSON — no
database needed), and OpenAI's `gpt-image-1` for the 8-bit avatar generation.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables** — copy `.env.example` to `.env.local` and fill in:

   | Variable | Required | Notes |
   |---|---|---|
   | `OPENAI_API_KEY` | Yes | Used to generate each avatar. |
   | `OPENAI_IMAGE_MODEL` | No | Defaults to `gpt-image-1`. |
   | `BLOB_READ_WRITE_TOKEN` | Yes (local only) | On Vercel this is injected automatically once you attach Blob storage to the project — see below. For local dev, create a store at [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores) and copy its token. |

3. **Run locally**

   ```bash
   npm run dev
   ```

## Deploying (Vercel)

1. Import the repo into Vercel.
2. **Storage → Create Database → Blob** and connect it to the project — this
   sets `BLOB_READ_WRITE_TOKEN` automatically, nothing to copy by hand.
3. Add `OPENAI_API_KEY` under Project Settings → Environment Variables.
4. Deploy. That's it — no database to provision.

## How it's put together

- `app/new` — the sign-up form (photo, name, handicap, five 1–10 skill sliders).
- `app/api/golfers/route.ts` — validates the submission, calls OpenAI to turn
  the photo into an 8-bit avatar, saves the avatar + profile to Blob storage.
- `app/golfer/[id]` — a golfer's shareable stat card.
- `app/page.tsx` — the tournament roster / gallery, listing every golfer.
- `lib/store.ts` — all persistence, backed by Vercel Blob (`list`/`put`, no DB).
- `lib/openai-image.ts` — the avatar generation call.

## Cost

For a single tournament's worth of golfers this runs close to free:

- **Avatar generation**: `gpt-image-1` at low quality is roughly $0.02–$0.05
  per image. 100 golfers ≈ a few dollars, one time.
- **Hosting + storage**: comfortably inside Vercel's free tier for a
  tournament-sized roster (dozens to a few hundred people).
- **No database cost** — profiles are small JSON blobs stored alongside the
  avatars.

## Notes

- There's no authentication — anyone with the link can add a profile or view
  the roster. Fine for a single tournament shared via a link; add gating if
  that's not the right fit for your event.
- Photos are resized/re-encoded client-side before upload (~1280px JPEG) to
  keep uploads fast on course wifi and stay under serverless request-size
  limits.
