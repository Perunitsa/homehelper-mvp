"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateExpiryNotifyDaysAction(formData: FormData) {
  const raw = getString(formData, "expiryNotifyDays");
  const value = Number(raw);
  const expiry_notify_days = Number.isFinite(value)
    ? Math.min(30, Math.max(0, Math.round(value)))
    : 3;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ expiry_notify_days })
    .eq("id", user.id);

  if (error) {
    console.error("updateExpiryNotifyDaysAction:", error);
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/profile");
}

export async function markOnboardingSeenAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ has_seen_onboarding: true })
    .eq("id", user.id);

  if (error) {
    console.error("markOnboardingSeenAction:", error);
    return { error: error.message };
  }

  return { success: true };
}

