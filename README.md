# US Bropen Profile Builder

A simple tournament stat-card generator. A golfer uploads a photo, gets it
turned into a retro 8-bit pixel-art avatar, enters their age, height,
handicap, and self-rated skills (driving, irons, wedges, putting, under
pressure, strength), and gets a stat card they can download straight to
their phone's Photos app. The overall rating (OVR) averages all six skills
together with a rating derived from handicap.

## Stack

Next.js 16 (App Router) + React 19 + Tailwind v4, [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
for storage (both the generated avatar and each golfer's profile JSON — no
database needed), and OpenAI's `gpt-image-1` for the 8-bit avatar generation.
The stat card is exported client-side with `html-to-image`, so the download
is a pixel-perfect PNG of the card exactly as rendered on screen.

## Go live

This repo already exists in your GitHub account, so import it directly —
don't use a Vercel "clone/template" deploy button here, it'll try to create a
second repo with the same name and collide.

1. Go to [vercel.com/new](https://vercel.com/new), connect GitHub if prompted,
   and **Import** `golf-stat-cards` from the repository list.
2. On the configuration screen, expand **Environment Variables** and add
   `OPENAI_API_KEY` with your key. Leave the build settings as detected.
3. Click **Deploy**.
4. Once the project exists: **Storage → Create Database → Blob**, connect it
   to the project. This sets `BLOB_READ_WRITE_TOKEN` automatically — nothing
   to copy by hand.
5. Redeploy (Vercel does this automatically after you attach storage, or
   trigger it from the Deployments tab). That's the whole setup — no database
   to provision, no other config.

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Required | Notes |
   |---|---|---|
   | `OPENAI_API_KEY` | Yes | Used to generate each avatar. |
   | `OPENAI_IMAGE_MODEL` | No | Defaults to `gpt-image-1`. |
   | `BLOB_READ_WRITE_TOKEN` | Yes | Create a store at [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores) and copy its token. |

3. `npm run dev`

## How it's put together

- `app/page.tsx` — the sign-up form (photo, name, handicap, five 1–10 skill sliders).
- `app/api/golfers/route.ts` — validates the submission, calls OpenAI to turn
  the photo into an 8-bit avatar, saves the avatar + profile to Blob storage.
- `app/golfer/[id]` — a golfer's stat card, wrapped in `CardCapture`.
- `components/CardCapture.tsx` — client component that snapshots the card DOM
  node to a PNG and either opens the native share sheet (mobile — includes a
  direct "Save Image" action into Photos) or falls back to a plain file
  download (desktop).
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

- There's no authentication and no roster/gallery page — this is a
  fill-in-and-download tool. Anyone with the link to a golfer's card can view
  it; anyone with the site link can create one. Fine for a link shared with
  your tournament group.
- Photos are resized/re-encoded client-side before upload (~1280px JPEG) to
  keep uploads fast on course wifi and stay under serverless request-size
  limits.
