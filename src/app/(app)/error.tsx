"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">This page couldn’t load</h1>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        {error.message === "Unauthorized" || error.message.includes("permission")
          ? "You don’t have permission to view this page."
          : "An unexpected error occurred. You can try again."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
