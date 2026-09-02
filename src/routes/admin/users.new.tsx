import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shell } from "@/components/erp/Shell";
import { useErpAuth } from "@/hooks/use-erp-auth";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { DESIGNATION_META, DESIGNATION_OPTIONS, type Designation } from "@/lib/erp-config";
import { createUser } from "@/lib/erp.functions";

export const Route = createFileRoute("/admin/users/new")({
  head: () => ({
    meta: [
      { title: "Create user — Marketing ERP admin" },
      {
        name: "description",
        content:
          "Create a Marketing ERP account with name, email, temporary password and designation, then share first-login instructions.",
      },
      { property: "og:title", content: "Create user — Marketing ERP admin" },
      {
        property: "og:description",
        content: "Admin-controlled user creation with tier-based designations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateUserPage,
});

const randomPassword = () =>
  Array.from({ length: 10 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789".charAt(
      Math.floor(Math.random() * 55),
    ),
  ).join("");

function CreateUserPage() {
  const navigate = useNavigate();
  const { profile } = useErpAuth();
  const queryClient = useQueryClient();
  const submitCreate = useServerFn(createUser);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(randomPassword());
  const [designation, setDesignation] = useState<Designation | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!designation) {
      toast.error("Select a designation");
      return;
    }
    setSubmitting(true);
    try {
      await submitCreate({
        data: { full_name: fullName, email, password, designation },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreated({ email, password });
      toast.success("User created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the user");
    } finally {
      setSubmitting(false);
    }
  };

  const welcomeMessage = created
    ? `Subject: Welcome to Marketing ERP

Hello ${fullName},

Your Marketing ERP account has been created.

Login Email: ${created.email}
Temporary Password: ${created.password}

Please sign in and reset your password. For security reasons, you must reset your password before accessing the ERP.

Regards,
Marketing ERP Admin`
    : "";

  return (
    <Shell
      nav={ADMIN_NAV}
      activeLabel="Create User"
      navHrefs={{ Dashboard: "/admin", Users: "/admin/users", "Create User": "/admin/users/new" }}
      role="admin"
      userName={profile?.full_name ?? "Administrator"}
      userEmail={profile?.email ?? ""}
      title="Create user"
      subtitle="Add a team member and assign their designation"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <form className="panel space-y-5 p-6" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temp-password">Temporary password</Label>
            <div className="flex gap-2">
              <Input
                id="temp-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPassword(randomPassword())}
                aria-label="Generate password"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The user must change this password at first login.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Select value={designation} onValueChange={(v) => setDesignation(v as Designation)}>
              <SelectTrigger id="designation">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {DESIGNATION_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {DESIGNATION_META[role].tier} · {DESIGNATION_META[role].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/users" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>

        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <p className="label-caps">Welcome message</p>
          </div>

          {created ? (
            <>
              <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed">
                {welcomeMessage}
              </pre>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(welcomeMessage);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Copy className="mr-2 size-4" /> Copy credentials
                </Button>
                <Button size="sm" onClick={() => navigate({ to: "/admin/users" })}>
                  Go to user list
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              After the account is created, the login email and temporary password appear here so you
              can send them to the user. They will be forced to reset the password on first login.
            </p>
          )}

          <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Hierarchy</p>
            <ul className="mt-2 space-y-1">
              {DESIGNATION_OPTIONS.map((role) => (
                <li key={role}>
                  {DESIGNATION_META[role].tier} · {DESIGNATION_META[role].label} —{" "}
                  {DESIGNATION_META[role].blurb}
                </li>
              ))}
            </ul>
            <Link to="/admin/users" className="mt-3 inline-block text-primary hover:underline">
              View all users
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
