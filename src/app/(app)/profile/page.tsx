import { getSessionUser } from "@/lib/auth/session";
import { getUser, getAvailability, getExceptions } from "@/lib/services/data-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { recurringToWeeklyRanges } from "@/lib/schedule/engine";
import { getDayName, formatTimeRange } from "@/lib/utils/time";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const profile = getUser(user.id);
  const availability = getAvailability(user.id);
  const weeklyRanges = recurringToWeeklyRanges(availability);
  const exceptions = getExceptions(user.id)
    .filter((e) => e.status === "PENDING" || e.status === "APPROVED")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {profile?.firstName} {profile?.lastName}
          </p>
          <p>
            <span className="font-medium">Email:</span> {profile?.email}
          </p>
          <p>
            <span className="font-medium">Role:</span>{" "}
            <span className="capitalize">{profile?.role}</span>
          </p>
          <p>
            <span className="font-medium">Team:</span> {profile?.teamName ?? "Unassigned"}
          </p>
          <p>
            <span className="font-medium">Status:</span>{" "}
            <Badge variant={profile?.status === "active" ? "success" : "neutral"}>
              {profile?.status}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recurring availability</CardTitle>
        </CardHeader>
        <CardContent>
          {[1, 2, 3, 4, 5].map((day) => {
            const ranges = weeklyRanges.get(day) ?? [];
            if (ranges.length === 0) return null;
            return (
              <div key={day} className="mb-3">
                <h3 className="text-sm font-medium">{getDayName(day)}</h3>
                <ul className="mt-1 space-y-1 text-sm text-[var(--color-muted-foreground)]">
                  {ranges.map((r, i) => (
                    <li key={i}>
                      {formatTimeRange(r.startTime, r.endTime)} —{" "}
                      {r.workMode === "OFFICE" ? "Office" : "Remote"}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {availability.length === 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No recurring availability set.
            </p>
          )}
        </CardContent>
      </Card>

      {exceptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {exceptions.map((ex) => (
                <li key={ex.id}>
                  {ex.exceptionDate} — {formatTimeRange(ex.startTime, ex.endTime)} ({ex.status})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
