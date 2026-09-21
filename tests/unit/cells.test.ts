import { describe, expect, it } from "vitest";
import {
  cellMapToRanges,
  formatWeeklyAvailabilityCopy,
  rangesToCellMap,
  copyDayToDays,
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

  it("formats a copy-paste weekly summary", () => {
    const text = formatWeeklyAvailabilityCopy([
      { dayOfWeek: 1, startTime: "10:00", endTime: "13:00", workMode: "OFFICE" },
    ]);
    expect(text).toContain("Monday: 10:00 AM–1:00 PM Office");
    expect(text).toContain("Tuesday: Unavailable");
  });

  it("copies a day onto other days", () => {
    const map = rangesToCellMap(
      [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00", workMode: "OFFICE" }],
      slots,
      30
    );
    const copied = copyDayToDays(map, 1, [2], slots);
    expect(copied[cellKey(2, "09:00")]).toBe("OFFICE");
  });
});
