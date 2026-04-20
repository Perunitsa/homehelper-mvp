import BottomNav from "@/app/_components/BottomNav";
import { requireProfile } from "@/app/_components/requireProfile";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { supabase, profile } = await requireProfile();

  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id, first_name, role, current_xp, points")
    .eq("family_id", profile.family_id)
    .order("current_xp", { ascending: false });

  const childIds = (leaderboard ?? [])
    .filter((u) => u.role === "child")
    .map((u) => u.id);

  const { data: badges } = childIds.length
    ? await supabase
        .from("achievement_events")
        .select("id, user_id, title, icon, earned_at")
        .in("user_id", childIds)
        .order("earned_at", { ascending: false })
        .limit(30)
    : {
        data: [] as Array<{
          id: string;
          user_id: string;
          title: string;
          icon: string;
          earned_at: string;
        }>,
      };

  const byUser = new Map(
    (leaderboard ?? []).map((u) => [u.id, u.first_name || "Unknown"] as const),
  );

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">Stats</h1>
            <p className="text-text-secondary mt-1">Family leaderboard and earned badges for kids</p>
          </div>
          <a href="/dashboard" className="btn-cozy btn-cozy-secondary text-sm px-4 py-2 self-center">
            ← Home
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-12">
        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-2">
          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-2xl text-brown mb-4">Family Leaderboard</h2>
            {(leaderboard ?? []).length === 0 ? (
              <p className="text-text-secondary">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {(leaderboard ?? []).map((u, idx) => (
                  <div
                    key={u.id}
                    className="bg-cream-dark border border-beige rounded-xl px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs text-text-muted">#{idx + 1}</div>
                      <div className="font-medium text-text-primary">{u.first_name || "-"}</div>
                    </div>
                    <div className="text-sm text-text-secondary">{u.current_xp ?? u.points ?? 0} XP</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-2xl text-brown mb-4">Badges Earned</h2>
            {(badges ?? []).length === 0 ? (
              <p className="text-text-secondary">No badges earned yet.</p>
            ) : (
              <div className="space-y-3">
                {(badges ?? []).map((b) => (
                  <div key={b.id} className="bg-cream-dark border border-beige rounded-xl px-4 py-3">
                    <div className="font-medium text-text-primary">{b.title}</div>
                    <div className="text-xs text-text-muted mt-1">
                      {byUser.get(b.user_id) ?? "Child"} • {new Date(b.earned_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

