import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus } from "@/lib/leads.functions";

export type Lead = {
  id: string;
  prospect_name: string;
  company: string;
  job_title: string | null;
  email: string;
  phone_number: string;
  linkedin_url: string;
  airport_code: string;
  meeting_date: string;
  crm_id: string | null;
  agent_id: string;
  status: LeadStatus;
  created_at: string;
};

export const STATUS_META: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-secondary text-secondary-foreground" },
  contacted: { label: "Contacted", className: "bg-primary/12 text-primary" },
  qualified: { label: "Qualified", className: "bg-success/15 text-success" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, prospect_name, company, job_title, email, phone_number, linkedin_url, airport_code, meeting_date, crm_id, agent_id, status, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

export async function fetchLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, prospect_name, company, job_title, email, phone_number, linkedin_url, airport_code, meeting_date, crm_id, agent_id, status, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Lead) ?? null;
}

export async function fetchAirports() {
  const { data, error } = await supabase
    .from("airport_reference")
    .select("airport_code, airport_name, city, state")
    .eq("is_active", true)
    .order("airport_code");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type LeadComment = {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  author?: string;
};

export async function fetchComments(leadId: string): Promise<LeadComment[]> {
  const { data, error } = await supabase
    .from("lead_comments")
    .select("id, comment_text, created_at, user_id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LeadComment[];
}

export async function addComment(leadId: string, userId: string, text: string) {
  const { error } = await supabase
    .from("lead_comments")
    .insert({ lead_id: leadId, user_id: userId, comment_text: text });
  if (error) throw new Error(error.message);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
  if (error) throw new Error(error.message);
}

/** Dashboard metrics per the Phase 2 definitions. */
export function leadMetrics(leads: Lead[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = leads.filter((l) => new Date(l.created_at) >= startOfMonth).length;
  const prevMonth = leads.filter((l) => {
    const d = new Date(l.created_at);
    return d >= startOfPrevMonth && d < startOfMonth;
  }).length;

  const monthlyChange =
    prevMonth === 0 ? (thisMonth > 0 ? 100 : 0) : ((thisMonth - prevMonth) / prevMonth) * 100;

  const qualified = leads.filter((l) => l.status === "qualified").length;
  const qualifiedRate = leads.length === 0 ? 0 : (qualified / leads.length) * 100;

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = leads.filter((l) => new Date(l.created_at) >= weekAgo).length;

  return {
    total: leads.length,
    monthlyChange,
    hadPrevMonth: prevMonth > 0,
    qualified,
    qualifiedRate,
    newThisWeek,
  };
}
