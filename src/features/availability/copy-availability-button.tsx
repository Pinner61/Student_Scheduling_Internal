"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatWeeklyAvailabilityCopy } from "@/lib/schedule/cells";
import type { RecurringAvailability } from "@/types";

export function CopyAvailabilityButton({ ranges }: { ranges: RecurringAvailability[] }) {
  async function copy() {
    await navigator.clipboard.writeText(formatWeeklyAvailabilityCopy(ranges));
    toast.success("Weekly availability copied.");
  }

  return (
    <Button type="button" variant="outline" onClick={copy}>
      Copy Weekly Availability
    </Button>
  );
}
