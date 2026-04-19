import { redirect } from "next/navigation";
import BottomNav from "@/app/_components/BottomNav";
import { signOutAction } from "@/app/auth/actions";
import { updateExpiryNotifyDaysAction } from "./actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const error =
    typeof searchParams?.error === "string"
      ? decodeURIComponent(searchParams.error)
      : null;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, email, role, family_id, current_xp, level, expiry_notify_days")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id) {
    redirect("/onboarding");
  }

  const { data: family } = await supabase
    .from("families")
    .select("name, invite_code")
    .eq("id", profile.family_id)
    .maybeSingle();

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Profile
            </h1>
            <p className="text-text-secondary mt-1">Ваши настройки и семья</p>
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
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <section className="card-cozy p-4 border-l-4 border-rose-muted">
              <p className="text-rose-muted text-sm">{error}</p>
            </section>
          )}

          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-2xl text-brown mb-4">
              Аккаунт
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-text-muted mb-1">Имя</div>
                <div className="text-text-primary font-medium">
                  {profile.first_name || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Email</div>
                <div className="text-text-primary font-medium">
                  {profile.email}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Роль</div>
                <div className="text-text-primary font-medium">
                  {profile.role === "parent" ? "Родитель" : "Ребёнок"}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Прогресс</div>
                <div className="text-text-primary font-medium">
                  Level {profile.level} • {profile.current_xp} XP
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-beige">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                Уведомления о сроках годности
              </h3>
              <form action={updateExpiryNotifyDaysAction} className="grid gap-3 sm:grid-cols-2">
                <select
                  name="expiryNotifyDays"
                  className="input-cozy"
                  defaultValue={profile.expiry_notify_days ?? 3}
                >
                  <option value="0">Выключить</option>
                  <option value="1">За 1 день</option>
                  <option value="3">За 3 дня</option>
                  <option value="7">За 7 дней</option>
                  <option value="14">За 14 дней</option>
                </select>
                <button className="btn-cozy" type="submit">
                  Сохранить
                </button>
              </form>
              <p className="text-text-muted text-xs mt-2">
                Уведомления появляются в разделе Notifications.
              </p>
            </div>

            <div className="mt-6">
              <form action={signOutAction}>
                <button className="btn-cozy btn-cozy-secondary" type="submit">
                  Выйти
                </button>
              </form>
            </div>
          </section>

          <section className="card-cozy p-6 border-l-4 border-gold-soft">
            <h2 className="heading-handwritten text-2xl text-brown mb-2">
              Семья
            </h2>
            <p className="text-text-secondary text-sm">
              {family?.name ?? "—"}
            </p>
            {family?.invite_code && (
              <div className="mt-4">
                <div className="text-xs text-text-muted mb-2">
                  Код приглашения (для подключения новых аккаунтов)
                </div>
                <div className="bg-cream-dark border border-beige rounded-lg px-6 py-3 inline-block">
                  <code className="text-xl font-mono text-brown font-semibold">
                    {family.invite_code}
                  </code>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
