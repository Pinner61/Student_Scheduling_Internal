"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Profile, Team, UserWithTeam } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveTeamEditsAction } from "@/app/actions/scheduling";

interface TeamEditDialogProps {
  team: Team;
  members: Profile[];
  students: UserWithTeam[];
  leads: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamEditDialog({
  team,
  members,
  students,
  leads,
  open,
  onOpenChange,
}: TeamEditDialogProps) {
  const initialMemberIds = members.filter((m) => m.role === "student").map((m) => m.id);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [supervisorId, setSupervisorId] = useState(team.supervisorId ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(initialMemberIds);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmSupervisor, setConfirmSupervisor] = useState(false);

  const dirty =
    name.trim() !== team.name ||
    description.trim() !== (team.description ?? "") ||
    (supervisorId || null) !== (team.supervisorId ?? null) ||
    memberIds.slice().sort().join() !== initialMemberIds.slice().sort().join();

  const currentMembers = useMemo(
    () =>
      memberIds
        .map(
          (id) =>
            students.find((student) => student.id === id) ??
            members.find((member) => member.id === id)
        )
        .filter((member): member is NonNullable<typeof member> => Boolean(member)),
    [students, members, memberIds]
  );
  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((student) => {
      if (memberIds.includes(student.id) || student.status !== "active") return false;
      if (!q) return true;
      return (
        student.firstName.toLowerCase().includes(q) ||
        student.lastName.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q)
      );
    });
  }, [students, memberIds, query]);

  function requestClose() {
    if (dirty) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(false);
  }

  function save() {
    startTransition(async () => {
      const result = await saveTeamEditsAction(team.id, {
        name,
        description,
        supervisorId: supervisorId || null,
        memberIds,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Team updated.");
      setConfirmSupervisor(false);
      onOpenChange(false);
    });
  }

  function handleSave() {
    if ((supervisorId || null) !== (team.supervisorId ?? null)) {
      setConfirmSupervisor(true);
      return;
    }
    save();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <DialogContent className="max-h-[min(90vh,44rem)] max-w-2xl overflow-y-auto" onClose={requestClose}>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update this team’s name, supervisor, and student membership.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <label htmlFor={`team-name-${team.id}`} className="mb-1 block text-sm font-medium">
                Team name
              </label>
              <Input
                id={`team-name-${team.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor={`team-desc-${team.id}`} className="mb-1 block text-sm font-medium">
                Description
              </label>
              <Input
                id={`team-desc-${team.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`team-lead-${team.id}`} className="mb-1 block text-sm font-medium">
                Supervisor
              </label>
              <Select
                id={`team-lead-${team.id}`}
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Current members</h3>
                {currentMembers.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    No students are assigned to this team yet.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y rounded-md border">
                    {currentMembers.map((member) => (
                      <li key={member.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <span>
                          {member.firstName} {member.lastName}
                          <span className="block text-xs text-[var(--color-muted-foreground)]">
                            {member.email}
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmRemoveId(member.id)}
                        >
                          Remove {member.firstName} {member.lastName}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label htmlFor={`team-search-${team.id}`} className="mb-1 block text-sm font-medium">
                  Available students
                </label>
                <Input
                  id={`team-search-${team.id}`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or ASU email"
                />
                <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border">
                  {!query.trim() ? (
                    <li className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                      Search by name or ASU email to add a student.
                    </li>
                  ) : available.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                      No matching students.
                    </li>
                  ) : (
                    available.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span>
                          {student.firstName} {student.lastName}
                          <span className="block text-xs text-[var(--color-muted-foreground)]">
                            {student.email}
                            {student.teamName ? ` · Currently on ${student.teamName}` : ""}
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setMemberIds((ids) => [...ids, student.id])}
                        >
                          Add {student.firstName} {student.lastName}
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={pending || !dirty || !name.trim()}>
              {pending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmRemoveId)} onOpenChange={(next) => !next && setConfirmRemoveId(null)}>
        <DialogContent onClose={() => setConfirmRemoveId(null)}>
          <DialogHeader>
            <DialogTitle>Remove this student from the team?</DialogTitle>
            <DialogDescription>
              They will no longer appear on this team’s schedule until they are assigned again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmRemoveId(null)}>
              Keep member
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmRemoveId) {
                  setMemberIds((ids) => ids.filter((id) => id !== confirmRemoveId));
                }
                setConfirmRemoveId(null);
              }}
            >
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent onClose={() => setConfirmClose(false)}>
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>Team edits on this screen will be discarded.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmClose(false)}>
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmClose(false);
                onOpenChange(false);
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSupervisor} onOpenChange={setConfirmSupervisor}>
        <DialogContent onClose={() => setConfirmSupervisor(false)}>
          <DialogHeader>
            <DialogTitle>Change this team’s supervisor?</DialogTitle>
            <DialogDescription>
              Supervisor student lists, Team Schedule, and Find Availability will use the new
              assignment after you save.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmSupervisor(false)}>
              Keep current supervisor
            </Button>
            <Button onClick={save} disabled={pending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
