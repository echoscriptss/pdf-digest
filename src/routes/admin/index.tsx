import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Shell, StatCard } from "@/components/erp/Shell";
import { useErpAuth } from "@/hooks/use-erp-auth";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { DESIGNATION_META, type Designation } from "@/lib/erp-config";
import { listUsers } from "@/lib/erp.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Marketing ERP" },
      {
        name: "description",
        content:
          "Marketing ERP admin dashboard: total users, designation breakdown, pending password resets and recent activity.",
      },
      { property: "og:title", content: "Admin dashboard — Marketing ERP" },
      {
        property: "og:description",
        content: "Monitor users, designations and pending password resets in Marketing ERP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { profile } = useErpAuth();
  const fetchUsers = useServerFn(listUsers);
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });

  const staff = users.filter((u) => u.designation !== "admin");
  const count = (role: Designation) => staff.filter((u) => u.designation === role).length;
  const pending = staff.filter((u) => u.must_reset_password).length;

  return (
    <Shell
      nav={ADMIN_NAV}
      navHrefs={{ Dashboard: "/admin", Users: "/admin/users", "Create User": "/admin/users/new" }}
      role="admin"
      userName={profile?.full_name ?? "Administrator"}
      userEmail={profile?.email ?? ""}
      title="Admin dashboard"
      subtitle="User management and role-based access overview"
      actions={
        <Button asChild size="sm">
          <Link to="/admin/users/new">
            <UserPlus className="mr-2 size-4" /> Create user
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total users" value={staff.length} hint="Excluding admin accounts" />
          <StatCard
            label="Active users"
            value={staff.filter((u) => u.is_active).length}
            hint="Enabled accounts"
          />
          <StatCard label="Pending resets" value={pending} hint="First-time password pending" />
          <StatCard
            label="Designations"
            value={4}
            hint="Manager · CRM · Team Lead · Agent"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(["manager", "crm", "team_lead", "agent"] as Designation[]).map((role) => (
            <StatCard
              key={role}
              label={DESIGNATION_META[role].label}
              value={count(role)}
              hint={DESIGNATION_META[role].tier}
            />
          ))}
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="label-caps">Recently created users</p>
            <Link to="/admin/users" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {staff.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No users yet. Create your first team member to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {staff.slice(0, 5).map((user) => (
                <li key={user.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                    {DESIGNATION_META[user.designation as Designation]?.label ?? user.designation}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
