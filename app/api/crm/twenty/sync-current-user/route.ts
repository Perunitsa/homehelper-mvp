import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncHomeHelperProfileToTwenty } from "@/lib/twenty";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, family_id, current_xp, level")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile?.family_id) {
    return NextResponse.json({ error: "Profile is not onboarded" }, { status: 400 });
  }

  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", profile.family_id)
    .maybeSingle();

  const result = await syncHomeHelperProfileToTwenty({
    userId: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role === "child" ? "child" : "parent",
    familyId: profile.family_id,
    familyName: family?.name,
    level: profile.level,
    currentXp: profile.current_xp,
    onboardingStatus: "manual_sync",
  });

  if ("skipped" in result && result.skipped) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
