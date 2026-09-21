import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        That destination is not part of the scheduling platform.
      </p>
      <Link href="/">
        <Button>Go to home</Button>
      </Link>
    </div>
  );
}
