import { redirect } from "next/navigation";
import BottomNav from "@/app/_components/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { markAllReadAction, markReadAction } from "./actions";
import { ensureExpiryNotifications } from "@/lib/ensureExpiryNotifications";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, expiry_notify_days")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.family_id) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, expiry_date")
      .eq("family_id", profile.family_id);

    if (products) {
      await ensureExpiryNotifications({
        supabase,
        userId: user.id,
        notifyDays: profile.expiry_notify_days ?? 3,
        products,
      });
    }
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, message, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Уведомления
            </h1>
            <p className="text-text-secondary mt-1">
              Сроки годности и квесты
            </p>
          </div>
          <a
            href="/dashboard"
            className="btn-cozy btn-cozy-secondary text-sm px-4 py-2 self-center"
          >
            ← Главная
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-12">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="heading-handwritten text-2xl text-brown">
              Список
            </h2>
            {(notifications ?? []).some(n => !n.is_read) && (
              <form action={markAllReadAction}>
                <button className="btn-cozy btn-cozy-secondary text-sm px-4 py-2">
                  Отметить все прочитанными
                </button>
              </form>
            )}
          </div>

          {(notifications ?? []).length === 0 ? (
            <div className="card-cozy p-6 text-text-secondary">
              Пока нет уведомлений.
            </div>
          ) : (
            <div className="grid gap-3">
              {(notifications ?? []).map((n) => (
                <div
                  key={n.id}
                  className={[
                    "card-cozy p-5 transition-all duration-300",
                    n.is_read ? "opacity-60" : "border-l-4 border-gold-soft shadow-md shadow-gold-soft/5",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                        <span>{formatDate(n.created_at)}</span>
                        <span className="w-1 h-1 bg-beige-dark rounded-full"></span>
                        <span className={n.type === 'expiry' ? 'text-rose-muted' : 'text-olive'}>
                          {n.type === 'expiry' ? 'Срок годности' : n.type === 'task' ? 'Задание' : 'Система'}
                        </span>
                      </div>
                      <div className="text-text-primary font-bold text-lg">
                        {n.title}
                      </div>
                      <div className="text-text-secondary text-sm mt-1 leading-relaxed">
                        {n.message}
                      </div>
                    </div>
                    {!n.is_read && (
                      <form action={markReadAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <button className="btn-cozy text-xs px-4 py-2 whitespace-nowrap">
                          Прочитано
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

