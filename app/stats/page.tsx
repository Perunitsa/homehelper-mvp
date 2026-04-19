import BottomNav from "@/app/_components/BottomNav";
import { requireProfile } from "@/app/_components/requireProfile";

export const dynamic = "force-dynamic";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function StatsPage() {
  const { supabase, profile } = await requireProfile();

  const { data: achievements } = await supabase
    .from("achievements")
    .select("id, title, description, icon, required_points, level")
    .order("required_points", { ascending: true })
    .limit(6);

  const now = new Date();
  const weeks: { label: string; start: Date; end: Date }[] = [];
  const end = startOfWeek(now);
  for (let i = 3; i >= 0; i--) {
    const s = new Date(end);
    s.setDate(s.getDate() - i * 7);
    const e = new Date(s);
    e.setDate(e.getDate() + 7);
    weeks.push({ label: `WK${4 - i}`, start: s, end: e });
  }

  const fromDate = new Date(weeks[0].start);
  const toDate = new Date(weeks[3].end);

  const { data: completedTasks } = await supabase
    .from("tasks")
    .select("points, completed_at")
    .eq("family_id", profile.family_id)
    .eq("status", "completed")
    .gte("completed_at", fromDate.toISOString())
    .lt("completed_at", toDate.toISOString());

  const pointsByWeek = weeks.map(() => 0);
  for (const t of completedTasks ?? []) {
    if (!t.completed_at) continue;
    const d = new Date(t.completed_at);
    const idx = weeks.findIndex((w) => d >= w.start && d < w.end);
    if (idx >= 0) pointsByWeek[idx] += t.points ?? 0;
  }

  const max = Math.max(1, ...pointsByWeek);

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Hub
            </h1>
            <p className="text-text-secondary mt-1">
              Достижения семьи и прогресс по XP
            </p>
          </div>
          <a
            href="/dashboard"
            className="btn-cozy btn-cozy-secondary text-sm px-4 py-2 self-center"
          >
            ← Home
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-12">
        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-2">
          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-2xl text-brown mb-4">
              FAMILY ACHIEVEMENTS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(achievements ?? []).length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-cream-dark border border-beige rounded-xl px-4 py-4 text-center"
                    >
                      <div className="text-2xl mb-2">🏅</div>
                      <div className="text-xs text-text-muted">—</div>
                    </div>
                  ))
                : (achievements ?? []).map((a) => {
                    const unlocked = (profile.current_xp ?? 0) >= a.required_points;
                    return (
                      <div
                        key={a.id}
                        className={[
                          "border rounded-xl px-4 py-4 text-center",
                          unlocked
                            ? "bg-white-soft border-beige"
                            : "bg-cream-dark border-beige-dark opacity-70",
                        ].join(" ")}
                        title={a.description ?? ""}
                      >
                        <div className="text-2xl mb-2">
                          {a.icon === "broom"
                            ? "🧹"
                            : a.icon === "chef-hat"
                              ? "🧑‍🍳"
                              : a.icon === "shopping-cart"
                                ? "🛒"
                                : a.icon === "sparkles"
                                  ? "✨"
                                  : a.icon === "package"
                                    ? "📦"
                                    : "🏅"}
                        </div>
                        <div className="text-sm font-medium text-text-primary">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-text-muted mt-1">
                          {unlocked ? "Unlocked" : `XP ${a.required_points}+`}
                        </div>
                      </div>
                    );
                  })}
            </div>
          </section>

          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-2xl text-brown mb-4">
              MONTHLY PROGRESS (XP)
            </h2>
            <div className="flex items-end justify-between gap-3 h-48">
              {weeks.map((w, idx) => {
                const value = pointsByWeek[idx];
                const height = Math.round((value / max) * 160);
                return (
                  <div key={w.label} className="flex-1 text-center">
                    <div
                      className="mx-auto rounded-xl bg-gradient-to-t from-mint to-peach border border-beige"
                      style={{ height: `${Math.max(12, height)}px` }}
                      title={`${value} XP`}
                    />
                    <div className="text-xs text-text-muted mt-2">{w.label}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-text-muted text-xs mt-4">
              Считаем XP как сумму `points` завершённых задач за последние 4 недели.
            </p>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

