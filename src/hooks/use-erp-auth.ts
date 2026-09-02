import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/erp-config";

export type ErpProfile = {
  id: string;
  full_name: string;
  email: string;
  designation: Role;
  is_active: boolean;
  must_reset_password: boolean;
};

export function useErpAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ErpProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, designation, is_active, must_reset_password")
        .eq("id", nextSession.user.id)
        .maybeSingle();
      if (!active) return;
      setProfile((data as ErpProfile) ?? null);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => load(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      void load(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, loading };
}
