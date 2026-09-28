"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerStudentAction } from "@/app/actions/auth";
import { AuthScreen } from "@/components/auth/auth-screen";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/passwords";

export function StudentRegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await registerStudentAction(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result?.confirmationRequired) {
      setConfirmationEmail(result.email);
      setLoading(false);
    }
  }

  if (confirmationEmail) {
    return (
      <AuthScreen
        title="Check your ASU email"
        description="We sent a confirmation link to your ASU address. Confirm your email, then sign in."
        footer={
          <p className="text-center text-sm">
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              Return to sign in
            </Link>
          </p>
        }
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Look for a message to <span className="font-medium text-[var(--color-foreground)]">{confirmationEmail}</span>.
          If you do not see it, check spam or wait a minute and try again.
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Create student account"
      description="Student employees can register with an @asu.edu email. Supervisor and administrator access is invite-only."
      footer={
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
              First name
            </label>
            <Input
              id="firstName"
              name="firstName"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              autoComplete="given-name"
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
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              autoComplete="family-name"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            ASU email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@asu.edu"
            disabled={loading}
            autoComplete="email"
          />
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
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
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
          {loading ? "Creating account…" : "Create student account"}
        </Button>
      </form>
    </AuthScreen>
  );
}
