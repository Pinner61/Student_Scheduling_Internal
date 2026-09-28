import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/rbac";
import { isDemoAuthEnabled } from "@/lib/config";
import { ACCOUNT_DISABLED_MESSAGE, PENDING_ACCOUNT_MESSAGE } from "@/lib/auth/errors";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(getRoleHomePath(user.role));
  }
  const params = await searchParams;
  const initialError =
    params.error === "disabled"
      ? ACCOUNT_DISABLED_MESSAGE
      : params.error === "pending"
        ? PENDING_ACCOUNT_MESSAGE
        : params.error === "callback"
          ? "Unable to complete email confirmation. Try signing in again."
          : undefined;
  return <LoginForm showDemoAccounts={isDemoAuthEnabled()} initialError={initialError} />;
}
