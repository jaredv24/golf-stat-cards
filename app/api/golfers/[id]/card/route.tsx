import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getGolfer } from "@/lib/store";
import { SKILLS, SKILL_LABELS, overallRating } from "@/lib/schema";

export const runtime = "nodejs";

const WIDTH = 800;
const BASE_HEIGHT = 1220;
const ANGER_ROW_HEIGHT = 40;
const PAGE_MARGIN = 20;
const OUTER_BORDER = 8;
const FRAME_PADDING = 10;
const INNER_BORDER = 2;
const INNER_PADDING = 28;
const CORNER_CLEARANCE = 28;
const INNER =
  WIDTH - 2 * (PAGE_MARGIN + OUTER_BORDER + FRAME_PADDING + INNER_BORDER + INNER_PADDING);
const AVATAR_WIDTH = Math.round((INNER * 2) / 3);
const AVATAR_HEIGHT = Math.round((AVATAR_WIDTH * 4) / 3);
const FONT_FAMILY = "Press Start 2P";
const FONT_PATH = path.join(process.cwd(), "lib", "assets", "press-start-2p.woff");
const SEGMENTS = 10;

const COLORS = {
  page: "#0d0d0d",
  surface: "#1a1a19",
  ink: "#ffffff",
  inkSecondary: "#c3c2b7",
  inkMuted: "#898781",
  accent: "#3987e5",
  track: "rgba(255,255,255,0.14)",
  hairline: "rgba(255,255,255,0.2)",
};

function cornerRank(ovr: number, flipped: boolean) {
  const position = flipped ? { bottom: 8, right: 8 } : { top: 8, left: 8 };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        position: "absolute",
        ...position,
        ...(flipped ? { transform: "rotate(180deg)" } : {}),
      }}
    >
      <div style={{ display: "flex", fontSize: 14, color: COLORS.ink }}>{ovr}</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", width: 12, height: 8, background: COLORS.accent }} />
        <div style={{ display: "flex", width: 4, height: 14, background: COLORS.inkSecondary }} />
      </div>
    </div>
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const golfer = await getGolfer(id);
  if (!golfer) {
    return new Response("Not found", { status: 404 });
  }

  const fontData = await readFile(FONT_PATH);
  const ovr = overallRating(golfer);
  const anger = golfer.anger;
  const height = anger !== undefined ? BASE_HEIGHT + ANGER_ROW_HEIGHT : BASE_HEIGHT;
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
          width: WIDTH,
          height,
          background: COLORS.page,
          padding: PAGE_MARGIN,
          fontFamily: FONT_FAMILY,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            background: COLORS.surface,
            border: `${OUTER_BORDER}px solid ${COLORS.ink}`,
            padding: FRAME_PADDING,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              position: "relative",
              border: `${INNER_BORDER}px solid ${COLORS.hairline}`,
              padding: INNER_PADDING,
              paddingTop: INNER_PADDING + CORNER_CLEARANCE,
            }}
          >
            {cornerRank(ovr, false)}
            {cornerRank(ovr, true)}

            <div style={{ display: "flex", width: INNER, justifyContent: "center" }}>
              <div
                style={{
                  display: "flex",
                  width: AVATAR_WIDTH,
                  height: AVATAR_HEIGHT,
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
              <div style={{ display: "flex", fontSize: 30, color: COLORS.ink, lineHeight: 1.4 }}>
                {golfer.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ display: "flex", fontSize: 14, color: COLORS.inkMuted }}>OVR</div>
                <div style={{ display: "flex", fontSize: 46, color: COLORS.ink, marginTop: 8 }}>
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
                    padding: "14px 8px",
                  }}
                >
                  <div style={{ display: "flex", fontSize: 14, color: COLORS.inkSecondary }}>
                    {item.label}
                  </div>
                  <div
                    style={{ display: "flex", fontSize: 22, color: COLORS.ink, marginTop: 12 }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", width: INNER, marginTop: 24 }}
            >
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
                      width: 260,
                      fontSize: 15,
                      lineHeight: 1.4,
                      color: COLORS.inkSecondary,
                    }}
                  >
                    {SKILL_LABELS[skill]}
                  </div>
                  <div style={{ display: "flex", flex: 1, gap: 2 }}>
                    {Array.from({ length: SEGMENTS }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flex: 1,
                          height: 16,
                          background: i < golfer[skill] ? COLORS.accent : COLORS.track,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: 28,
                      justifyContent: "flex-end",
                      fontSize: 16,
                      color: COLORS.ink,
                    }}
                  >
                    {golfer[skill]}
                  </div>
                </div>
              ))}
              {anger !== undefined && (
                <div
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
                      width: 260,
                      fontSize: 15,
                      lineHeight: 1.4,
                      color: COLORS.inkSecondary,
                    }}
                  >
                    Anger
                  </div>
                  <div style={{ display: "flex", flex: 1, gap: 2 }}>
                    {Array.from({ length: SEGMENTS }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flex: 1,
                          height: 16,
                          background: i < anger ? COLORS.accent : COLORS.track,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: 28,
                      justifyContent: "flex-end",
                      fontSize: 16,
                      color: COLORS.ink,
                    }}
                  >
                    {anger}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height,
      fonts: [{ name: FONT_FAMILY, data: fontData, weight: 400, style: "normal" }],
    }
  );
}
