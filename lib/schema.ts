import { z } from "zod";

export const SKILLS = ["driving", "irons", "wedges", "putting", "pressure", "strength"] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  driving: "Driving",
  irons: "Irons",
  wedges: "Wedges",
  putting: "Putting",
  pressure: "Under pressure",
  strength: "Strength",
};

const skillField = z.coerce
  .number()
  .int("Must be a whole number")
  .min(1, "Must be at least 1")
  .max(10, "Must be at most 10");

export const golferInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  age: z.coerce
    .number()
    .int("Must be a whole number")
    .min(5, "Age looks too low")
    .max(100, "Age looks too high"),
  height: z.string().trim().min(1, "Height is required").max(20, "Height is too long"),
  favoriteColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color"),
  handicap: z.coerce
    .number()
    .min(-10, "Handicap looks too low")
    .max(54, "Handicap looks too high"),
  driving: skillField,
  irons: skillField,
  wedges: skillField,
  putting: skillField,
  pressure: skillField,
  strength: skillField,
});

export type GolferInput = z.infer<typeof golferInputSchema>;

export interface GolferProfile extends GolferInput {
  id: string;
  avatarUrl: string;
  createdAt: string;
}

/** Maps a handicap onto the same 1-10 scale as the skill ratings (lower handicap = higher score). */
function handicapToRating(handicap: number): number {
  return Math.min(10, Math.max(1, 10 - handicap / 5));
}

/** Average of the skill ratings plus a handicap-derived rating, on a 1-10 scale. */
export function overallRating(golfer: Record<Skill, number> & { handicap: number }): number {
  const skillTotal = SKILLS.reduce((sum, skill) => sum + golfer[skill], 0);
  const total = skillTotal + handicapToRating(golfer.handicap);
  return Math.round((total / (SKILLS.length + 1)) * 10) / 10;
}
