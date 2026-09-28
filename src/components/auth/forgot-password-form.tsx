"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/app/actions/auth";
import { AuthScreen } from "@/components/auth/auth-screen";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await forgotPasswordAction(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(result.message ?? "If that address has an account, we sent reset instructions.");
  }

  return (
    <AuthScreen
      title="Forgot password"
      description="Enter your ASU email. If an account exists, we will send reset instructions."
      footer={
        <p className="text-center text-sm">
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            Return to sign in
          </Link>
        </p>
      }
    >
      {message ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              ASU Email
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
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset instructions"}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
