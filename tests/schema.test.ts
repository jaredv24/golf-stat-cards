import { describe, expect, it } from "vitest";
import { golferInputSchema, overallRating } from "@/lib/schema";

describe("overallRating", () => {
  it("averages the six skill ratings with a handicap-derived rating", () => {
    // skills sum to 41 (8+6+7+9+5+6); handicap 10 -> rating 8; (41+8)/7 = 7
    const rating = overallRating({
      driving: 8,
      irons: 6,
      wedges: 7,
      putting: 9,
      pressure: 5,
      strength: 6,
      handicap: 10,
    });
    expect(rating).toBe(7);
  });

  it("keeps a fractional average", () => {
    // skills sum to 59; handicap 0 -> rating 10; (59+10)/7 = 9.857... -> 9.9
    const rating = overallRating({
      driving: 10,
      irons: 10,
      wedges: 10,
      putting: 10,
      pressure: 9,
      strength: 10,
      handicap: 0,
    });
    expect(rating).toBe(9.9);
  });

  it("floors the handicap-derived rating at 1 for a very high handicap", () => {
    // handicap 54 -> 10 - 54/5 = -0.8, clamped to 1; skills sum to 30; (30+1)/7 = 4.42... -> 4.4
    const rating = overallRating({
      driving: 5,
      irons: 5,
      wedges: 5,
      putting: 5,
      pressure: 5,
      strength: 5,
      handicap: 54,
    });
    expect(rating).toBe(4.4);
  });

  it("caps the handicap-derived rating at 10 for a plus handicap", () => {
    // handicap -10 -> 10 - (-10/5) = 12, clamped to 10; skills sum to 30; (30+10)/7 = 5.71... -> 5.7
    const rating = overallRating({
      driving: 5,
      irons: 5,
      wedges: 5,
      putting: 5,
      pressure: 5,
      strength: 5,
      handicap: -10,
    });
    expect(rating).toBe(5.7);
  });

  it("ignores an anger rating even when present", () => {
    // Same inputs as the first test (rating 7), plus a maxed-out anger stat
    // that must not move the result.
    const golfer = {
      driving: 8,
      irons: 6,
      wedges: 7,
      putting: 9,
      pressure: 5,
      strength: 6,
      handicap: 10,
      anger: 10,
    };
    expect(overallRating(golfer)).toBe(7);
  });
});

describe("golferInputSchema", () => {
  const validInput = {
    name: "Tiger W.",
    age: "34",
    height: "5'11\"",
    favoriteColor: "#3987e5",
    handicap: "12.4",
    driving: "8",
    irons: "7",
    wedges: "6",
    putting: "9",
    pressure: "5",
    strength: "6",
  };

  it("accepts valid form-data-shaped input, coercing numeric strings", () => {
    const result = golferInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.handicap).toBe(12.4);
      expect(result.data.driving).toBe(8);
      expect(result.data.age).toBe(34);
      expect(result.data.height).toBe("5'11\"");
      expect(result.data.favoriteColor).toBe("#3987e5");
    }
  });

  it("rejects a malformed favorite color", () => {
    const result = golferInputSchema.safeParse({ ...validInput, favoriteColor: "blue" });
    expect(result.success).toBe(false);
  });

  it("rejects a blank name", () => {
    const result = golferInputSchema.safeParse({ ...validInput, name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a blank height", () => {
    const result = golferInputSchema.safeParse({ ...validInput, height: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects an age that's too low", () => {
    const result = golferInputSchema.safeParse({ ...validInput, age: "3" });
    expect(result.success).toBe(false);
  });

  it("rejects an age that's too high", () => {
    const result = golferInputSchema.safeParse({ ...validInput, age: "150" });
    expect(result.success).toBe(false);
  });

  it("rejects a skill rating above 10", () => {
    const result = golferInputSchema.safeParse({ ...validInput, putting: "11" });
    expect(result.success).toBe(false);
  });

  it("rejects a skill rating below 1", () => {
    const result = golferInputSchema.safeParse({ ...validInput, driving: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer skill rating", () => {
    const result = golferInputSchema.safeParse({ ...validInput, irons: "5.5" });
    expect(result.success).toBe(false);
  });

  it("rejects a handicap outside the plausible range", () => {
    const result = golferInputSchema.safeParse({ ...validInput, handicap: "99" });
    expect(result.success).toBe(false);
  });

  it("is valid without an anger rating", () => {
    const result = golferInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.anger).toBeUndefined();
    }
  });

  it("accepts an optional anger rating and coerces it", () => {
    const result = golferInputSchema.safeParse({ ...validInput, anger: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.anger).toBe(10);
    }
  });

  it("rejects an anger rating outside 1-10 when provided", () => {
    const result = golferInputSchema.safeParse({ ...validInput, anger: "11" });
    expect(result.success).toBe(false);
  });
});
