import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, role, family_id, current_xp, level, expiry_notify_days")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id) {
    redirect("/onboarding");
  }

  return { supabase, user, profile };
}
