import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getAvailability, getCurrentPeriod, getSettings, getUser } from "@/lib/services/data-service";
import { AvailabilityPaintEditor } from "@/features/availability/availability-paint-editor";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { canEditAvailability } from "@/lib/schedule/periods";

export default async function AvailabilityPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const period = getCurrentPeriod();
  const profile = getUser(user.id);
  const ranges = getAvailability(user.id);
  const settings = getSettings();
  const editable = Boolean(period && canEditAvailability(period) && profile?.submissionStatus !== "SUBMITTED");

  return (
    <div className="space-y-6">
      <Link href="/schedule" className={buttonVariants({ variant: "ghost" })}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to your schedule
      </Link>
      <div>
        <h1 className="text-2xl font-bold">
          {period ? `Edit ${period.name} Weekly Availability` : "Edit Weekly Availability"}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          This is your normal Monday–Friday schedule. Use exceptions for one-time changes like
          appointments.
        </p>
        {profile?.submissionStatus === "SUBMITTED" && (
          <p className="mt-2 text-sm" role="status">
            This schedule is submitted. Reopen it from Your Schedule before making changes.
          </p>
        )}
        {period && !canEditAvailability(period) && (
          <p className="mt-2 text-sm" role="status">
            {period.name} is {period.status.toLowerCase()}, so weekly availability is read-only.
          </p>
        )}
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
        readOnly={!editable}
      />
    </div>
  );
}
