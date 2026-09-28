"use client";

import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeeklyAvailabilityCopy } from "@/lib/schedule/cells";
import type { RecurringAvailability } from "@/types";

export function ShareAvailabilityButton({ ranges }: { ranges: RecurringAvailability[] }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(formatWeeklyAvailabilityCopy(ranges));
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Couldn’t copy to the clipboard. Try again from a secure browser window.");
    }
  }

  return (
    <Button type="button" variant="outline" onClick={copy}>
      <Share2 className="h-4 w-4" aria-hidden="true" />
      Share availability in text
    </Button>
  );
}
