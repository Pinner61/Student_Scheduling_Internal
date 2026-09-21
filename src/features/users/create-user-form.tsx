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
import { createUserAction } from "@/app/actions/scheduling";

interface CreateUserFormProps {
  teams: { id: string; name: string }[];
}

export function CreateUserForm({ teams }: CreateUserFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      await createUserAction({
        firstName: form.get("firstName") as string,
        lastName: form.get("lastName") as string,
        email: form.get("email") as string,
        role: form.get("role") as "student" | "supervisor" | "administrator",
        teamId: (form.get("teamId") as string) || null,
      });
      toast.success("User created");
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create user</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
                  First name
                </label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
                  Last name
                </label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                ASU email
              </label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium">
                Role
              </label>
              <Select id="role" name="role" defaultValue="student">
                <option value="student">Student</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrator">Administrator</option>
              </Select>
            </div>
            <div>
              <label htmlFor="teamId" className="mb-1 block text-sm font-medium">
                Team
              </label>
              <Select id="teamId" name="teamId" defaultValue="">
                <option value="">Unassigned</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
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
