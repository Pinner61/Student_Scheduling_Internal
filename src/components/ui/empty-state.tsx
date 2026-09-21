import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center",
        className
      )}
    >
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-muted-foreground)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
