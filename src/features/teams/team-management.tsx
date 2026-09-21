"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTeamAction } from "@/app/actions/scheduling";

interface TeamManagementActionsProps {
  supervisors: { id: string; name: string }[];
}

export function TeamManagementActions({ supervisors }: TeamManagementActionsProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      await createTeamAction(
        form.get("name") as string,
        (form.get("description") as string) || "",
        (form.get("supervisorId") as string) || null
      );
      toast.success("Team created");
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create team</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="team-name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <Input id="team-name" name="name" required />
            </div>
            <div>
              <label htmlFor="team-desc" className="mb-1 block text-sm font-medium">
                Description
              </label>
              <Input id="team-desc" name="description" />
            </div>
            <div>
              <label htmlFor="team-supervisor" className="mb-1 block text-sm font-medium">
                Supervisor
              </label>
              <Select id="team-supervisor" name="supervisorId" defaultValue="">
                <option value="">None</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
