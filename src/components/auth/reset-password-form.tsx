"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/app/actions/auth";
import { AuthScreen } from "@/components/auth/auth-screen";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/passwords";

export function ResetPasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await resetPasswordAction(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <AuthScreen
        title="Password successfully changed"
        description="Use your new password the next time you sign in."
        footer={
          <p className="text-center text-sm">
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">Your password has been updated.</p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Reset password"
      description="Choose a new password for your ASU Creative Strategy account."
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
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            New password
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
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthScreen>
  );
}
