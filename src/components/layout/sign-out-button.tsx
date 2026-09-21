"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        redirect: "manual",
      });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Sign out"
      onClick={handleSignOut}
      disabled={pending}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">{pending ? "Signing out…" : "Sign out"}</span>
    </Button>
  );
}
