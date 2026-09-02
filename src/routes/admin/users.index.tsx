import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shell } from "@/components/erp/Shell";
import { useErpAuth } from "@/hooks/use-erp-auth";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { DESIGNATION_META, type Designation } from "@/lib/erp-config";
import { deleteUser, listUsers, setUserActive } from "@/lib/erp.functions";

export const Route = createFileRoute("/admin/users/")({
  head: () => ({
    meta: [
      { title: "User list — Marketing ERP admin" },
      {
        name: "description",
        content:
          "Browse, activate, deactivate and remove Marketing ERP users with their designation, status and password reset state.",
      },
      { property: "og:title", content: "User list — Marketing ERP admin" },
      {
        property: "og:description",
        content: "Manage every Marketing ERP team member from one list.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { profile } = useErpAuth();
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const toggleActive = useServerFn(setUserActive);
  const removeUser = useServerFn(deleteUser);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const activeMutation = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) => toggleActive({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success("User status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeUser({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("User deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const staff = users.filter((u) => u.designation !== "admin");

  return (
    <Shell
      nav={ADMIN_NAV}
      activeLabel="Users"
      navHrefs={{ Dashboard: "/admin", Users: "/admin/users", "Create User": "/admin/users/new" }}
      role="admin"
      userName={profile?.full_name ?? "Administrator"}
      userEmail={profile?.email ?? ""}
      title="Users"
      subtitle={`${staff.length} team member${staff.length === 1 ? "" : "s"}`}
      actions={
        <Button asChild size="sm">
          <Link to="/admin/users/new">
            <UserPlus className="mr-2 size-4" /> Create user
          </Link>
        </Button>
      }
    >
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 label-caps">Name</th>
              <th className="px-6 py-3 label-caps">Email</th>
              <th className="px-6 py-3 label-caps">Designation</th>
              <th className="px-6 py-3 label-caps">Password</th>
              <th className="px-6 py-3 label-caps">Active</th>
              <th className="px-6 py-3 label-caps text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  Loading users…
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  No users yet.
                </td>
              </tr>
            ) : (
              staff.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-3 font-medium">{user.full_name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {DESIGNATION_META[user.designation as Designation]?.label ?? user.designation}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={
                        user.must_reset_password
                          ? "text-xs font-medium text-warning-foreground"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {user.must_reset_password ? "Reset pending" : "Set by user"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) =>
                        activeMutation.mutate({ id: user.id, is_active: checked })
                      }
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete ${user.full_name}?`)) deleteMutation.mutate(user.id);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
