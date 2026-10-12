"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Profile, Team, UserWithTeam } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateTeamAction } from "@/app/actions/scheduling";
import { TeamEditDialog } from "@/features/teams/team-edit-dialog";

interface TeamCardProps {
  team: Team;
  supervisorName: string;
  members: Profile[];
  students: UserWithTeam[];
  leads: { id: string; name: string }[];
}

export function TeamCard({ team, supervisorName, members, students, leads }: TeamCardProps) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const studentMembers = members.filter((member) => member.role === "student");

  function archive() {
    startTransition(async () => {
      const result = await updateTeamAction(team.id, { status: "archived" });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Team archived");
      setConfirmArchive(false);
    });
  }

  function reactivate() {
    startTransition(async () => {
      const result = await updateTeamAction(team.id, { status: "active" });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Team reactivated");
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">{team.name}</CardTitle>
            <Badge variant={team.status === "active" ? "success" : "neutral"}>
              {team.status === "active" ? "Active" : "Archived"}
            </Badge>
          </div>
          <CardDescription>{team.description || "No description yet."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">Supervisor:</span> {supervisorName}
          </p>
          <p>
            <span className="font-medium">Members:</span> {studentMembers.length}
          </p>
          {studentMembers.length === 0 ? (
            <p className="text-[var(--color-muted-foreground)]">
              No students are assigned to this team yet.
            </p>
          ) : (
            <ul className="space-y-1 text-[var(--color-muted-foreground)]">
              {studentMembers.slice(0, 5).map((m) => (
                <li key={m.id}>
                  {m.firstName} {m.lastName}
                </li>
              ))}
              {studentMembers.length > 5 && <li>+{studentMembers.length - 5} more</li>}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {team.status === "active" && (
              <Button onClick={() => setEditOpen(true)}>Edit Team</Button>
            )}
            {team.status === "active" ? (
              <Button variant="outline" onClick={() => setConfirmArchive(true)}>
                Archive Team
              </Button>
            ) : (
              <Button variant="outline" onClick={reactivate} disabled={pending}>
                Reactivate team
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {editOpen && (
        <TeamEditDialog
          team={team}
          members={members}
          students={students}
          leads={leads}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent onClose={() => setConfirmArchive(false)}>
          <DialogHeader>
            <DialogTitle>Archive {team.name}?</DialogTitle>
            <DialogDescription>
              Archived teams stay in history and membership records. They are hidden from default
              coverage views.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmArchive(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={archive} disabled={pending}>
              Archive Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
