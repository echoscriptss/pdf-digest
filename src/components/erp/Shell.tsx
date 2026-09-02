import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DESIGNATION_META, type NavItem, type Role } from "@/lib/erp-config";

type ShellProps = {
  nav: NavItem[];
  activeLabel?: string;
  navHrefs?: Record<string, string>;
  role: Role;
  userName: string;
  userEmail: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function Shell({
  nav,
  activeLabel = "Dashboard",
  navHrefs,
  role,
  userName,
  userEmail,
  title,
  subtitle,
  actions,
  children,
}: ShellProps) {
  const meta = DESIGNATION_META[role];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
            M
          </span>
          <span className="font-display text-base font-semibold">Marketing ERP</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const href = navHrefs?.[item.label];
            const isActive = item.label === activeLabel;
            const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-shell-muted hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`;
            const content = (
              <>
                <item.icon className="size-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.soon ? (
                  <span className="rounded-full border border-sidebar-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-shell-muted">
                    TBD
                  </span>
                ) : null}
              </>
            );
            return href ? (
              <Link key={item.label} to={href} className={className}>
                {content}
              </Link>
            ) : (
              <button key={item.label} type="button" disabled className={`${className} cursor-not-allowed`}>
                {content}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="font-display text-sm font-medium">{userName}</p>
          <p className="truncate text-xs text-shell-muted">{userEmail}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-sidebar-primary">
            {meta.tier} · {meta.label}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4">
          <div>
            <p className="label-caps">{meta.label} portal</p>
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="panel p-5">
      <p className="label-caps">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
