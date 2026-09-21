import { describe, expect, it } from "vitest";
import { mergeAdjacentBlocks, rangesOverlap, timeToMinutes } from "@/lib/utils/time";

describe("time helpers", () => {
  it("detects overlapping and adjacent ranges", () => {
    expect(rangesOverlap("09:00", "12:00", "11:00", "13:00")).toBe(true);
    expect(rangesOverlap("09:00", "12:00", "12:00", "13:00")).toBe(false);
    expect(timeToMinutes("13:30")).toBe(810);
  });

  it("merges adjacent same-mode blocks", () => {
    const merged = mergeAdjacentBlocks([
      { startTime: "09:00", endTime: "10:00", workMode: "OFFICE" },
      { startTime: "10:00", endTime: "12:00", workMode: "OFFICE" },
      { startTime: "12:00", endTime: "13:00", workMode: "REMOTE" },
    ]);
    expect(merged).toEqual([
      { startTime: "09:00", endTime: "12:00", workMode: "OFFICE" },
      { startTime: "12:00", endTime: "13:00", workMode: "REMOTE" },
    ]);
  });
});
