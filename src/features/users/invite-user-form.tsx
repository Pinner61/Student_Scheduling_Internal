"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { inviteUserAction } from "@/app/actions/auth";

interface InviteUserFormProps {
  teams: { id: string; name: string }[];
}

export function InviteUserForm({ teams }: InviteUserFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [activateUrl, setActivateUrl] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [role, setRole] = useState<"student" | "supervisor" | "administrator">("supervisor");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await inviteUserAction({
        firstName: form.get("firstName") as string,
        lastName: form.get("lastName") as string,
        email: form.get("email") as string,
        role: form.get("role") as "student" | "supervisor" | "administrator",
        teamId: (form.get("teamId") as string) || null,
      });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (result && "activateUrl" in result && result.activateUrl) {
        setActivateUrl(result.activateUrl);
        setEmailSent(Boolean(result.emailSent));
        toast.success("Invitation created");
      }
    });
  }

  async function copyLink() {
    if (!activateUrl) return;
    await navigator.clipboard.writeText(activateUrl);
    toast.success("Invitation link copied");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite user</Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setActivateUrl("");
            setEmailSent(false);
          }
        }}
      >
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Supervisors and administrators must be invited. Students may also be invited or they can
              self-register.
            </DialogDescription>
          </DialogHeader>
          {activateUrl ? (
            <div className="space-y-4">
              <p className="text-sm">
                {emailSent
                  ? "An invitation email was sent."
                  : "Email delivery is not configured. Copy this activation link and send it securely."}
              </p>
              <Input readOnly value={activateUrl} aria-label="Invitation link" />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Done
                </Button>
                <Button type="button" onClick={copyLink}>
                  Copy invite link
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
                    First name
                  </label>
                  <Input id="firstName" name="firstName" required disabled={pending} />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
                    Last name
                  </label>
                  <Input id="lastName" name="lastName" required disabled={pending} />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  ASU email
                </label>
                <Input id="email" name="email" type="email" required disabled={pending} />
              </div>
              <div>
                <label htmlFor="role" className="mb-1 block text-sm font-medium">
                  Role
                </label>
                <Select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "student" | "supervisor" | "administrator")
                  }
                  disabled={pending}
                >
                  <option value="student">Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="administrator">Administrator</option>
                </Select>
              </div>
              <div>
                <label htmlFor="teamId" className="mb-1 block text-sm font-medium">
                  Team
                </label>
                <Select id="teamId" name="teamId" defaultValue="" disabled={pending}>
                  <option value="">Unassigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Creating…" : "Create invitation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
