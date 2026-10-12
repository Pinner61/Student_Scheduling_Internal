"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
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
import { formatTime12, generateSlotStarts, getDayName } from "@/lib/utils/time";
import {
  WEEKDAYS,
  cellKey,
  cellMapToRanges,
  formatWeeklyAvailabilityCopy,
  rangesToCellMap,
  type PaintTool,
} from "@/lib/schedule/cells";
import { workModeCellClass, workModeLabel } from "@/components/schedule/schedule-language";

interface AvailabilityPaintEditorProps {
  initialRanges: RecurringAvailability[];
  workingDayStart: string;
  workingDayEnd: string;
  intervalMinutes?: number;
  readOnly?: boolean;
}

export function AvailabilityPaintEditor({
  initialRanges,
  workingDayStart,
  workingDayEnd,
  intervalMinutes = 30,
  readOnly = false,
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
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const painting = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

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

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dirtyRef.current) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(anchor.href);
      setLeaveOpen(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const isNoOp = useCallback(
    (day: number, slot: string) => {
      const current = cells[cellKey(day, slot)];
      if (tool === "CLEAR") return !current;
      return current === tool;
    },
    [cells, tool]
  );

  const paintCell = useCallback(
    (day: number, slot: string) => {
      setCells((prev) => {
        const key = cellKey(day, slot);
        const next = { ...prev };
        if (tool === "CLEAR") delete next[key];
        else next[key] = tool;
        return next;
      });
      setDirty(true);
    },
    [tool]
  );

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

  async function handleShare() {
    const text = formatWeeklyAvailabilityCopy(cellMapToRanges(cells, slotStarts, intervalMinutes));
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Couldn’t copy to the clipboard. Try again from a secure browser window.");
    }
  }

  function confirmLeave() {
    if (pendingHref) window.location.assign(pendingHref);
    setLeaveOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Schedule tool</p>
        <div
          className="inline-flex flex-wrap rounded-lg border bg-white p-1 shadow-sm"
          role="radiogroup"
          aria-label="Availability tool"
        >
          {(["OFFICE", "REMOTE", "CLEAR"] as PaintTool[]).map((item) => {
            const selected = tool === item;
            return (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTool(item)}
                className={cn(
                  "min-w-24 shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition-all",
                  item === "OFFICE" && selected && "bg-sky-600 text-white shadow",
                  item === "REMOTE" && selected && "bg-violet-600 text-white shadow",
                  item === "CLEAR" && selected && "bg-stone-700 text-white shadow",
                  !selected && "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                {item === "CLEAR" ? "Clear" : workModeLabel(item)}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {tool === "CLEAR"
            ? "Clear is selected. Click or drag across times to remove availability."
            : `${workModeLabel(tool)} is selected. Click or drag across the times you want to update.`}
        </p>
      </div>

      {dirty && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900" role="status">
          You have unsaved changes.
        </div>
      )}

      <div
        data-testid="availability-grid-scroller"
        className="min-w-0 overflow-auto rounded-lg border bg-white md:max-h-[min(70dvh,calc(100dvh-18rem))]"
      >
        <div
          className="grid w-max min-w-full select-none"
          style={{ gridTemplateColumns: `minmax(4.75rem, 4.75rem) repeat(5, minmax(8rem, 1fr))` }}
          onPointerLeave={() => {
            painting.current = false;
          }}
        >
          <div className="sticky left-0 z-10 h-10 shrink-0 border-b bg-white px-2 py-2 text-xs font-medium">
            Time
          </div>
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="h-10 min-w-[8rem] shrink-0 border-b px-2 py-2 text-center text-sm font-semibold"
            >
              {getDayName(day)}
            </div>
          ))}
          {slotStarts.map((slot) => (
            <div key={slot} className="contents">
              <div className="sticky left-0 z-10 flex h-10 min-h-10 shrink-0 items-center border-t bg-white px-2 text-[11px] text-[var(--color-muted-foreground)]">
                {formatTime12(slot)}
              </div>
              {WEEKDAYS.map((day) => {
                const mode = cells[cellKey(day, slot)];
                const key = cellKey(day, slot);
                const label = `${getDayName(day)} ${formatTime12(slot)} ${mode ? workModeLabel(mode) : "unavailable"}`;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={label}
                    className={cn(
                      "h-10 min-h-10 min-w-[8rem] shrink-0 border-t border-l text-[11px] font-medium",
                      workModeCellClass(mode),
                      tool === "CLEAR" ? "cursor-cell" : "cursor-crosshair",
                      flashKey === key && "animate-cell-pulse"
                    )}
                    onPointerDown={(e) => {
                      if (readOnly) return;
                      e.preventDefault();
                      painting.current = true;
                      if (isNoOp(day, slot)) {
                        setFlashKey(key);
                        window.setTimeout(() => setFlashKey((current) => (current === key ? null : current)), 280);
                        return;
                      }
                      paintCell(day, slot);
                    }}
                    onClick={(e) => {
                      if (readOnly) return;
                      if (e.detail !== 0) return;
                      if (isNoOp(day, slot)) {
                        setFlashKey(key);
                        window.setTimeout(() => setFlashKey((current) => (current === key ? null : current)), 280);
                        return;
                      }
                      paintCell(day, slot);
                    }}
                    onPointerEnter={() => {
                      if (readOnly) return;
                      if (painting.current && !isNoOp(day, slot)) paintCell(day, slot);
                    }}
                    onKeyDown={(e) => {
                      if (readOnly) return;
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        paintCell(day, slot);
                      }
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

      <div
        data-testid="availability-action-bar"
        className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--color-border)] bg-[var(--color-background)] pt-3"
      >
        <Button onClick={handleSave} disabled={saving || !dirty || readOnly}>
          {saving ? "Saving…" : "Save Availability"}
        </Button>
        <Button variant="secondary" onClick={handleDiscard} disabled={!dirty || readOnly}>
          Discard Changes
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share availability in text
        </Button>
      </div>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent onClose={() => setLeaveOpen(false)}>
          <DialogHeader>
            <DialogTitle>You have unsaved changes. Leave without saving?</DialogTitle>
            <DialogDescription>
              If you leave now, the availability edits on this page will be discarded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLeaveOpen(false)}>
              Stay and continue editing
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Leave without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
