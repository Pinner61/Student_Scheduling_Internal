"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { reopenScheduleAction, submitScheduleAction } from "@/app/actions/scheduling";
import type { SchedulePeriod, ScheduleSubmissionStatus } from "@/types";

function formatSubmittedAt(iso: string) {
  const formatted = new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatted.replace(", ", " ").replace(/ (\d{1,2}:\d{2})/, " at $1");
}

interface ScheduleLifecycleBarProps {
  period: SchedulePeriod | null;
  submissionStatus: ScheduleSubmissionStatus;
  submittedAt: string | null;
}

export function ScheduleLifecycleBar({
  period,
  submissionStatus,
  submittedAt,
}: ScheduleLifecycleBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const periodOpen = period?.status === "OPEN";
  const submitted = submissionStatus === "SUBMITTED";

  function confirmSubmit() {
    startTransition(async () => {
      const result = await submitScheduleAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Schedule submitted.");
      setSubmitOpen(false);
      router.refresh();
    });
  }

  function confirmReopen() {
    startTransition(async () => {
      const result = await reopenScheduleAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Schedule returned to Draft. Submit again when you’re ready.");
      setReopenOpen(false);
      router.push("/availability");
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">{period ? `${period.name} Schedule` : "Your Schedule"}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Status:{" "}
          <span className="font-medium text-[var(--color-foreground)]">
            {submitted ? "Submitted" : "Draft"}
          </span>
          {submitted && submittedAt ? ` · Submitted ${formatSubmittedAt(submittedAt)}` : ""}
          {period && period.status !== "OPEN" ? ` · Period ${period.status.toLowerCase()}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {periodOpen && submitted && (
          <Button onClick={() => setReopenOpen(true)}>Edit Schedule</Button>
        )}
        {periodOpen && !submitted && (
          <>
            <Link href="/availability" className={buttonVariants({ size: "lg" })}>
              Edit Weekly Availability
            </Link>
            <Button variant="secondary" onClick={() => setSubmitOpen(true)}>
              Submit Schedule
            </Button>
          </>
        )}
        {!periodOpen && (
          <Badge variant="neutral">
            {period?.status === "ARCHIVED"
              ? "This period is archived and read-only"
              : "This period is closed. Availability editing is paused."}
          </Badge>
        )}
      </div>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent onClose={() => setSubmitOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              Submit your {period?.name ?? "current"} availability?
            </DialogTitle>
            <DialogDescription>
              Your supervisor will see this schedule as submitted. You can still request exceptions
              afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSubmitOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={confirmSubmit} disabled={pending}>
              Submit Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent onClose={() => setReopenOpen(false)}>
          <DialogHeader>
            <DialogTitle>Return this schedule to Draft?</DialogTitle>
            <DialogDescription>
              Editing a submitted schedule returns it to Draft. You will need to submit it again
              before your supervisor treats it as current.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setReopenOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmReopen} disabled={pending}>
              Edit Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
