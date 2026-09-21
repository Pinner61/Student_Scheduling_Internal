"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { AppSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateSettingsAction } from "@/app/actions/scheduling";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSettingsAction({
        workingDayStart: form.get("workingDayStart") as string,
        workingDayEnd: form.get("workingDayEnd") as string,
        schedulingIntervalMinutes: Number(form.get("schedulingIntervalMinutes")),
        timezone: form.get("timezone") as string,
        coverageThresholdOffice: Number(form.get("coverageThresholdOffice")),
        coverageThresholdRemote: Number(form.get("coverageThresholdRemote")),
        coverageThresholdTotal: Number(form.get("coverageThresholdTotal")),
        exceptionApprovalRequired: form.get("exceptionApprovalRequired") === "true",
      });
      if (result.success) toast.success("Settings saved");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduling rules</CardTitle>
        <CardDescription>
          These values drive availability validation and coverage indicators. They can be changed
          without a code deploy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="workingDayStart" className="mb-1 block text-sm font-medium">
              Working day start
            </label>
            <Input
              id="workingDayStart"
              name="workingDayStart"
              type="time"
              defaultValue={settings.workingDayStart}
              required
            />
          </div>
          <div>
            <label htmlFor="workingDayEnd" className="mb-1 block text-sm font-medium">
              Working day end
            </label>
            <Input
              id="workingDayEnd"
              name="workingDayEnd"
              type="time"
              defaultValue={settings.workingDayEnd}
              required
            />
          </div>
          <div>
            <label htmlFor="schedulingIntervalMinutes" className="mb-1 block text-sm font-medium">
              Scheduling interval
            </label>
            <Input
              id="schedulingIntervalMinutes"
              name="schedulingIntervalMinutes"
              type="number"
              min={15}
              step={15}
              defaultValue={settings.schedulingIntervalMinutes}
              required
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Determines the smallest time block students can select when entering availability.
            </p>
          </div>
          <div>
            <label htmlFor="timezone" className="mb-1 block text-sm font-medium">
              Timezone
            </label>
            <Input id="timezone" name="timezone" defaultValue={settings.timezone} required />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              ASU operations use America/Phoenix. Stored schedules do not follow the browser timezone.
            </p>
          </div>
          <div>
            <label htmlFor="coverageThresholdOffice" className="mb-1 block text-sm font-medium">
              Office coverage threshold
            </label>
            <Input
              id="coverageThresholdOffice"
              name="coverageThresholdOffice"
              type="number"
              min={0}
              defaultValue={settings.coverageThresholdOffice}
              required
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Used as a visual indicator on coverage views. It does not automatically flag a staffing problem.
            </p>
          </div>
          <div>
            <label htmlFor="coverageThresholdRemote" className="mb-1 block text-sm font-medium">
              Remote coverage threshold
            </label>
            <Input
              id="coverageThresholdRemote"
              name="coverageThresholdRemote"
              type="number"
              min={0}
              defaultValue={settings.coverageThresholdRemote}
              required
            />
          </div>
          <div>
            <label htmlFor="coverageThresholdTotal" className="mb-1 block text-sm font-medium">
              Total coverage threshold
            </label>
            <Input
              id="coverageThresholdTotal"
              name="coverageThresholdTotal"
              type="number"
              min={0}
              defaultValue={settings.coverageThresholdTotal}
              required
            />
          </div>
          <div>
            <label htmlFor="exceptionApprovalRequired" className="mb-1 block text-sm font-medium">
              Exception approval required
            </label>
            <Select
              id="exceptionApprovalRequired"
              name="exceptionApprovalRequired"
              defaultValue={settings.exceptionApprovalRequired ? "true" : "false"}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
