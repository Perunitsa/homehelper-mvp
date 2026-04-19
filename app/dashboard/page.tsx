import { redirect } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import BottomNav from "@/app/_components/BottomNav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, role, family_id, current_xp, level")
    .eq("id", user.id)
    .maybeSingle();

  const { data: family } = await supabase
    .from("families")
    .select("invite_code")
    .eq("id", profile?.family_id ?? "")
    .maybeSingle();

  if (!profile?.family_id) {
    redirect("/onboarding");
  }

  const { data: taskOfDay } = await supabase
    .from("tasks")
    .select("id, title, points, icon, status, deadline")
    .eq("family_id", profile.family_id)
    .eq("assigned_to", user.id)
    .in("status", ["pending", "in_review"])
    .order("deadline", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id, first_name, current_xp")
    .eq("family_id", profile.family_id)
    .order("current_xp", { ascending: false })
    .limit(3);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const xpForLevel = 100;
  const xpProgress = profile.current_xp % xpForLevel;
  const xpPercent = Math.round((xpProgress / xpForLevel) * 100);

  return (
    <div className="min-h-full bg-cream flex flex-col">
      {/* Шапка */}
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="absolute top-4 right-12 text-4xl opacity-15 sway hidden sm:block">
          🌿
        </div>

        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 relative">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Добро пожаловать{profile.first_name ? `, ${profile.first_name}` : ""}! ☕
            </h1>
            <p className="text-text-secondary mt-1">
              Ваш уютный центр управления домашними делами
            </p>
          </div>

          <form action={signOutAction}>
            <button className="btn-cozy btn-cozy-secondary text-sm px-4 py-2">
              Выйти
            </button>
          </form>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 px-6 py-12 sm:px-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Профиль и прогресс */}
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Карточка уровня */}
            <div className="level-card sm:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl breathe inline-block">🌟</span>
                <span className="heading-handwritten text-2xl text-brown">
                  Уровень {profile.level}
                </span>
              </div>
              <div className="bg-cream-dark rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-soft to-peach transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-text-muted text-xs mt-2">
                {xpProgress} / {xpForLevel} XP до следующего уровня
              </p>
            </div>

            {/* Роль */}
            <div className="card-cozy p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">
                  {profile.role === "parent" ? "👨‍👩‍👧" : "🧑‍🎓"}
                </span>
                <span className="heading-handwritten text-2xl text-brown">
                  {profile.role === "parent" ? "Родитель" : "Ребёнок"}
                </span>
              </div>
              <p className="text-text-muted text-sm">
                {profile.role === "parent"
                  ? "Вы управляете задачами и помогаете семье"
                  : "Вы выполняете задания и зарабатываете очки"}
              </p>
            </div>

            {/* XP бейдж */}
            <div className="card-cozy p-6 flex flex-col justify-center items-center">
              <span className="xp-badge text-lg px-6 py-3">
                ⭐ {profile.current_xp} XP
              </span>
              <p className="text-text-muted text-xs mt-3">
                Общий опыт
              </p>
            </div>
          </div>

          {/* Навигация */}
          <section>
            <div className="divider-leaf mb-6">
              <span className="text-xl">🌱</span>
            </div>
            <h2 className="heading-handwritten text-3xl text-brown mb-6">
              Разделы
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/tasks"
                className="card-cozy p-6 text-center hover:border-olive-light transition-colors"
              >
                <span className="text-3xl breathe inline-block mb-3">📋</span>
                <h3 className="heading-handwritten text-xl text-brown">
                  Квесты
                </h3>
                <p className="text-text-muted text-sm mt-1">
                  Задачи и поручения
                </p>
              </Link>

              <Link
                href="/shop"
                className="card-cozy p-6 text-center hover:border-olive-light transition-colors"
              >
                <span className="text-3xl sway inline-block mb-3">🛒</span>
                <h3 className="heading-handwritten text-xl text-brown">
                  Покупки
                </h3>
                <p className="text-text-muted text-sm mt-1">
                  Списки покупок
                </p>
              </Link>

              <Link
                href="/shop"
                className="card-cozy p-6 text-center hover:border-olive-light transition-colors"
              >
                <span className="text-3xl breathe inline-block mb-3">📦</span>
                <h3 className="heading-handwritten text-xl text-brown">
                  Инвентарь
                </h3>
                <p className="text-text-muted text-sm mt-1">
                  Продукты и сроки
                </p>
              </Link>

              <Link
                href="/stats"
                className="card-cozy p-6 text-center hover:border-olive-light transition-colors"
              >
                <span className="text-3xl sway inline-block mb-3">📊</span>
                <h3 className="heading-handwritten text-xl text-brown">
                  Статистика
                </h3>
                <p className="text-text-muted text-sm mt-1">
                  Прогресс семьи
                </p>
              </Link>
            </div>
          </section>

          {/* Задача дня */}
          {taskOfDay && (
            <Link href="/tasks" className="card-cozy p-6 border-l-4 border-mint">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="heading-handwritten text-2xl text-brown mb-2">
                    Задача дня
                  </h3>
                  <p className="text-text-primary font-medium">
                    {taskOfDay.title}
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    Reward: {taskOfDay.points} XP
                  </p>
                </div>
                <span className="xp-badge text-sm px-4 py-2">CLAIM QUEST</span>
              </div>
            </Link>
          )}

          {/* Family leaderboard */}
          {(leaderboard ?? []).length > 0 && (
            <div className="card-cozy p-6">
              <h3 className="heading-handwritten text-2xl text-brown mb-4">
                Family leaderboard
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {(leaderboard ?? []).map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-cream-dark border border-beige rounded-xl px-4 py-4"
                  >
                    <div className="text-xs text-text-muted mb-1">#{idx + 1}</div>
                    <div className="font-medium text-text-primary">
                      {p.first_name || "—"}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {p.current_xp ?? 0} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Уведомления */}
          <Link href="/notifications" className="card-cozy p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="heading-handwritten text-2xl text-brown mb-1">
                  Уведомления
                </h3>
                <p className="text-text-muted text-sm">
                  Непрочитанных: {unreadCount ?? 0}
                </p>
              </div>
              <span className="xp-badge text-sm px-4 py-2">Открыть</span>
            </div>
            {(notifications ?? []).length > 0 && (
              <div className="mt-4 grid gap-2">
                {(notifications ?? []).map((n) => (
                  <div
                    key={n.id}
                    className={[
                      "bg-cream-dark border border-beige rounded-xl px-4 py-3",
                      n.is_read ? "opacity-80" : "",
                    ].join(" ")}
                  >
                    <div className="text-sm font-medium text-text-primary">
                      {n.title}
                    </div>
                    <div className="text-xs text-text-muted mt-1 truncate">
                      {n.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Link>

          {/* Код приглашения (для новых пользователей) */}
          {family?.invite_code && (
            <div className="card-cozy p-6 border-l-4 border-gold-soft">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">🔑</span>
                <div className="flex-1">
                  <h3 className="heading-handwritten text-2xl text-brown mb-2">
                    Ваш код приглашения
                  </h3>
                  <p className="text-text-secondary text-sm mb-3">
                    Поделитесь этим кодом с членами семьи, чтобы они могли присоединиться:
                  </p>
                  <div className="bg-cream-dark border border-beige rounded-lg px-6 py-3 inline-block">
                    <code className="text-xl font-mono text-brown font-semibold">
                      {family.invite_code}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Статус */}
          <div className="card-cozy p-6 border-l-4 border-olive-light">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">🪴</span>
              <div>
                <h3 className="font-medium text-text-primary mb-1">
                  Базовый поток готов
                </h3>
                <p className="text-text-secondary text-sm">
                  Аутентификация, регистрация семьи и панель работают. Следующий шаг —
                  полноценные виджеты квестов, статистика в реальном времени и
                  уведомления.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
