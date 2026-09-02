import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useErpAuth } from "@/hooks/use-erp-auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Marketing ERP" },
      {
        name: "description",
        content:
          "Set a new password for your Marketing ERP account before accessing your role-based dashboard.",
      },
      { property: "og:title", content: "Reset your password — Marketing ERP" },
      {
        property: "og:description",
        content: "First-time password reset for Marketing ERP team members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

const rules = (value: string) => [
  { label: "At least 8 characters", ok: value.length >= 8 },
  { label: "One uppercase letter", ok: /[A-Z]/.test(value) },
  { label: "One number", ok: /\d/.test(value) },
];

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useErpAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const checks = rules(password);
  const valid = checks.every((c) => c.ok) && password === confirm;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || !profile) return;
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    await supabase.from("profiles").update({ must_reset_password: false }).eq("id", profile.id);
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="panel w-full max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <h1 className="mt-4 text-2xl font-semibold">Password reset successful</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can now continue to your {profile ? profile.designation.replace("_", " ") : ""}{" "}
            dashboard.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() =>
              navigate({ to: profile?.designation === "admin" ? "/admin" : "/dashboard" })
            }
          >
            Continue to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="panel w-full max-w-md p-8">
        <KeyRound className="size-8 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For security reasons you must set your own password before accessing the ERP.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <ul className="space-y-1 text-xs">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "text-success" : "text-muted-foreground"}>
                • {c.label}
              </li>
            ))}
            <li
              className={
                confirm.length > 0 && password === confirm ? "text-success" : "text-muted-foreground"
              }
            >
              • Passwords match
            </li>
          </ul>

          <Button type="submit" className="w-full" disabled={!valid || submitting}>
            {submitting ? "Saving…" : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
