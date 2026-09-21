import type { ScheduleBlock } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatTimeRange, getDayName } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

interface ScheduleBlockListProps {
  blocks: ScheduleBlock[];
  showDay?: boolean;
  highlightDate?: string;
  emptyMessage?: string;
}

export function ScheduleBlockList({
  blocks,
  showDay = false,
  highlightDate,
  emptyMessage = "No scheduled work periods.",
}: ScheduleBlockListProps) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">{emptyMessage}</p>
    );
  }

  return (
    <ul className="space-y-2" role="list">
      {blocks.map((block, i) => {
        const isToday = highlightDate === block.date;
        return (
          <li
            key={`${block.date}-${block.startTime}-${i}`}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm",
              isToday && "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
            )}
          >
            {showDay && (
              <span className="font-medium min-w-[80px]">{getDayName(block.dayOfWeek)}</span>
            )}
            <span>{formatTimeRange(block.startTime, block.endTime)}</span>
            <Badge variant={block.workMode === "OFFICE" ? "office" : "remote"}>
              {block.workMode === "OFFICE" ? "Office" : "Remote"}
            </Badge>
            {block.source === "exception" && (
              <Badge variant="warning">Exception</Badge>
            )}
          </li>
        );
      })}
    </ul>
  );
}
