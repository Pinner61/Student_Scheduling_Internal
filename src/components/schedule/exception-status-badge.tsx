import { Badge } from "@/components/ui/badge";
import type { ExceptionStatus } from "@/types";
import { exceptionStatusLabel } from "@/components/schedule/schedule-language";

const config: Record<ExceptionStatus, { variant: "success" | "warning" | "danger" | "neutral" }> = {
  PENDING: { variant: "warning" },
  APPROVED: { variant: "success" },
  DECLINED: { variant: "danger" },
  CANCELLED: { variant: "neutral" },
};

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  const { variant } = config[status];
  return <Badge variant={variant}>{exceptionStatusLabel(status)}</Badge>;
}
