"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserWithTeam } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  deactivateUserAction,
  reactivateUserAction,
  requestScheduleUpdateAction,
} from "@/app/actions/scheduling";
import { UserDetailPanel } from "./user-detail-panel";
import Link from "next/link";

interface UsersTableProps {
  users: UserWithTeam[];
  teams?: { id: string; name: string }[];
}

export function UsersTable({ users, teams = [] }: UsersTableProps) {
  const router = useRouter();
  const [deactivateTarget, setDeactivateTarget] = useState<UserWithTeam | null>(null);
  const [detailUser, setDetailUser] = useState<UserWithTeam | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDeactivate() {
    if (!deactivateTarget) return;
    startTransition(async () => {
      const action =
        deactivateTarget.status === "active"
          ? deactivateUserAction(deactivateTarget.id)
          : reactivateUserAction(deactivateTarget.id);
      const result = await action;
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        deactivateTarget.status === "active"
          ? "User deactivated"
          : "User reactivated"
      );
      setDeactivateTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-[var(--color-muted)]">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Team</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Schedule</th>
              <th className="px-4 py-3 text-left font-medium">Last updated</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                  >
                    {user.firstName} {user.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">{user.teamName ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.status === "active" ? "success" : "neutral"}>
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      user.scheduleStatus === "complete"
                        ? "success"
                        : user.scheduleStatus === "incomplete"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {user.scheduleStatus.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                  {user.availabilityUpdatedAt
                    ? new Date(user.availabilityUpdatedAt).toLocaleDateString("en-US", {
                        timeZone: "America/Phoenix",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu triggerLabel={`Actions for ${user.firstName} ${user.lastName}`}>
                    <DropdownMenuItem onSelect={() => setDetailUser(user)}>
                      View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        router.push(`/admin/users/${user.id}`);
                      }}
                    >
                      View schedule
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDetailUser(user)}>
                      Edit user
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        startTransition(async () => {
                          const result = await requestScheduleUpdateAction(user.id);
                          if (result && "error" in result && result.error) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Schedule update requested");
                        });
                      }}
                    >
                      Request schedule update
                    </DropdownMenuItem>
                    {user.status === "active" ? (
                      <DropdownMenuItem
                        destructive
                        onSelect={() => setDeactivateTarget(user)}
                      >
                        Deactivate user
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => setDeactivateTarget(user)}>
                        Reactivate user
                      </DropdownMenuItem>
                    )}
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <DialogContent onClose={() => setDeactivateTarget(null)}>
          <DialogHeader>
            <DialogTitle>
              {deactivateTarget?.status === "active" ? "Deactivate" : "Reactivate"}{" "}
              {deactivateTarget?.firstName} {deactivateTarget?.lastName}?
            </DialogTitle>
            <DialogDescription>
              {deactivateTarget?.status === "active"
                ? `${deactivateTarget.firstName} will no longer be able to access the scheduling system. Their existing schedule and audit history will be retained.`
                : "This will restore the user's access to the scheduling system."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={deactivateTarget?.status === "active" ? "destructive" : "default"}
              onClick={confirmDeactivate}
              disabled={pending}
            >
              {deactivateTarget?.status === "active" ? "Deactivate User" : "Reactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailUser && (
        <UserDetailPanel
          user={detailUser}
          teams={teams}
          onClose={() => setDetailUser(null)}
        />
      )}
    </>
  );
}
