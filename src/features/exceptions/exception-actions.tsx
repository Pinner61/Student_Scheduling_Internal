"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  function run(fn: () => Promise<{ error?: string; success?: boolean } | void>, successMsg: string) {
    startTransition(async () => {
      const result = await fn();
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(successMsg);
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
        Cancel
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
        onClick={() => {
          const confirmed = window.confirm(
            "Decline this exception? The student’s normal schedule will remain unchanged."
          );
          if (!confirmed) return;
          run(() => reviewExceptionAction(exceptionId, "DECLINED"), "Exception declined");
        }}
      >
        Decline
      </Button>
    </div>
  );
}
