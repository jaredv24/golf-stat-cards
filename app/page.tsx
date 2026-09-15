import Link from "next/link";
import Image from "next/image";
import { listGolfers } from "@/lib/store";
import { overallRating } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const golfers = await listGolfers();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-pixel text-xs leading-relaxed text-ink sm:text-sm">
          Tournament roster
        </h1>
        <Link
          href="/new"
          className="rounded bg-accent px-4 py-3 font-pixel text-[10px] text-ink transition hover:bg-accent-strong"
        >
          + Add me
        </Link>
      </div>

      {golfers.length === 0 ? (
        <p className="text-ink-secondary">
          No golfers yet.{" "}
          <Link href="/new" className="text-accent underline underline-offset-2">
            Be the first
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {golfers.map((golfer) => (
            <Link
              key={golfer.id}
              href={`/golfer/${golfer.id}`}
              className="rounded border-2 border-hairline bg-surface p-2 transition hover:border-accent"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded">
                <Image
                  src={golfer.avatarUrl}
                  alt={golfer.name}
                  fill
                  sizes="200px"
                  className="object-cover [image-rendering:pixelated]"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-ink">{golfer.name}</span>
                <span className="shrink-0 text-xs font-semibold text-accent">
                  {overallRating(golfer)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
