"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { getNavItems, roleLabel } from "@/lib/auth/rbac";
import type { SessionUser } from "@/types";
import { RoleSwitcher } from "@/components/dev/role-switcher";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationBell } from "@/features/notifications/notification-bell";
import type { AppNotification } from "@/types";

interface AppShellProps {
  user: SessionUser;
  notifications?: AppNotification[];
  showRoleSwitcher?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  user,
  notifications = [],
  showRoleSwitcher = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavItems(user.role);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-md p-2 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href={navItems[0].href} className="font-semibold text-[var(--color-primary)]">
              ASU Creative Strategy
            </Link>
            <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
              Scheduling
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications} />
            {showRoleSwitcher && <RoleSwitcher currentUser={user} />}
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-medium leading-tight">
                {user.firstName} {user.lastName}
              </span>
              <span className="block text-xs text-[var(--color-muted-foreground)]">
                {roleLabel(user.role)}
              </span>
            </span>
            <Link
              href="/profile"
              className="hidden text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] sm:inline"
            >
              Profile
            </Link>
            <SignOutButton />
          </div>
        </div>
        <nav
          className={cn(
            "border-t border-[var(--color-border)] bg-white lg:block",
            mobileOpen ? "block" : "hidden lg:block"
          )}
          aria-label="Main navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2 sm:flex-row sm:gap-0 sm:px-6">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-muted-foreground)]">
        ASU University College · Creative Strategy · Internal Scheduling Platform
      </footer>
    </div>
  );
}
