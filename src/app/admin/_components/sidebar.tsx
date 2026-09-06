"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/security/csrf-client";
import type { AdminNavGroup } from "./nav-data";

function NavGroup({ group, pathname, onNavigate }: { group: AdminNavGroup; pathname: string; onNavigate: () => void }) {
  const isActiveHref = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const groupActive = group.href
    ? isActiveHref(group.href)
    : (group.items ?? []).some((i) => isActiveHref(i.href));
  const [open, setOpen] = React.useState(groupActive);

  if (!group.items) {
    return (
      <Link
        href={group.href!}
        onClick={onNavigate}
        className={cn(
          "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
          groupActive ? "bg-accent-muted text-accent" : "text-foreground hover:bg-white/5",
        )}
      >
        {group.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          groupActive ? "text-accent" : "text-foreground hover:bg-white/5",
        )}
      >
        <span>{group.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5 border-r border-border pr-3 mr-3">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActiveHref(item.href) ? "bg-accent-muted text-accent" : "text-muted hover:bg-white/5 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({
  groups,
  userName,
  userRole,
}: {
  groups: AdminNavGroup[];
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await csrfFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <NavGroup key={g.label} group={g} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-foreground hover:bg-white/5"
          aria-label="باز کردن منو"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-gradient-accent">پنل مدیریت</span>
        <div className="w-9" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col bg-surface border-l border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-gradient-accent">پنل مدیریت</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-foreground hover:bg-white/5"
                aria-label="بستن منو"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <UserFooter userName={userName} userRole={userRole} loggingOut={loggingOut} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Desktop persistent sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:border-l md:border-border md:bg-surface">
        <div className="px-5 py-5 border-b border-border">
          <span className="text-lg font-bold text-gradient-accent">پنل مدیریت</span>
        </div>
        {nav}
        <UserFooter userName={userName} userRole={userRole} loggingOut={loggingOut} onLogout={handleLogout} />
      </aside>
    </>
  );
}

function UserFooter({
  userName,
  userRole,
  loggingOut,
  onLogout,
}: {
  userName: string;
  userRole: string;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{userName}</p>
          <p className="truncate text-xs text-muted">{userRole}</p>
        </div>
        <button
          type="button"
          disabled={loggingOut}
          onClick={onLogout}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-accent disabled:opacity-50"
          aria-label="خروج"
          title="خروج"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
