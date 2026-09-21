"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        {error.message === "Unauthorized"
          ? "You don’t have permission to do that, or your session expired. Sign in again and retry."
          : error.message || "An unexpected error occurred. You can try again or return to the previous page."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
