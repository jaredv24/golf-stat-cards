import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getGolfer } from "@/lib/store";
import { SKILLS, SKILL_LABELS, overallRating } from "@/lib/schema";

export const runtime = "nodejs";

const WIDTH = 800;
const HEIGHT = 1180;
const PADDING = 32;
const INNER = WIDTH - PADDING * 2;
const AVATAR_WIDTH = Math.round((INNER * 2) / 3);
const AVATAR_HEIGHT = Math.round((AVATAR_WIDTH * 4) / 3);
const FONT_FAMILY = "Press Start 2P";
const FONT_PATH = path.join(process.cwd(), "lib", "assets", "press-start-2p.woff");

const COLORS = {
  surface: "#1a1a19",
  ink: "#ffffff",
  inkSecondary: "#c3c2b7",
  inkMuted: "#898781",
  accent: "#3987e5",
  track: "rgba(255,255,255,0.14)",
  hairline: "rgba(255,255,255,0.2)",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const golfer = await getGolfer(id);
  if (!golfer) {
    return new Response("Not found", { status: 404 });
  }

  const fontData = await readFile(FONT_PATH);
  const ovr = overallRating(golfer);
  const bioItems = [
    { label: "Age", value: String(golfer.age) },
    { label: "Height", value: golfer.height },
    { label: "Handicap", value: String(golfer.handicap) },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: WIDTH,
          height: HEIGHT,
          background: COLORS.surface,
          padding: PADDING,
          fontFamily: FONT_FAMILY,
        }}
      >
        <div style={{ display: "flex", width: INNER, justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              width: AVATAR_WIDTH,
              height: AVATAR_HEIGHT,
              borderRadius: 10,
              overflow: "hidden",
              border: `4px solid ${COLORS.hairline}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori image element, not a browser <img> */}
            <img
              src={golfer.avatarUrl}
              width={AVATAR_WIDTH}
              height={AVATAR_HEIGHT}
              alt=""
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: INNER,
            marginTop: 26,
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, color: COLORS.ink, lineHeight: 1.4 }}>
            {golfer.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 12, color: COLORS.inkMuted }}>OVR</div>
            <div style={{ display: "flex", fontSize: 40, color: COLORS.ink, marginTop: 6 }}>
              {ovr}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", width: INNER, marginTop: 20, gap: 12 }}>
          {bioItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                border: `2px solid ${COLORS.hairline}`,
                borderRadius: 8,
                padding: "14px 8px",
              }}
            >
              <div style={{ display: "flex", fontSize: 11, color: COLORS.inkSecondary }}>
                {item.label}
              </div>
              <div style={{ display: "flex", fontSize: 18, color: COLORS.ink, marginTop: 10 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: INNER, marginTop: 24 }}>
          {SKILLS.map((skill) => (
            <div
              key={skill}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 210,
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: COLORS.inkSecondary,
                }}
              >
                {SKILL_LABELS[skill]}
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  height: 14,
                  borderRadius: 999,
                  background: COLORS.track,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: `${(golfer[skill] / 10) * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: COLORS.accent,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  width: 24,
                  justifyContent: "flex-end",
                  fontSize: 14,
                  color: COLORS.ink,
                }}
              >
                {golfer[skill]}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: FONT_FAMILY, data: fontData, weight: 400, style: "normal" }],
    }
  );
}
