import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useErpAuth } from "@/hooks/use-erp-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const { session, profile, loading } = useErpAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/" });
    else if (profile && profile.designation !== "admin") navigate({ to: "/dashboard" });
  }, [loading, session, profile, navigate]);

  if (loading || !profile || profile.designation !== "admin") {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  return <Outlet />;
}
