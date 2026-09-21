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
} from "@/app/actions/scheduling";

interface UserDetailPanelProps {
  user: UserWithTeam;
  onClose: () => void;
  teams?: { id: string; name: string }[];
}

export function UserDetailPanel({ user, onClose, teams = [] }: UserDetailPanelProps) {
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
            <span className="font-medium">Status:</span> {user.status}
          </p>
          <p>
            <span className="font-medium">Schedule status:</span> {user.scheduleStatus}
          </p>

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

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
