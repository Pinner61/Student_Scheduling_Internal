import { Badge } from "@/components/ui/badge";
import type { ExceptionStatus } from "@/types";

const config: Record<ExceptionStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  DECLINED: { label: "Declined", variant: "danger" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
