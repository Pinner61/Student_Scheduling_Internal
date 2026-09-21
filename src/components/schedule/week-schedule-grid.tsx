import type { ScheduleBlock } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatTime12, generateSlotStarts, getShortDayName, minutesToTime, timeToMinutes } from "@/lib/utils/time";
import { WEEKDAYS } from "@/lib/schedule/cells";
import { workModeCellClass, workModeLabel } from "@/components/schedule/schedule-language";

interface WeekScheduleGridProps {
  weekDates: string[];
  scheduleByDate: Map<string, ScheduleBlock[]>;
  workingDayStart: string;
  workingDayEnd: string;
  intervalMinutes?: number;
  today?: string;
}

function modeAt(blocks: ScheduleBlock[], slot: string, interval: number): ScheduleBlock | undefined {
  const slotEnd = minutesToTime(timeToMinutes(slot) + interval);
  return blocks.find(
    (b) => timeToMinutes(b.startTime) <= timeToMinutes(slot) && timeToMinutes(b.endTime) >= timeToMinutes(slotEnd)
  );
}

export function WeekScheduleGrid({
  weekDates,
  scheduleByDate,
  workingDayStart,
  workingDayEnd,
  intervalMinutes = 30,
  today,
}: WeekScheduleGridProps) {
  const slots = generateSlotStarts(workingDayStart, workingDayEnd, intervalMinutes);
  const dates = weekDates.filter((d) => {
    const day = new Date(`${d}T12:00:00`).getDay();
    return WEEKDAYS.includes(day as (typeof WEEKDAYS)[number]);
  });

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `4.5rem repeat(${dates.length}, minmax(0, 1fr))` }}
      >
        <div className="sticky left-0 z-10 border-b bg-white px-2 py-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          Time
        </div>
        {dates.map((date) => {
          const day = new Date(`${date}T12:00:00`).getDay();
          const isToday = date === today;
          return (
            <div
              key={date}
              className={cn(
                "border-b px-2 py-2 text-center text-xs font-semibold",
                isToday && "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
              )}
            >
              {getShortDayName(day)}
              <div className="font-normal text-[var(--color-muted-foreground)]">
                {date.slice(5).replace("-", "/")}
              </div>
            </div>
          );
        })}
        {slots.map((slot) => (
          <div key={`row-${slot}`} className="contents">
            <div className="sticky left-0 z-10 border-t bg-white px-2 py-1 text-[11px] text-[var(--color-muted-foreground)]">
              {formatTime12(slot)}
            </div>
            {dates.map((date) => {
              const block = modeAt(scheduleByDate.get(date) ?? [], slot, intervalMinutes);
              const isStart = block && block.startTime === slot;
              return (
                <div
                  key={`${date}-${slot}`}
                  className={cn(
                    "min-h-8 border-t border-l px-1 py-1 text-center text-[11px] font-medium",
                    workModeCellClass(block?.workMode)
                  )}
                  title={
                    block
                      ? `${workModeLabel(block.workMode)} ${formatTime12(block.startTime)}–${formatTime12(block.endTime)}`
                      : "Unavailable"
                  }
                >
                  {isStart ? workModeLabel(block.workMode) : block ? "" : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
