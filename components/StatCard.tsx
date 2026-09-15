import Image from "next/image";
import { SKILLS, SKILL_LABELS, overallRating, type GolferProfile } from "@/lib/schema";

const SEGMENTS = 10;

function CornerRank({ ovr, flipped }: { ovr: number; flipped?: boolean }) {
  return (
    <div
      className={`absolute z-10 flex flex-col items-start gap-1 ${
        flipped ? "bottom-2 right-2 rotate-180" : "left-2 top-2"
      }`}
    >
      <span className="font-pixel text-[10px] leading-none text-ink">{ovr}</span>
      <div className="flex flex-col items-start">
        <div className="h-[6px] w-[9px] bg-accent" />
        <div className="h-[10px] w-[3px] bg-ink-secondary" />
      </div>
    </div>
  );
}

export function StatCard({ golfer }: { golfer: GolferProfile }) {
  const ovr = overallRating(golfer);

  return (
    <div className="mx-auto w-full max-w-sm border-4 border-ink bg-surface p-1.5 shadow-[6px_6px_0_0_rgba(0,0,0,0.45)]">
      <div className="relative border-2 border-hairline p-4 pt-8 pb-8">
        <CornerRank ovr={ovr} />
        <CornerRank ovr={ovr} flipped />

        <div className="relative mx-auto aspect-[3/4] w-2/3 overflow-hidden border-2 border-hairline">
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
          <div className="border border-hairline px-2 py-2 text-center">
            <div className="text-[10px] text-ink-secondary">Age</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-ink">{golfer.age}</div>
          </div>
          <div className="border border-hairline px-2 py-2 text-center">
            <div className="text-[10px] text-ink-secondary">Height</div>
            <div className="mt-1 text-lg font-semibold text-ink">{golfer.height}</div>
          </div>
          <div className="border border-hairline px-2 py-2 text-center">
            <div className="text-[10px] text-ink-secondary">Handicap</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-ink">
              {golfer.handicap}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {SKILLS.map((skill) => (
            <div key={skill} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[9px] leading-tight text-ink-secondary">
                {SKILL_LABELS[skill]}
              </span>
              <div className="flex flex-1 gap-[2px]">
                {Array.from({ length: SEGMENTS }, (_, i) => (
                  <div
                    key={i}
                    className={`h-3 flex-1 ${i < golfer[skill] ? "bg-accent" : "bg-track"}`}
                  />
                ))}
              </div>
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink">
                {golfer[skill]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
