import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Briefcase, CalendarDays, Mail, MapPin, Phone, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shell } from "@/components/erp/Shell";
import { useErpAuth } from "@/hooks/use-erp-auth";
import { ROLE_NAV, type Designation } from "@/lib/erp-config";
import { fetchLeads, STATUS_META } from "@/lib/leads";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads.functions";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads — Marketing ERP agent workspace" },
      {
        name: "description",
        content:
          "Browse lead cards, search prospects and filter by status (New, Contacted, Qualified, Closed) in the Marketing ERP agent workspace.",
      },
      { property: "og:title", content: "Leads — Marketing ERP agent workspace" },
      {
        property: "og:description",
        content: "Search, filter and open lead cards created by your team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadsPage,
});

export const AGENT_NAV_HREFS = {
  Dashboard: "/dashboard",
  Leads: "/leads",
  "Add Lead": "/leads/new",
};

function LeadsPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useErpAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/" });
    else if (profile?.must_reset_password) navigate({ to: "/reset-password" });
  }, [loading, session, profile, navigate]);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    enabled: Boolean(session),
  });

  const term = search.trim().toLowerCase();
  const visible = leads.filter((lead) => {
    const matchesStatus = status === "all" || lead.status === status;
    const matchesTerm =
      term.length === 0 ||
      [lead.prospect_name, lead.company, lead.email, lead.phone_number, lead.airport_code]
        .join(" ")
        .toLowerCase()
        .includes(term);
    return matchesStatus && matchesTerm;
  });

  const designation = (profile?.designation ?? "agent") as Designation;

  return (
    <Shell
      nav={ROLE_NAV[designation] ?? ROLE_NAV.agent}
      activeLabel="Leads"
      navHrefs={AGENT_NAV_HREFS}
      role={designation}
      userName={profile?.full_name ?? ""}
      userEmail={profile?.email ?? ""}
      title="Leads"
      subtitle={`${visible.length} of ${leads.length} lead${leads.length === 1 ? "" : "s"}`}
      actions={
        <Button asChild size="sm">
          <Link to="/leads/new">
            <Plus className="mr-2 size-4" /> Add new lead
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search prospect, company, email, phone or airport"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search leads"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus | "all")}>
            <SelectTrigger className="w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading leads…</p>
        ) : visible.length === 0 ? (
          <div className="panel grid place-items-center p-12 text-center">
            <p className="font-display text-lg font-medium">No leads found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust your search or status filter, or create a new lead.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/leads/new">Add new lead</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((lead) => (
              <Link
                key={lead.id}
                to="/leads/$leadId"
                params={{ leadId: lead.id }}
                className="panel block p-5 transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-semibold">{lead.prospect_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.job_title ? `${lead.job_title} · ` : ""}
                      {lead.company}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_META[lead.status].className}`}
                  >
                    {STATUS_META[lead.status].label}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Mail className="size-3.5" /> {lead.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5" /> {lead.phone_number}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-3.5" /> {lead.airport_code}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-3.5" /> Meeting {lead.meeting_date}
                  </p>
                  <p className="flex items-center gap-2">
                    <Briefcase className="size-3.5" /> Added{" "}
                    {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
