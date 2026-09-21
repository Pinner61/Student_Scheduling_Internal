"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { getNavItems } from "@/lib/auth/rbac";
import type { SessionUser } from "@/types";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "@/components/dev/role-switcher";

const showRoleSwitcher =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true";

interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
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
            {showRoleSwitcher && <RoleSwitcher currentUser={user} />}
            <span className="hidden text-sm sm:inline">
              {user.firstName} {user.lastName}
            </span>
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
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
