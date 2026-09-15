import Image from "next/image";
import { SKILLS, SKILL_LABELS, overallRating, type GolferProfile } from "@/lib/schema";

export function StatCard({ golfer }: { golfer: GolferProfile }) {
  const ovr = overallRating(golfer);

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg border-4 border-hairline bg-surface p-4 shadow-[6px_6px_0_0_rgba(0,0,0,0.4)]">
      <div className="relative mx-auto aspect-[3/4] w-2/3 overflow-hidden rounded border-2 border-hairline">
        <Image
          src={golfer.avatarUrl}
          alt={`${golfer.name}'s 8-bit avatar`}
          fill
          sizes="256px"
          priority
          className="object-cover [image-rendering:pixelated]"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="break-words text-lg font-semibold text-ink">{golfer.name}</h1>
        <div className="shrink-0 text-right">
          <div className="font-pixel text-[8px] tracking-wide text-ink-muted">OVR</div>
          <div className="text-3xl font-bold text-ink">{ovr}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded border border-hairline px-2 py-2 text-center">
          <div className="text-[10px] text-ink-secondary">Age</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-ink">{golfer.age}</div>
        </div>
        <div className="rounded border border-hairline px-2 py-2 text-center">
          <div className="text-[10px] text-ink-secondary">Height</div>
          <div className="mt-1 text-lg font-semibold text-ink">{golfer.height}</div>
        </div>
        <div className="rounded border border-hairline px-2 py-2 text-center">
          <div className="text-[10px] text-ink-secondary">Handicap</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-ink">{golfer.handicap}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {SKILLS.map((skill) => (
          <div key={skill} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[9px] leading-tight text-ink-secondary">
              {SKILL_LABELS[skill]}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-track">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(golfer[skill] / 10) * 100}%` }}
              />
            </div>
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink">
              {golfer[skill]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
