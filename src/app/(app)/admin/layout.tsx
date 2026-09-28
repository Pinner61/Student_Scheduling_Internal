import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "administrator") redirect(getRoleHomePath(user.role));
  return children;
}
