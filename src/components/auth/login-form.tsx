"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "@/app/actions/auth";
import { AuthScreen } from "@/components/auth/auth-screen";

const DEMO_ACCOUNTS = [
  { email: "alex.chen@asu.edu", role: "Student", password: "Demo123!" },
  { email: "smitchell@asu.edu", role: "Supervisor", password: "Demo123!" },
  { email: "preyes@asu.edu", role: "Administrator", password: "Demo123!" },
];

export function LoginForm({
  showDemoAccounts,
  initialError,
}: {
  showDemoAccounts: boolean;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginAction(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title="Sign in"
      description="Use your ASU email to access the scheduling platform."
      footer={
        <div className="space-y-4">
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">
            Don&apos;t have an account?{" "}
            <Link href="/register/student" className="font-medium text-[var(--color-primary)] hover:underline">
              Create student account
            </Link>
          </p>
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">
            Supervisor or administrator? Activate your invited account using the invitation sent to you.
          </p>
          {showDemoAccounts ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Demo accounts</CardTitle>
                <CardDescription>
                  Seeded review accounts. Shown only when ENABLE_DEMO_AUTH is on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                  >
                    <span>{account.role}</span>
                    <span className="text-[var(--color-muted-foreground)]">{account.email}</span>
                  </button>
                ))}
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Password for seeded demo accounts: Demo123!
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            ASU Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@asu.edu"
            required
            autoComplete="email"
            disabled={loading}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-[var(--color-primary)] hover:underline">
            Forgot password?
          </Link>
        </p>
      </form>
    </AuthScreen>
  );
}
