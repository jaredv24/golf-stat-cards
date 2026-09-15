# US Bropen Profile Builder

A simple tournament stat-card generator. A golfer uploads a photo, picks
their favorite of 3 AI-generated character avatars (styled to match a
reference art style, with a shirt in their favorite color), enters their
age, height, handicap, and self-rated skills (driving, irons, wedges,
putting, under pressure, strength), and gets a stat card they can download
straight to their phone's Photos app. The overall rating (OVR) averages all
six skills together with a rating derived from handicap.

## Stack

Next.js 16 (App Router) + React 19 + Tailwind v4, [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
for storage (both the chosen avatar and each golfer's profile JSON — no
database needed), OpenAI's `gpt-image-2.5-sunburst` for avatar generation
(given the person's photo and a bundled style-reference image), and
`next/og`'s `ImageResponse` (Satori) to render the downloadable card
entirely server-side — no browser involved in producing that PNG, so it
doesn't depend on any particular browser's canvas/SVG support.

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
   to the project (make sure the "read-write token env var" option is
   checked, and pick public access). This sets `BLOB_READ_WRITE_TOKEN`
   automatically — nothing to copy by hand.
5. Redeploy (Vercel does this automatically after you attach storage, or
   trigger it from the Deployments tab). That's the whole setup — no database
   to provision, no other config.

**If you add or change an environment variable after the first deploy**,
Vercel snapshots env vars per-deployment — an already-running deployment
won't pick up the change. You need a new deployment (Deployments tab →
latest → "⋯" → Redeploy, or just push a commit) *after* saving the variable.

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Required | Notes |
   |---|---|---|
   | `OPENAI_API_KEY` | Yes | Used to generate avatar options. |
   | `OPENAI_IMAGE_MODEL` | No | Defaults to `gpt-image-2.5-sunburst`. |
   | `BLOB_READ_WRITE_TOKEN` | Yes | Create a store at [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores) and copy its token. |

3. `npm run dev`

## How it's put together

- `app/page.tsx` — the sign-up form (photo, name, age, height, favorite
  color, handicap, six 1–10 skill sliders).
- `app/api/golfers/generate/route.ts` — validates the photo + favorite
  color, calls OpenAI once (with `n: 3`) to generate three avatar options
  from the photo plus `lib/assets/style-reference.png`, returns them as data
  URLs. Nothing is saved yet at this point.
- `app/api/golfers/route.ts` — takes the full form data plus the avatar the
  user picked (as a data URL) and saves the profile + avatar to Blob
  storage.
- `app/golfer/[id]` — a golfer's stat card (`StatCard`) plus a download
  button (`CardCapture`).
- `app/api/golfers/[id]/card/route.tsx` — renders the same card layout as
  `StatCard` as a standalone PNG, server-side, for `CardCapture` to fetch
  and download/share.
- `lib/store.ts` — all persistence, backed by Vercel Blob (`list`/`put`, no DB).
- `lib/openai-image.ts` — the avatar generation call and prompt.

## Cost

For a single tournament's worth of golfers this runs close to free:

- **Avatar generation**: at low quality, roughly $0.02–$0.06 for the 3
  options generated per golfer (token-based pricing, varies a bit with
  image size). 100 golfers ≈ a few dollars, one time.
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
- The server-rendered card (`app/api/golfers/[id]/card`) duplicates the
  visual layout in `StatCard.tsx` rather than sharing it — Satori's
  constrained CSS subset means the two can't just share a component. Keep
  both in sync when tweaking the card's design.
