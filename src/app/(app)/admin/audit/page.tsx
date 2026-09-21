import { Suspense } from "react";
import { getAuditLogs, listUsers } from "@/lib/services/data-service";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AuditFilters } from "@/features/audit/audit-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { AUDIT_ACTION_LABEL } from "@/components/schedule/schedule-language";

interface PageProps {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    user?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const users = listUsers();
  const logs = getAuditLogs({
    action: params.action,
    entityType: params.entityType,
    userId: params.user,
    from: params.from,
    to: params.to,
  });

  const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Traceability for scheduling and administrative changes
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <AuditFilters users={users} />
      </Suspense>

      {logs.length === 0 ? (
        <EmptyState
          title="No audit events match these filters"
          description="Availability changes, exception reviews, and user status changes will appear here."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-[var(--color-muted)]">
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Actor</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        timeZone: "America/Phoenix",
                      })}
                    </td>
                    <td className="px-4 py-3">{userMap.get(log.actorUserId) ?? "System"}</td>
                    <td className="px-4 py-3">
                      {AUDIT_ACTION_LABEL[log.action] ?? log.action.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {log.entityType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
