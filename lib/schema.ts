import { z } from "zod";

export const SKILLS = ["driving", "irons", "wedges", "putting", "pressure"] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  driving: "Driving",
  irons: "Irons",
  wedges: "Wedges",
  putting: "Putting",
  pressure: "Under pressure",
};

const skillField = z.coerce
  .number()
  .int("Must be a whole number")
  .min(1, "Must be at least 1")
  .max(10, "Must be at most 10");

export const golferInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  handicap: z.coerce
    .number()
    .min(-10, "Handicap looks too low")
    .max(54, "Handicap looks too high"),
  driving: skillField,
  irons: skillField,
  wedges: skillField,
  putting: skillField,
  pressure: skillField,
});

export type GolferInput = z.infer<typeof golferInputSchema>;

export interface GolferProfile extends GolferInput {
  id: string;
  avatarUrl: string;
  createdAt: string;
}

/** Average of the five skill ratings, kept on the same 1-10 scale as its inputs. */
export function overallRating(golfer: Record<Skill, number>): number {
  const total = SKILLS.reduce((sum, skill) => sum + golfer[skill], 0);
  return Math.round((total / SKILLS.length) * 10) / 10;
}
