import { describe, expect, it } from "vitest";
import { golferInputSchema, overallRating } from "@/lib/schema";

describe("overallRating", () => {
  it("averages the five skill ratings to one decimal place", () => {
    const rating = overallRating({
      driving: 8,
      irons: 6,
      wedges: 7,
      putting: 9,
      pressure: 5,
    });
    expect(rating).toBe(7);
  });

  it("keeps a fractional average", () => {
    const rating = overallRating({
      driving: 10,
      irons: 10,
      wedges: 10,
      putting: 10,
      pressure: 9,
    });
    expect(rating).toBe(9.8);
  });
});

describe("golferInputSchema", () => {
  const validInput = {
    name: "Tiger W.",
    handicap: "12.4",
    driving: "8",
    irons: "7",
    wedges: "6",
    putting: "9",
    pressure: "5",
  };

  it("accepts valid form-data-shaped input, coercing numeric strings", () => {
    const result = golferInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.handicap).toBe(12.4);
      expect(result.data.driving).toBe(8);
    }
  });

  it("rejects a blank name", () => {
    const result = golferInputSchema.safeParse({ ...validInput, name: "  " });
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
});
