import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const leadInput = z.object({
  prospect_name: z.string().min(2, "Prospect name is required").max(120),
  company: z.string().min(2, "Company is required").max(120),
  job_title: z.string().max(120).optional().nullable(),
  email: z.string().email("Enter a valid email"),
  phone_number: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[+()\-\s\d]+$/, "Enter a valid phone number"),
  linkedin_url: z.string().url("Enter a valid LinkedIn URL"),
  airport_code: z.string().min(3).max(4),
  meeting_date: z.string().min(8),
  crm_id: z.string().uuid().optional().nullable(),
});

const normalizePhone = (value: string) => value.replace(/\D/g, "");

/** Creates a lead for the signed-in agent after a cross-agent duplicate check. */
export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => leadInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.trim().toLowerCase();
    const phoneDigits = normalizePhone(data.phone_number);

    const { data: existingRows, error: dupError } = await supabaseAdmin
      .from("leads")
      .select("id, prospect_name, company, email, phone_number, agent_id");
    if (dupError) throw new Error(dupError.message);

    const match = (existingRows ?? []).find((lead) => {
      if (lead.email.trim().toLowerCase() === email) return true;
      if (normalizePhone(lead.phone_number) === phoneDigits) return true;
      return (
        lead.prospect_name.trim().toLowerCase() === data.prospect_name.trim().toLowerCase() &&
        lead.company.trim().toLowerCase() === data.company.trim().toLowerCase()
      );
    });

    if (match) {
      const { data: owner } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", match.agent_id)
        .maybeSingle();
      return {
        duplicate: true as const,
        ownerName: owner?.full_name ?? "another agent",
        ownerEmail: owner?.email ?? "",
      };
    }

    const { data: created, error } = await context.supabase
      .from("leads")
      .insert({
        prospect_name: data.prospect_name.trim(),
        company: data.company.trim(),
        job_title: data.job_title?.trim() || null,
        email,
        phone_number: data.phone_number.trim(),
        linkedin_url: data.linkedin_url.trim(),
        airport_code: data.airport_code,
        meeting_date: data.meeting_date,
        crm_id: data.crm_id || null,
        agent_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { duplicate: false as const, id: created.id };
  });

/** CRM users an agent can assign a lead to. */
export const listCrmOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("designation", "crm")
      .eq("is_active", true)
      .order("full_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
