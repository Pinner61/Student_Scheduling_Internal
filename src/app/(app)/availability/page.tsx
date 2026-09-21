import { getSessionUser } from "@/lib/auth/session";
import { getAvailability, getSettings } from "@/lib/services/data-service";
import { AvailabilityPaintEditor } from "@/features/availability/availability-paint-editor";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function AvailabilityPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const ranges = getAvailability(user.id);
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Weekly Availability</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          This is your normal Monday–Friday schedule. Use exceptions for one-time changes like
          appointments.
        </p>
      </div>
      {ranges.length === 0 && (
        <EmptyState
          title="No availability has been added yet."
          description="Paint Office or Remote across the times you can work, then save."
        />
      )}
      <AvailabilityPaintEditor
        initialRanges={ranges}
        workingDayStart={settings.workingDayStart}
        workingDayEnd={settings.workingDayEnd}
        intervalMinutes={settings.schedulingIntervalMinutes}
      />
      <Link href="/schedule" className={buttonVariants({ variant: "ghost" })}>
        Back to Your Schedule
      </Link>
    </div>
  );
}
