import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useErpAuth } from "@/hooks/use-erp-auth";
import { bootstrapAdmin, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/erp.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marketing ERP — Sign in to the Admin & User Portal" },
      {
        name: "description",
        content:
          "Marketing ERP Phase 1: secure sign-in for administrators and team members with role-based dashboards for Manager, CRM, Team Lead and Agent.",
      },
      { property: "og:title", content: "Marketing ERP — Admin & User Portal" },
      {
        property: "og:description",
        content:
          "Role-based marketing ERP with admin-controlled user creation, first-time password reset and tier dashboards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useErpAuth();
  const [mode, setMode] = useState<"admin" | "user">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void bootstrapAdmin().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (loading || !session || !profile) return;
    if (profile.must_reset_password) {
      navigate({ to: "/reset-password" });
    } else if (profile.designation === "admin") {
      navigate({ to: "/admin" });
    } else {
      navigate({ to: "/dashboard" });
    }
  }, [loading, session, profile, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
  };

  const useDemo = () => {
    setEmail(DEMO_ADMIN_EMAIL);
    setPassword(DEMO_ADMIN_PASSWORD);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-brand-gradient p-12 text-shell-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-accent font-display font-bold text-accent-foreground">
            M
          </span>
          <span className="font-display text-lg font-semibold">Marketing ERP</span>
        </div>

        <div className="max-w-md">
          <p className="label-caps text-shell-muted">Phase 1</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
            Admin &amp; User Management for your marketing operation.
          </h2>
          <p className="mt-4 text-sm text-shell-muted">
            Secure authentication, admin-controlled user creation, designation tiers and
            role-based dashboards — the foundation for Leads, Customers, Campaigns and Analytics.
          </p>
          <ul className="mt-8 space-y-2 text-sm">
            {["Tier 1 · Manager", "Tier 2 · CRM", "Tier 3 · Team Lead", "Tier 4 · Agent"].map((tier) => (
              <li key={tier} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                {tier}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-shell-muted">Marketing ERP — Phase 1 reference build</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="panel w-full max-w-md p-8">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                mode === "admin" ? "bg-card font-medium shadow-sm" : "text-muted-foreground"
              }`}
            >
              <ShieldCheck className="size-4" /> Admin
            </button>
            <button
              type="button"
              onClick={() => setMode("user")}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                mode === "user" ? "bg-card font-medium shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Users className="size-4" /> User
            </button>
          </div>

          <h1 className="text-2xl font-semibold">
            {mode === "admin" ? "Admin login" : "User login"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "admin"
              ? "Sign in to manage users and designations."
              : "Use the credentials your administrator sent you."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Login"}
            </Button>
          </form>

          {mode === "admin" ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Phase 1 default admin</p>
              <p className="mt-1">
                {DEMO_ADMIN_EMAIL} / {DEMO_ADMIN_PASSWORD}
              </p>
              <p className="mt-1">Change this before production use.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={useDemo}>
                Fill admin credentials
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
