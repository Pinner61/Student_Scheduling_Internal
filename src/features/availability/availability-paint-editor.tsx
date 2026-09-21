"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveAvailabilityAction } from "@/app/actions/scheduling";
import type { RecurringAvailability, WorkMode } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatTime12, generateSlotStarts } from "@/lib/utils/time";
import {
  WEEKDAYS,
  cellKey,
  cellMapToRanges,
  copyDayToDays,
  formatWeeklyAvailabilityCopy,
  rangesToCellMap,
  type PaintTool,
} from "@/lib/schedule/cells";
import { getDayName } from "@/lib/utils/time";
import { workModeCellClass, workModeLabel } from "@/components/schedule/schedule-language";

interface AvailabilityPaintEditorProps {
  initialRanges: RecurringAvailability[];
  workingDayStart: string;
  workingDayEnd: string;
  intervalMinutes?: number;
}

export function AvailabilityPaintEditor({
  initialRanges,
  workingDayStart,
  workingDayEnd,
  intervalMinutes = 30,
}: AvailabilityPaintEditorProps) {
  const slotStarts = useMemo(
    () => generateSlotStarts(workingDayStart, workingDayEnd, intervalMinutes),
    [workingDayStart, workingDayEnd, intervalMinutes]
  );
  const initialMap = useMemo(
    () => rangesToCellMap(initialRanges, slotStarts, intervalMinutes),
    [initialRanges, slotStarts, intervalMinutes]
  );
  const [cells, setCells] = useState<Record<string, WorkMode>>(initialMap);
  const [tool, setTool] = useState<PaintTool>("OFFICE");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySource, setCopySource] = useState(1);
  const [copyTargets, setCopyTargets] = useState<number[]>([2, 3, 4, 5]);
  const painting = useRef(false);

  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    function stopPaint() {
      painting.current = false;
    }
    window.addEventListener("pointerup", stopPaint);
    return () => window.removeEventListener("pointerup", stopPaint);
  }, []);

  const paintCell = useCallback((day: number, slot: string) => {
    setCells((prev) => {
      const key = cellKey(day, slot);
      const next = { ...prev };
      if (tool === "CLEAR") delete next[key];
      else next[key] = tool;
      return next;
    });
    setDirty(true);
  }, [tool]);

  async function handleSave() {
    setSaving(true);
    const ranges = cellMapToRanges(cells, slotStarts, intervalMinutes);
    const result = await saveAvailabilityAction(ranges);
    setSaving(false);
    if (result.error) {
      toast.error("We couldn’t save your availability. Your changes are still here. Try again.");
      return;
    }
    toast.success("Availability updated.");
    setDirty(false);
  }

  function handleDiscard() {
    setCells(initialMap);
    setDirty(false);
  }

  async function handleCopyWeekly() {
    const text = formatWeeklyAvailabilityCopy(cellMapToRanges(cells, slotStarts, intervalMinutes));
    await navigator.clipboard.writeText(text);
    toast.success("Weekly availability copied.");
  }

  function applyCopyDay() {
    setCells((prev) => copyDayToDays(prev, copySource, copyTargets, slotStarts));
    setDirty(true);
    setCopyOpen(false);
    toast.success(`Copied ${getDayName(copySource)} to selected days.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["OFFICE", "REMOTE", "CLEAR"] as PaintTool[]).map((item) => (
          <Button
            key={item}
            type="button"
            variant={tool === item ? "default" : "outline"}
            onClick={() => setTool(item)}
            aria-pressed={tool === item}
          >
            {item === "CLEAR" ? "Clear" : workModeLabel(item)}
          </Button>
        ))}
        <p className="w-full text-sm text-[var(--color-muted-foreground)] sm:ml-2 sm:w-auto">
          Choose Office, Remote, or Clear, then click or drag across the times you want to update.
        </p>
      </div>

      {dirty && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900" role="status">
          You have unsaved changes.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <div
          className="grid min-w-[720px] select-none"
          style={{ gridTemplateColumns: `4.5rem repeat(5, minmax(0, 1fr))` }}
          onPointerLeave={() => {
            painting.current = false;
          }}
        >
          <div className="sticky left-0 z-10 border-b bg-white px-2 py-2 text-xs font-medium">Time</div>
          {WEEKDAYS.map((day) => (
            <div key={day} className="border-b px-2 py-2 text-center text-sm font-semibold">
              {getDayName(day)}
            </div>
          ))}
          {slotStarts.map((slot) => (
            <div key={slot} className="contents">
              <div className="sticky left-0 z-10 border-t bg-white px-2 py-1 text-[11px] text-[var(--color-muted-foreground)]">
                {formatTime12(slot)}
              </div>
              {WEEKDAYS.map((day) => {
                const mode = cells[cellKey(day, slot)];
                const label = `${getDayName(day)} ${formatTime12(slot)} ${mode ? workModeLabel(mode) : "unavailable"}`;
                return (
                  <button
                    key={cellKey(day, slot)}
                    type="button"
                    aria-label={label}
                    className={cn(
                      "min-h-9 border-t border-l text-[11px] font-medium",
                      workModeCellClass(mode),
                      tool === "CLEAR" ? "cursor-cell" : "cursor-crosshair"
                    )}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      painting.current = true;
                      paintCell(day, slot);
                    }}
                    onPointerEnter={() => {
                      if (painting.current) paintCell(day, slot);
                    }}
                  >
                    {mode ? workModeLabel(mode) : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t bg-[var(--color-background)] py-4">
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save Availability"}
        </Button>
        <Button variant="secondary" onClick={handleDiscard} disabled={!dirty}>
          Discard Changes
        </Button>
        <Button variant="outline" onClick={handleCopyWeekly}>
          Copy Weekly Availability
        </Button>
        <Button variant="outline" onClick={() => setCopyOpen(true)}>
          Copy Monday to Other Days
        </Button>
      </div>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent onClose={() => setCopyOpen(false)}>
          <DialogHeader>
            <DialogTitle>Copy {getDayName(copySource)} to other days</DialogTitle>
            <DialogDescription>
              This replaces availability on the days you select. It does not save until you click Save Availability.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="block font-medium" htmlFor="copy-source">
              Copy from
            </label>
            <select
              id="copy-source"
              className="h-10 w-full rounded-md border px-3"
              value={copySource}
              onChange={(e) => setCopySource(Number(e.target.value))}
            >
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {getDayName(day)}
                </option>
              ))}
            </select>
            <p className="font-medium">Replace availability on</p>
            {WEEKDAYS.filter((d) => d !== copySource).map((day) => (
              <label key={day} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={copyTargets.includes(day)}
                  onChange={(e) => {
                    setCopyTargets((prev) =>
                      e.target.checked ? [...prev, day] : prev.filter((d) => d !== day)
                    );
                  }}
                />
                {getDayName(day)}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCopyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyCopyDay} disabled={copyTargets.length === 0}>
              Replace selected days
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
