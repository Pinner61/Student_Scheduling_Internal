import { describe, expect, it } from "vitest";
import {
  cellMapToRanges,
  formatWeeklyAvailabilityCopy,
  rangesToCellMap,
  cellKey,
} from "@/lib/schedule/cells";
import { generateSlotStarts } from "@/lib/utils/time";

const slots = generateSlotStarts("08:00", "12:00", 30);

describe("availability cells", () => {
  it("round-trips ranges through the cell map", () => {
    const ranges = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "11:00", workMode: "OFFICE" as const },
      { dayOfWeek: 1, startTime: "11:00", endTime: "12:00", workMode: "REMOTE" as const },
    ];
    const map = rangesToCellMap(ranges, slots, 30);
    expect(map[cellKey(1, "09:00")]).toBe("OFFICE");
    expect(map[cellKey(1, "11:00")]).toBe("REMOTE");
    expect(map[cellKey(1, "08:00")]).toBeUndefined();
    const back = cellMapToRanges(map, slots, 30);
    expect(back).toEqual(ranges);
  });

  it("formats a shareable weekly summary", () => {
    const text = formatWeeklyAvailabilityCopy([
      { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", workMode: "OFFICE" },
      { dayOfWeek: 1, startTime: "13:00", endTime: "16:00", workMode: "REMOTE" },
    ]);
    expect(text).toContain("Monday");
    expect(text).toContain("Office: 9:00 AM–12:00 PM");
    expect(text).toContain("Remote: 1:00 PM–4:00 PM");
    expect(text).toContain("Tuesday\nUnavailable");
  });
});
