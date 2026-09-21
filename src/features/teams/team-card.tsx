"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Profile, Team } from "@/types";
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

interface TeamCardProps {
  team: Team;
  supervisorName: string;
  members: Profile[];
}

export function TeamCard({ team, supervisorName, members }: TeamCardProps) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [pending, startTransition] = useTransition();

  function archive() {
    startTransition(async () => {
      await updateTeamAction(team.id, { status: "archived" });
      toast.success("Team archived");
      setConfirmArchive(false);
    });
  }

  function reactivate() {
    startTransition(async () => {
      await updateTeamAction(team.id, { status: "active" });
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
              {team.status}
            </Badge>
          </div>
          <CardDescription>{team.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Supervisor:</span> {supervisorName}
          </p>
          <p>
            <span className="font-medium">Members:</span> {members.length}
          </p>
          <ul className="mt-2 space-y-1 text-[var(--color-muted-foreground)]">
            {members.slice(0, 5).map((m) => (
              <li key={m.id}>
                {m.firstName} {m.lastName}
              </li>
            ))}
            {members.length > 5 && <li>+{members.length - 5} more</li>}
          </ul>
          {team.status === "active" ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmArchive(true)}>
              Archive team
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={reactivate} disabled={pending}>
              Reactivate team
            </Button>
          )}
        </CardContent>
      </Card>

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
              Archive team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
