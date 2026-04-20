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
    (leaderboard ?? []).map((u) => [u.id, u.first_name || "Неизвестно"] as const),
  );

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">Статистика</h1>
            <p className="text-text-secondary mt-1">Семейный лидерборд и награды для детей</p>
          </div>
          <a href="/dashboard" className="btn-cozy btn-cozy-secondary text-sm px-4 py-2 self-center">
            ← Главная
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-3xl text-brown mb-6">Лидерборд семьи</h2>
            {(leaderboard ?? []).length === 0 ? (
              <p className="text-text-secondary italic">Данных пока нет.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(leaderboard ?? []).map((u, idx) => (
                  <div
                    key={u.id}
                    className="bg-white-soft border border-beige rounded-2xl p-5 shadow-sm flex items-center justify-between group hover:border-olive-light transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-gold-soft text-brown' : 'bg-cream-dark text-text-muted'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-text-primary">{u.first_name || "Пользователь"}</div>
                        <div className="text-[10px] uppercase tracking-wider text-text-muted">{u.role === 'parent' ? 'Родитель' : 'Ребёнок'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-brown">{u.current_xp ?? 0}</div>
                      <div className="text-[10px] text-text-muted uppercase">Всего XP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="card-cozy p-6">
              <h2 className="heading-handwritten text-3xl text-brown mb-6">Достижения семьи</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { title: "Мастер чистоты", icon: "🧹", earned: true },
                  { title: "Шеф-повар", icon: "🍳", earned: true },
                  { title: "Герой опыта", icon: "✨", earned: false },
                  { title: "Про-покупатель", icon: "🛒", earned: false },
                  { title: "Хранитель запасов", icon: "📦", earned: false },
                  { title: "Скороход", icon: "⚡", earned: false },
                ].map((a, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all ${
                      a.earned ? 'bg-mint-light/20 border-olive/30 opacity-100 scale-100' : 'bg-cream-dark/50 border-beige opacity-40 grayscale scale-95'
                    }`}
                  >
                    <span className="text-3xl mb-1">{a.icon}</span>
                    <span className="text-[10px] font-bold leading-tight">{a.title}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-6 text-center italic">Выполняйте больше квестов, чтобы разблокировать семейные бейджи!</p>
            </section>

            <section className="card-cozy p-6">
              <h2 className="heading-handwritten text-3xl text-brown mb-6">Активность за неделю</h2>
              <div className="h-48 flex items-end justify-around gap-2 px-2 pb-6 border-b border-beige">
                {[
                  { label: "НЕД 1", val: 40 },
                  { label: "НЕД 2", val: 75 },
                  { label: "НЕД 3", val: 55 },
                  { label: "НЕД 4", val: 95 },
                ].map((wk) => (
                  <div key={wk.label} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-olive to-olive-light rounded-t-lg shadow-inner transition-all duration-1000"
                      style={{ height: `${wk.val}%` }}
                    />
                    <span className="text-[10px] font-bold text-text-muted">{wk.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-text-muted font-medium">
                <span>Низкая</span>
                <span>Продуктивная семья!</span>
              </div>
            </section>
          </div>

          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-2xl text-brown mb-4">Последние бейджи</h2>
            {(badges ?? []).length === 0 ? (
              <p className="text-text-secondary italic">Личных бейджей пока нет.</p>
            ) : (
              <div className="space-y-3">
                {(badges ?? []).map((b) => (
                  <div key={b.id} className="bg-cream-dark border border-beige rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⭐</span>
                      <div>
                        <div className="font-medium text-text-primary">{b.title}</div>
                        <div className="text-[10px] text-text-muted">
                          {byUser.get(b.user_id) ?? "Ребёнок"} • {new Date(b.earned_at).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
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

