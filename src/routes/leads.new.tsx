import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { ROLE_NAV, type Designation } from "@/lib/erp-config";
import { fetchAirports } from "@/lib/leads";
import { createLead, listCrmOptions } from "@/lib/leads.functions";
import { AGENT_NAV_HREFS } from "./leads.index";

export const Route = createFileRoute("/leads/new")({
  head: () => ({
    meta: [
      { title: "Add new lead — Marketing ERP" },
      {
        name: "description",
        content:
          "Capture a prospect with company, contact details, LinkedIn, USA airport code and meeting date, with duplicate-lead detection before saving.",
      },
      { property: "og:title", content: "Add new lead — Marketing ERP" },
      {
        property: "og:description",
        content: "Validated lead capture with duplicate detection for Marketing ERP agents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewLeadPage,
});

type Errors = Partial<Record<string, string>>;

function NewLeadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, profile, loading } = useErpAuth();
  const submitLead = useServerFn(createLead);
  const fetchCrms = useServerFn(listCrmOptions);

  const [form, setForm] = useState({
    prospect_name: "",
    company: "",
    job_title: "",
    email: "",
    phone_number: "",
    linkedin_url: "",
    airport_code: "",
    meeting_date: "",
    crm_id: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [airportQuery, setAirportQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/" });
    else if (profile?.must_reset_password) navigate({ to: "/reset-password" });
  }, [loading, session, profile, navigate]);

  const { data: airports = [] } = useQuery({
    queryKey: ["airports"],
    queryFn: fetchAirports,
    enabled: Boolean(session),
  });
  const { data: crms = [] } = useQuery({
    queryKey: ["crm-options"],
    queryFn: () => fetchCrms(),
    enabled: Boolean(session),
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Errors = {};
    if (form.prospect_name.trim().length < 2) next.prospect_name = "Prospect name is required";
    if (form.company.trim().length < 2) next.company = "Company is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.phone_number.replace(/\D/g, "").length < 7)
      next.phone_number = "Enter a valid phone number";
    if (!/^https?:\/\/.+/.test(form.linkedin_url)) next.linkedin_url = "Enter a valid LinkedIn URL";
    if (!form.airport_code) next.airport_code = "Select a location airport code";
    if (!form.meeting_date) next.meeting_date = "Select the date of meeting";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDuplicate(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await submitLead({
        data: {
          prospect_name: form.prospect_name,
          company: form.company,
          job_title: form.job_title || null,
          email: form.email,
          phone_number: form.phone_number,
          linkedin_url: form.linkedin_url,
          airport_code: form.airport_code,
          meeting_date: form.meeting_date,
          crm_id: form.crm_id || null,
        },
      });
      if (result.duplicate) {
        setDuplicate(
          `This lead already exists. Please contact Admin or the Agent who created this lead: ${result.ownerName}${result.ownerEmail ? ` (${result.ownerEmail})` : ""}.`,
        );
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead created");
      navigate({ to: "/leads/$leadId", params: { leadId: result.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the lead");
    } finally {
      setSubmitting(false);
    }
  };

  const designation = (profile?.designation ?? "agent") as Designation;
  const filteredAirports = airports.filter((a) => {
    const q = airportQuery.trim().toLowerCase();
    if (!q) return true;
    return `${a.airport_code} ${a.airport_name} ${a.city} ${a.state}`.toLowerCase().includes(q);
  });

  const field = (key: string) =>
    errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null;

  return (
    <Shell
      nav={ROLE_NAV[designation] ?? ROLE_NAV.agent}
      activeLabel="Add Lead"
      navHrefs={AGENT_NAV_HREFS}
      role={designation}
      userName={profile?.full_name ?? ""}
      userEmail={profile?.email ?? ""}
      title="Add new lead"
      subtitle="Fields marked * are mandatory"
    >
      <form className="panel max-w-3xl space-y-5 p-6" onSubmit={submit}>
        {duplicate ? (
          <div className="flex items-start gap-3 rounded-lg border border-warning bg-warning/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 text-warning-foreground" />
            <p className="text-warning-foreground">{duplicate}</p>
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prospect_name">Prospect name *</Label>
            <Input
              id="prospect_name"
              value={form.prospect_name}
              onChange={(e) => set("prospect_name", e.target.value)}
            />
            {field("prospect_name")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
            {field("company")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_title">Job title</Label>
            <Input
              id="job_title"
              value={form.job_title}
              onChange={(e) => set("job_title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {field("email")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone number *</Label>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => set("phone_number", e.target.value)}
              placeholder="+1 555 010 2030"
            />
            {field("phone_number")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL *</Label>
            <Input
              id="linkedin_url"
              value={form.linkedin_url}
              onChange={(e) => set("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
            {field("linkedin_url")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="airport_code">Location (USA airport code) *</Label>
            <Select value={form.airport_code} onValueChange={(v) => set("airport_code", v)}>
              <SelectTrigger id="airport_code">
                <SelectValue placeholder="Search and select airport" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search airports"
                    value={airportQuery}
                    onChange={(e) => setAirportQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredAirports.map((a) => (
                  <SelectItem key={a.airport_code} value={a.airport_code}>
                    {a.airport_code} — {a.city}, {a.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field("airport_code")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_date">Date of meeting *</Label>
            <Input
              id="meeting_date"
              type="date"
              value={form.meeting_date}
              onChange={(e) => set("meeting_date", e.target.value)}
            />
            {field("meeting_date")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="crm_id">Customer relationship manager</Label>
            <Select value={form.crm_id} onValueChange={(v) => set("crm_id", v)}>
              <SelectTrigger id="crm_id">
                <SelectValue placeholder="Select CRM (optional)" />
              </SelectTrigger>
              <SelectContent>
                {crms.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No CRM users yet</div>
                ) : (
                  crms.map((crm) => (
                    <SelectItem key={crm.id} value={crm.id}>
                      {crm.full_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agent name</Label>
            <Input value={profile?.full_name ?? ""} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label>Manager name</Label>
            <Input value="TBD" readOnly disabled />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/leads" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save lead"}
          </Button>
        </div>
      </form>
    </Shell>
  );
}
