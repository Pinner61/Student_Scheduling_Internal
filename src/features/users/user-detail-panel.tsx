"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { UserWithTeam } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  changeUserRoleAction,
  changeUserTeamAction,
  assignSupervisorAction,
  updateUserAccountAction,
} from "@/app/actions/scheduling";
import { scheduleStatusLabel } from "@/components/schedule/schedule-language";

interface UserDetailPanelProps {
  user: UserWithTeam;
  onClose: () => void;
  teams?: { id: string; name: string; supervisorId?: string | null }[];
  supervisors?: { id: string; name: string }[];
}

export function UserDetailPanel({ user, onClose, teams = [], supervisors = [] }: UserDetailPanelProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium">Account Status:</span>{" "}
            {user.status === "active" ? "Active" : "Inactive"}
          </p>
          <p>
            <span className="font-medium">Schedule:</span> {scheduleStatusLabel(user.scheduleStatus)}
            {user.submittedAt
              ? ` · ${new Date(user.submittedAt).toLocaleString("en-US", { timeZone: "America/Phoenix" })}`
              : ""}
          </p>
          <p>
            <span className="font-medium">Supervisor:</span> {user.supervisorName ?? "—"}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-first" className="mb-1 block font-medium">
                First name
              </label>
              <input
                id="edit-first"
                className="w-full rounded-md border px-3 py-2"
                defaultValue={user.firstName}
                onBlur={(e) => {
                  if (e.target.value === user.firstName) return;
                  startTransition(async () => {
                    await updateUserAccountAction(user.id, { firstName: e.target.value });
                    toast.success("Name updated");
                  });
                }}
              />
            </div>
            <div>
              <label htmlFor="edit-last" className="mb-1 block font-medium">
                Last name
              </label>
              <input
                id="edit-last"
                className="w-full rounded-md border px-3 py-2"
                defaultValue={user.lastName}
                onBlur={(e) => {
                  if (e.target.value === user.lastName) return;
                  startTransition(async () => {
                    await updateUserAccountAction(user.id, { lastName: e.target.value });
                    toast.success("Name updated");
                  });
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="role-select" className="mb-1 block font-medium">
              Role
            </label>
            <Select
              id="role-select"
              defaultValue={user.role}
              onChange={(e) => {
                startTransition(async () => {
                  await changeUserRoleAction(user.id, e.target.value as UserWithTeam["role"]);
                  toast.success("Role updated");
                });
              }}
              disabled={pending}
            >
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
              <option value="administrator">Administrator</option>
            </Select>
          </div>

          {teams.length > 0 && (
            <div>
              <label htmlFor="team-select" className="mb-1 block font-medium">
                Team
              </label>
              <Select
                id="team-select"
                defaultValue={user.teamId ?? ""}
                onChange={(e) => {
                  startTransition(async () => {
                    await changeUserTeamAction(
                      user.id,
                      e.target.value || null
                    );
                    toast.success("Team updated");
                  });
                }}
                disabled={pending}
              >
                <option value="">Unassigned</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {supervisors.length > 0 && user.teamId && (
            <div>
              <label htmlFor="supervisor-select" className="mb-1 block font-medium">
                Assign Supervisor
              </label>
              <Select
                id="supervisor-select"
                defaultValue={user.supervisorId ?? ""}
                onChange={(e) => {
                  startTransition(async () => {
                    await assignSupervisorAction(user.teamId!, e.target.value || null);
                    toast.success("Supervisor assignment updated for this team");
                  });
                }}
                disabled={pending}
              >
                <option value="">Unassigned</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                This updates the supervisor for the student’s team, not only this person.
              </p>
            </div>
          )}

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
