"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activateInvitationAction } from "@/app/actions/auth";
import { AuthScreen } from "@/components/auth/auth-screen";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/passwords";
import { roleLabel } from "@/lib/auth/rbac";
import type { UserRole } from "@/types";

export function InviteActivationForm({
  token,
  email,
  role,
  firstName,
  lastName,
}: {
  token: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [givenName, setGivenName] = useState(firstName);
  const [familyName, setFamilyName] = useState(lastName);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await activateInvitationAction(token, new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title="Activate your account"
      description={`You were invited as a ${roleLabel(role).toLowerCase()}. Set a password to finish setup.`}
      footer={
        <p className="text-center text-sm">
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            Return to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm">
            <span className="font-medium">ASU email:</span> {email}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
              First name
            </label>
            <Input
              id="firstName"
              name="firstName"
              required
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
              Last name
            </label>
            <Input
              id="lastName"
              name="lastName"
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Activating…" : "Activate account"}
        </Button>
      </form>
    </AuthScreen>
  );
}
