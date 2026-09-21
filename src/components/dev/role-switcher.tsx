"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { SessionUser } from "@/types";

const DEMO_USERS = [
  { email: "alex.chen@asu.edu", label: "Student", home: "/schedule" },
  { email: "smitchell@asu.edu", label: "Supervisor", home: "/supervisor/overview" },
  { email: "preyes@asu.edu", label: "Administrator", home: "/admin/overview" },
];

interface RoleSwitcherProps {
  currentUser: SessionUser;
}

export function RoleSwitcher({ currentUser }: RoleSwitcherProps) {
  const router = useRouter();

  async function handleSwitch(email: string) {
    await fetch("/api/auth/demo-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const next = DEMO_USERS.find((u) => u.email === email);
    window.location.assign(next?.home ?? "/");
    router.refresh();
  }

  return (
    <Select
      aria-label="Switch demo role"
      className="h-8 w-auto text-xs"
      value={currentUser.email}
      onChange={(e) => handleSwitch(e.target.value)}
    >
      {DEMO_USERS.map((u) => (
        <option key={u.email} value={u.email}>
          Demo: {u.label}
        </option>
      ))}
    </Select>
  );
}
