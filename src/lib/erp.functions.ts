import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DESIGNATIONS = ["manager", "crm", "team_lead", "agent"] as const;
export type Designation = (typeof DESIGNATIONS)[number];

export const DEMO_ADMIN_EMAIL = "admin@marketingerp.app";
export const DEMO_ADMIN_PASSWORD = "admin123";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

/** Creates the Phase 1 default admin account if no admin exists yet. */
export const bootstrapAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", "admin")
    .limit(1);

  if (existing && existing.length > 0) {
    return { created: false, email: DEMO_ADMIN_EMAIL };
  }

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "System Administrator" },
  });
  if (error || !created.user) throw new Error(error?.message ?? "Could not create admin");

  await supabaseAdmin.from("profiles").insert({
    id: created.user.id,
    full_name: "System Administrator",
    email: DEMO_ADMIN_EMAIL,
    designation: "admin",
    must_reset_password: false,
  });
  await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });

  return { created: true, email: DEMO_ADMIN_EMAIL };
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(120),
        email: z.string().email(),
        password: z.string().min(6).max(72),
        designation: z.enum(DESIGNATIONS),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create the user");

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      full_name: data.full_name,
      email: data.email,
      designation: data.designation,
      must_reset_password: true,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileError.message);
    }

    await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      role: data.designation,
    });

    return { id: created.user.id, email: data.email, temporaryPassword: data.password };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, designation, is_active, must_reset_password, created_at, last_login_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(6).max(72) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").update({ must_reset_password: true }).eq("id", data.id);
    return { ok: true };
  });

/** Admin edit of an existing user: name, email, designation and optional new password. */
export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().min(2).max(120),
        email: z.string().email(),
        designation: z.enum(DESIGNATIONS),
        password: z.string().min(6).max(72).optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authUpdate: { email: string; password?: string } = { email: data.email };
    if (data.password) authUpdate.password = data.password;
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.id, authUpdate);
    if (authError) throw new Error(authError.message);

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        email: data.email,
        designation: data.designation,
        ...(data.password ? { must_reset_password: true } : {}),
      })
      .eq("id", data.id);
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.id, role: data.designation });
    if (roleError) throw new Error(roleError.message);

    return { ok: true };
  });

