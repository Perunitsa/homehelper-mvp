import { NextRequest, NextResponse } from "next/server";
import { syncHomeHelperProfileToHubSpot } from "@/lib/hubspot";
import { getEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  family_id: string | null;
  current_xp: number | null;
  level: number | null;
};

type FamilyRow = {
  id: string;
  name: string | null;
};

export async function POST(request: NextRequest) {
  const env = getEnv();

  if (!env.HUBSPOT_BULK_SYNC_SECRET) {
    return NextResponse.json(
      { error: "HUBSPOT_BULK_SYNC_SECRET is not configured" },
      { status: 503 },
    );
  }

  const syncSecret = request.headers.get("x-crm-sync-secret");
  if (syncSecret !== env.HUBSPOT_BULK_SYNC_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!env.HUBSPOT_ACCESS_TOKEN) {
    return NextResponse.json(
      { skipped: true, reason: "missing_access_token" },
      { status: 200 },
    );
  }

  const supabase = createAdminClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, family_id, current_xp, level")
    .not("family_id", "is", null);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileRows = (profiles ?? []) as ProfileRow[];
  const familyIds = Array.from(
    new Set(profileRows.map((profile) => profile.family_id).filter(Boolean)),
  );

  const familyNames = new Map<string, string>();
  if (familyIds.length > 0) {
    const { data: families, error: familyError } = await supabase
      .from("families")
      .select("id, name")
      .in("id", familyIds);

    if (familyError) {
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    for (const family of (families ?? []) as FamilyRow[]) {
      if (family.id && family.name) {
        familyNames.set(family.id, family.name);
      }
    }
  }

  const results = [];
  for (const profile of profileRows) {
    if (!profile.family_id) {
      continue;
    }

    const firstName =
      profile.first_name ||
      profile.email?.split("@")[0] ||
      "Пользователь";
    const result = await syncHomeHelperProfileToHubSpot({
      userId: profile.id,
      email: profile.email ?? "",
      firstName,
      lastName: profile.last_name,
      role: profile.role === "child" ? "child" : "parent",
      familyId: profile.family_id,
      familyName: familyNames.get(profile.family_id),
      level: profile.level,
      currentXp: profile.current_xp,
      onboardingStatus: "manual_sync",
    });

    results.push({
      userId: profile.id,
      email: profile.email,
      ok: !result.skipped && result.ok,
      skipped: result.skipped,
      action: "action" in result ? result.action : undefined,
      status: "status" in result ? result.status : undefined,
      error: "error" in result ? result.error : undefined,
    });
  }

  const synced = results.filter((result) => result.ok).length;
  const failed = results.filter((result) => !result.ok && !result.skipped).length;
  const skipped = results.filter((result) => result.skipped).length;

  return NextResponse.json({
    totalProfiles: profileRows.length,
    synced,
    failed,
    skipped,
    results,
  });
}
