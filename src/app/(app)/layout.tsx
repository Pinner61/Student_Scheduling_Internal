import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { getNotifications } from "@/lib/services/data-service";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const notifications = getNotifications(user);
  return (
    <AppShell user={user} notifications={notifications}>
      {children}
    </AppShell>
  );
}
