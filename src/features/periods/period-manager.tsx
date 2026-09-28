"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SchedulePeriod, SchedulePeriodStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  changePeriodStatusAction,
  createPeriodAction,
  updatePeriodAction,
} from "@/app/actions/scheduling";

function nextStatuses(status: SchedulePeriodStatus): { status: SchedulePeriodStatus; label: string }[] {
  if (status === "DRAFT") return [{ status: "OPEN", label: "Open period" }];
  if (status === "OPEN") return [{ status: "CLOSED", label: "Close period" }];
  if (status === "CLOSED") {
    return [
      { status: "OPEN", label: "Reopen period" },
      { status: "ARCHIVED", label: "Archive period" },
    ];
  }
  return [];
}

export function PeriodManager({ periods }: { periods: SchedulePeriod[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPeriod, setEditPeriod] = useState<SchedulePeriod | null>(null);
  const [confirm, setConfirm] = useState<{ period: SchedulePeriod; status: SchedulePeriodStatus } | null>(
    null
  );

  function createPeriod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPeriodAction({
        name: String(form.get("name")),
        startDate: String(form.get("startDate")),
        endDate: String(form.get("endDate")),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Schedule period created as Draft.");
      setCreateOpen(false);
      router.refresh();
    });
  }

  function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editPeriod) return;
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePeriodAction(editPeriod.id, {
        name: String(form.get("name")),
        startDate: String(form.get("startDate")),
        endDate: String(form.get("endDate")),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Period updated.");
      setEditPeriod(null);
      router.refresh();
    });
  }

  function applyStatus() {
    if (!confirm) return;
    startTransition(async () => {
      const result = await changePeriodStatusAction(confirm.period.id, confirm.status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${confirm.period.name} is now ${confirm.status.toLowerCase()}.`);
      setConfirm(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreateOpen(true)}>Create period</Button>
      <div className="space-y-3">
        {periods.map((period) => (
          <Card key={period.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{period.name}</h2>
                  <Badge variant={period.status === "OPEN" ? "success" : "neutral"}>
                    {period.status}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {period.startDate} to {period.endDate}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {period.status !== "ARCHIVED" && (
                  <Button variant="outline" onClick={() => setEditPeriod(period)}>
                    Edit dates/name
                  </Button>
                )}
                {nextStatuses(period.status).map((item) => (
                  <Button
                    key={item.status}
                    variant={item.status === "ARCHIVED" ? "destructive" : "secondary"}
                    onClick={() => setConfirm({ period, status: item.status })}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create schedule period</DialogTitle>
            <DialogDescription>
              Period names are yours to choose. This does not hardcode ASU semester labels.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createPeriod} className="space-y-3">
            <div>
              <label htmlFor="period-name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <Input id="period-name" name="name" required placeholder="Fall 2026" />
            </div>
            <div>
              <label htmlFor="period-start" className="mb-1 block text-sm font-medium">
                Start date
              </label>
              <Input id="period-start" name="startDate" type="date" required />
            </div>
            <div>
              <label htmlFor="period-end" className="mb-1 block text-sm font-medium">
                End date
              </label>
              <Input id="period-end" name="endDate" type="date" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPeriod} onOpenChange={(open) => !open && setEditPeriod(null)}>
        <DialogContent onClose={() => setEditPeriod(null)}>
          <DialogHeader>
            <DialogTitle>Edit {editPeriod?.name}</DialogTitle>
          </DialogHeader>
          {editPeriod && (
            <form onSubmit={saveEdit} className="space-y-3">
              <div>
                <label htmlFor="edit-name" className="mb-1 block text-sm font-medium">
                  Name
                </label>
                <Input id="edit-name" name="name" defaultValue={editPeriod.name} required />
              </div>
              <div>
                <label htmlFor="edit-start" className="mb-1 block text-sm font-medium">
                  Start date
                </label>
                <Input
                  id="edit-start"
                  name="startDate"
                  type="date"
                  defaultValue={editPeriod.startDate}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-end" className="mb-1 block text-sm font-medium">
                  End date
                </label>
                <Input
                  id="edit-end"
                  name="endDate"
                  type="date"
                  defaultValue={editPeriod.endDate}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditPeriod(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent onClose={() => setConfirm(null)}>
          <DialogHeader>
            <DialogTitle>
              {confirm?.status === "OPEN" && `Open ${confirm.period.name}?`}
              {confirm?.status === "CLOSED" && `Close ${confirm.period.name}?`}
              {confirm?.status === "ARCHIVED" && `Archive ${confirm.period.name}?`}
            </DialogTitle>
            <DialogDescription>
              {confirm?.status === "OPEN" &&
                "Students will be able to edit and submit availability for this period."}
              {confirm?.status === "CLOSED" &&
                "Students will no longer be able to edit weekly availability unless this period is reopened."}
              {confirm?.status === "ARCHIVED" &&
                "Archived periods are historical and read-only. This cannot be undone from the app."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.status === "ARCHIVED" ? "destructive" : "default"}
              onClick={applyStatus}
              disabled={pending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
