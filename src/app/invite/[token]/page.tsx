import Link from "next/link";
import { AuthScreen } from "@/components/auth/auth-screen";
import { InviteActivationForm } from "@/components/auth/invite-activation-form";
import { hydrateAuthStateFromDatabase } from "@/lib/auth/persist";
import { publicInvitationState } from "@/lib/auth/service";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await hydrateAuthStateFromDatabase();
  const state = publicInvitationState(token);

  if (state.status === "expired") {
    return (
      <AuthScreen
        title="Invitation expired"
        description="Ask an administrator to send a new invitation."
        footer={
          <p className="text-center text-sm">
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              Return to sign in
            </Link>
          </p>
        }
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">Your invitation has expired.</p>
      </AuthScreen>
    );
  }

  if (state.status === "used") {
    return (
      <AuthScreen
        title="Invitation already used"
        description="This invitation has already been activated."
        footer={
          <p className="text-center text-sm">
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">Sign in with the password you created.</p>
      </AuthScreen>
    );
  }

  if (state.status !== "valid" || !state.email || !state.role) {
    return (
      <AuthScreen
        title="Invitation unavailable"
        description="This invitation link is invalid or was cancelled."
        footer={
          <p className="text-center text-sm">
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              Return to sign in
            </Link>
          </p>
        }
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Contact your administrator if you still need access.
        </p>
      </AuthScreen>
    );
  }

  return (
    <InviteActivationForm
      token={token}
      email={state.email}
      role={state.role}
      firstName={state.firstName ?? ""}
      lastName={state.lastName ?? ""}
    />
  );
}
