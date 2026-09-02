import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Shell, StatCard } from "@/components/erp/Shell";
import { useErpAuth } from "@/hooks/use-erp-auth";
import { DESIGNATION_META, ROLE_NAV, ROLE_PANELS, type Designation } from "@/lib/erp-config";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Marketing ERP" },
      {
        name: "description",
        content:
          "Role-based Marketing ERP dashboard for Managers, CRM, Team Leads and Agents with team, lead and task overviews.",
      },
      { property: "og:title", content: "Your dashboard — Marketing ERP" },
      {
        property: "og:description",
        content: "Tier-based Marketing ERP dashboards tailored to each designation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useErpAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/" });
    else if (profile?.must_reset_password) navigate({ to: "/reset-password" });
    else if (profile?.designation === "admin") navigate({ to: "/admin" });
  }, [loading, session, profile, navigate]);

  if (loading || !profile || profile.designation === "admin") {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  const designation = profile.designation as Designation;
  const panel = ROLE_PANELS[designation];
  const meta = DESIGNATION_META[designation];

  return (
    <Shell
      nav={ROLE_NAV[designation]}
      navHrefs={{ Dashboard: "/dashboard" }}
      role={designation}
      userName={profile.full_name}
      userEmail={profile.email}
      title={panel.title}
      subtitle={`${meta.tier} · ${meta.blurb}`}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open leads" value="—" hint="Available in Phase 2" />
          <StatCard label="Follow-ups today" value="—" hint="Available in Phase 2" />
          <StatCard label="Tasks" value="—" hint="Available in Phase 2" />
          <StatCard label="Conversion" value="—" hint="Available in Phase 2" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {panel.cards.map((card) => (
            <div key={card} className="panel p-6">
              <p className="label-caps">{card}</p>
              <div className="mt-4 grid h-40 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Module scheduled for a later phase
              </div>
            </div>
          ))}
        </div>

        <div className="panel p-6">
          <p className="label-caps">Your access</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Designation</p>
              <p className="font-display font-medium">{meta.label}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tier</p>
              <p className="font-display font-medium">{meta.tier}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="font-display font-medium">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
