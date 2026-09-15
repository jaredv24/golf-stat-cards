export const POSE_KEYS = ["swing", "putting", "reading-green", "looking-for-ball"] as const;
export type PoseKey = (typeof POSE_KEYS)[number];

export const POSE_LABELS: Record<PoseKey, string> = {
  swing: "Mid swing",
  putting: "Putting",
  "reading-green": "Reading the green",
  "looking-for-ball": "Looking for ball",
};

export const POSE_DESCRIPTIONS: Record<PoseKey, string> = {
  swing: "mid golf swing, club raised in a full swing follow-through",
  putting: "putting, crouched slightly over the ball on the green with a putter",
  "reading-green": "reading the green, crouched down studying the line to the hole",
  "looking-for-ball": "looking for their ball, hand shielding their eyes, scanning the rough",
};

export function isPoseKey(value: unknown): value is PoseKey {
  return typeof value === "string" && (POSE_KEYS as readonly string[]).includes(value);
}
