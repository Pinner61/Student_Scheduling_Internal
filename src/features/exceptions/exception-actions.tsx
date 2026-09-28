"use client";

import { useState, useTransition } from "react";
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
import {
  reviewExceptionAction,
  cancelExceptionAction,
} from "@/app/actions/scheduling";

interface ExceptionActionsProps {
  exceptionId: string;
  action: "approve" | "decline" | "cancel";
}

export function ExceptionActions({ exceptionId, action }: ExceptionActionsProps) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ error?: string; success?: boolean } | void>, successMsg: string) {
    startTransition(async () => {
      const result = await fn();
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(successMsg);
        setRejectOpen(false);
        setReason("");
      }
    });
  }

  if (action === "cancel") {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => run(() => cancelExceptionAction(exceptionId), "Exception cancelled")}
      >
        Cancel request
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          run(() => reviewExceptionAction(exceptionId, "APPROVED"), "Exception approved")
        }
      >
        Approve
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => setRejectOpen(true)}
      >
        Reject
      </Button>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent onClose={() => setRejectOpen(false)}>
          <DialogHeader>
            <DialogTitle>Reject this exception?</DialogTitle>
            <DialogDescription>
              The student’s normal weekly availability will stay in place. Please explain why this
              request is being rejected.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor={`reject-reason-${exceptionId}`} className="mb-1 block text-sm font-medium">
            Reason / justification
          </label>
          <textarea
            id={`reject-reason-${exceptionId}`}
            className="min-h-24 w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || reason.trim().length === 0}
              onClick={() =>
                run(
                  () => reviewExceptionAction(exceptionId, "DECLINED", reason.trim()),
                  "Exception rejected"
                )
              }
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
