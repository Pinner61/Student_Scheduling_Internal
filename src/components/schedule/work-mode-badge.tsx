import { Badge } from "@/components/ui/badge";

export function WorkModeBadge({ mode }: { mode: "OFFICE" | "REMOTE" }) {
  return (
    <Badge variant={mode === "OFFICE" ? "office" : "remote"}>
      {mode === "OFFICE" ? "Office" : "Remote"}
    </Badge>
  );
}
