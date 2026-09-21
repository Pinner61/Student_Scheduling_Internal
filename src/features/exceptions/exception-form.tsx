"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { submitExceptionAction } from "@/app/actions/scheduling";
import type { ExceptionType, RecurringAvailability, ScheduleException } from "@/types";
import { previewExceptionOnDate } from "@/lib/schedule/engine";
import { formatTimeRange } from "@/lib/utils/time";
import { EXCEPTION_TYPE_LABEL } from "@/components/schedule/schedule-language";

interface ExceptionFormProps {
  recurring: RecurringAvailability[];
}

export function ExceptionForm({ recurring }: ExceptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [exceptionType, setExceptionType] = useState<ExceptionType>("UNAVAILABLE");
  const [exceptionDate, setExceptionDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [replacementMode, setReplacementMode] = useState<"OFFICE" | "REMOTE">("OFFICE");

  const preview = useMemo(() => {
    if (!exceptionDate || !startTime || !endTime) return null;
    const draft: ScheduleException = {
      id: "preview",
      userId: "self",
      exceptionDate,
      startTime,
      endTime,
      exceptionType,
      replacementMode: exceptionType === "ALTERNATE_AVAILABILITY" ? replacementMode : null,
      reason: null,
      status: "APPROVED",
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const day = new Date(`${exceptionDate}T12:00:00`).getDay();
    const normal = recurring.filter((r) => r.dayOfWeek === day);
    const result = previewExceptionOnDate(recurring, [], draft, exceptionDate);
    return { normal, result };
  }, [exceptionDate, startTime, endTime, exceptionType, replacementMode, recurring]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await submitExceptionAction({
      exceptionDate,
      startTime,
      endTime,
      exceptionType,
      replacementMode: exceptionType === "ALTERNATE_AVAILABILITY" ? replacementMode : null,
      reason: (new FormData(e.currentTarget).get("reason") as string) || undefined,
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Exception submitted for review");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add schedule exception</CardTitle>
        <CardDescription>
          Exceptions temporarily override your normal weekly availability for a specific date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="exceptionDate" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <Input
              id="exceptionDate"
              name="exceptionDate"
              type="date"
              required
              value={exceptionDate}
              onChange={(e) => setExceptionDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="mb-1 block text-sm font-medium">
                Start time
              </label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="mb-1 block text-sm font-medium">
                End time
              </label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="exceptionType" className="mb-1 block text-sm font-medium">
              What needs to change?
            </label>
            <Select
              id="exceptionType"
              value={exceptionType}
              onChange={(e) => setExceptionType(e.target.value as ExceptionType)}
            >
              <option value="UNAVAILABLE">Unavailable for this time</option>
              <option value="REMOTE_INSTEAD">Office → Remote</option>
              <option value="OFFICE_INSTEAD">Remote → Office</option>
              <option value="ALTERNATE_AVAILABILITY">Add different availability</option>
            </Select>
          </div>
          {exceptionType === "ALTERNATE_AVAILABILITY" && (
            <div>
              <label htmlFor="replacementMode" className="mb-1 block text-sm font-medium">
                Work mode
              </label>
              <Select
                id="replacementMode"
                name="replacementMode"
                value={replacementMode}
                onChange={(e) => setReplacementMode(e.target.value as "OFFICE" | "REMOTE")}
              >
                <option value="OFFICE">Office</option>
                <option value="REMOTE">Remote</option>
              </Select>
            </div>
          )}
          <div>
            <label htmlFor="reason" className="mb-1 block text-sm font-medium">
              Reason (optional)
            </label>
            <Input id="reason" name="reason" placeholder="e.g., Doctor appointment" maxLength={500} />
          </div>

          {preview && (
            <div className="grid gap-3 rounded-md border bg-[var(--color-muted)]/40 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="font-medium">Normal</p>
                {preview.normal.length === 0 ? (
                  <p className="text-[var(--color-muted-foreground)]">No recurring blocks</p>
                ) : (
                  preview.normal.map((b) => (
                    <p key={b.id}>
                      {formatTimeRange(b.startTime, b.endTime)} ({b.workMode === "OFFICE" ? "Office" : "Remote"})
                    </p>
                  ))
                )}
              </div>
              <div>
                <p className="font-medium">Exception</p>
                <p>
                  {formatTimeRange(startTime, endTime)} · {EXCEPTION_TYPE_LABEL[exceptionType]}
                </p>
              </div>
              <div>
                <p className="font-medium">Result</p>
                {preview.result.length === 0 ? (
                  <p className="text-[var(--color-muted-foreground)]">No work scheduled</p>
                ) : (
                  preview.result.map((b, i) => (
                    <p key={`${b.startTime}-${i}`}>
                      {formatTimeRange(b.startTime, b.endTime)} ({b.workMode === "OFFICE" ? "Office" : "Remote"})
                    </p>
                  ))
                )}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Add Schedule Exception"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
