import { requireProfile } from "@/app/_components/requireProfile";
import BottomNav from "@/app/_components/BottomNav";
import {
  approveTaskAction,
  createTaskAction,
  rejectTaskAction,
  submitTaskAction,
} from "./actions";
import RewardConfettiListener from "@/app/_components/RewardConfettiListener";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return null;
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value;
  }
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { supabase, profile } = await requireProfile();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const error =
    typeof searchParams?.error === "string"
      ? decodeURIComponent(searchParams.error)
      : null;

  const { data: members } = await supabase
    .from("profiles")
    .select("id, first_name, role")
    .eq("family_id", profile.family_id)
    .order("first_name", { ascending: true });

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "id, title, description, points, deadline, status, icon, photo_proof_url, assigned_to, created_by, created_at, completed_at",
    )
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false });

  const memberById = new Map(
    (members ?? []).map((m) => [m.id, m] as const),
  );

  const visibleTasksRaw =
    profile.role === "parent"
      ? tasks ?? []
      : (tasks ?? []).filter((t) => t.assigned_to === profile.id);

  const visibleTasks = await Promise.all(
    visibleTasksRaw.map(async (t) => {
      if (t.photo_proof_url && profile.role === "parent" && t.status === "in_review") {
        const { data } = await supabase.storage
          .from("task-proofs")
          .createSignedUrl(t.photo_proof_url, 3600);
        return { ...t, signed_proof_url: data?.signedUrl };
      }
      return { ...t, signed_proof_url: null };
    })
  );

  return (
    <div className="min-h-full bg-cream flex flex-col">
      {profile.role === "child" && user?.id && <RewardConfettiListener userId={user.id} />}
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Quest Board
            </h1>
            <p className="text-text-secondary mt-1">
              {profile.role === "parent"
                ? "Создавайте квесты и подтверждайте выполнение"
                : "Выполняйте квесты и отправляйте доказательства"}
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
        <div className="max-w-5xl mx-auto space-y-8">
          {error && (
            <div className="card-cozy p-4 border-l-4 border-rose-muted">
              <p className="text-rose-muted text-sm">{error}</p>
            </div>
          )}

          {profile.role === "parent" && (
            <section className="card-cozy p-6">
              <h2 className="heading-handwritten text-2xl text-brown mb-4">
                Добавить задачу
              </h2>
              <form action={createTaskAction} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Название
                  </label>
                  <input
                    name="title"
                    className="input-cozy"
                    placeholder="Например: Помыть посуду"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Описание (необязательно)
                  </label>
                  <input
                    name="description"
                    className="input-cozy"
                    placeholder="Коротко про условия"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Исполнитель
                  </label>
                  <select name="assignedTo" className="input-cozy" required defaultValue="">
                    <option value="" disabled>
                      Выберите
                    </option>
                    {(members ?? [])
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name || "Пользователь"} ({m.role === 'child' ? 'Ребёнок' : 'Родитель'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Награда (XP)
                  </label>
                  <input
                    name="points"
                    type="number"
                    min={1}
                    className="input-cozy"
                    placeholder="10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Дедлайн
                  </label>
                  <input name="deadline" type="datetime-local" className="input-cozy" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Иконка
                  </label>
                  <select name="icon" className="input-cozy" defaultValue="quest">
                    <option value="quest">Quest</option>
                    <option value="broom">Broom</option>
                    <option value="chef-hat">Chef</option>
                    <option value="shopping-cart">Cart</option>
                    <option value="sparkles">Sparkles</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button className="btn-cozy" type="submit">
                    Создать
                  </button>
                </div>
              </form>
              {(members ?? []).length <= 1 && (
                <p className="text-text-muted text-sm mt-4">
                  Вы можете назначить задачу себе или пригласить членов семьи по коду в профиле.
                </p>
              )}
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="heading-handwritten text-3xl text-brown">Задачи</h2>
              <span className="text-text-muted text-sm">
                {visibleTasks.length} шт.
              </span>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="card-cozy p-6 text-text-secondary">
                Пока нет задач. {profile.role === "parent" ? "Создайте первую!" : "Попросите родителя создать квест."}
              </div>
            ) : (
              <div className="grid gap-4">
                {visibleTasks.map((t) => (
                  <div key={t.id} className="card-cozy p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{t.icon === "broom" ? "🧹" : t.icon === "chef-hat" ? "🧑‍🍳" : t.icon === "shopping-cart" ? "🛒" : t.icon === "sparkles" ? "✨" : "📜"}</span>
                          <h3 className="heading-handwritten text-2xl text-brown">
                            {t.title}
                          </h3>
                        </div>
                        {t.description && (
                          <p className="text-text-secondary mt-2">{t.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-text-muted">
                          <span className="bg-cream-dark border border-beige rounded-full px-3 py-1">
                            XP: {t.points}
                          </span>
                          {t.deadline && (
                            <span className="bg-cream-dark border border-beige rounded-full px-3 py-1">
                              До: {formatDate(t.deadline)}
                            </span>
                          )}
                          {profile.role === "parent" && (
                            <span className="bg-cream-dark border border-beige rounded-full px-3 py-1">
                              Исп.: {memberById.get(t.assigned_to)?.first_name ?? "—"}
                            </span>
                          )}
                          <span className="bg-cream-dark border border-beige rounded-full px-3 py-1">
                            Статус:{" "}
                            {t.status === "pending"
                              ? "ожидает"
                              : t.status === "in_review"
                                ? "на проверке"
                                : t.status === "completed"
                                  ? "выполнено"
                                  : "отклонено"}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-[240px] flex flex-col gap-3">
                        {profile.role === "child" && t.status === "pending" && (
                          <form action={submitTaskAction} className="space-y-3">
                            <input type="hidden" name="taskId" value={t.id} />
                            <div>
                              <label className="block text-sm font-medium text-text-secondary mb-2">
                                Фото-подтверждение (опционально)
                              </label>
                              <input name="proof" type="file" accept="image/*" className="input-cozy" />
                            </div>
                            <button className="btn-cozy w-full" type="submit">
                              Готово (на проверку)
                            </button>
                          </form>
                        )}

                        {profile.role === "parent" && t.status === "in_review" && (
                          <div className="space-y-3">
                            {t.signed_proof_url ? (
                              <div className="rounded-xl overflow-hidden border border-beige aspect-video bg-cream-dark flex items-center justify-center">
                                <img 
                                  src={t.signed_proof_url} 
                                  alt="Task proof" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : t.photo_proof_url ? (
                              <div className="text-xs text-text-muted italic">
                                Proof uploaded, but failed to load image.
                              </div>
                            ) : null}
                            <form action={approveTaskAction}>
                              <input type="hidden" name="taskId" value={t.id} />
                              <button className="btn-cozy w-full" type="submit">
                                Подтвердить
                              </button>
                            </form>
                            <form action={rejectTaskAction} className="space-y-2">
                              <input type="hidden" name="taskId" value={t.id} />
                              <input
                                name="reason"
                                className="input-cozy"
                                placeholder="Причина (опционально)"
                              />
                              <button
                                className="btn-cozy btn-cozy-secondary w-full"
                                type="submit"
                              >
                                Отклонить
                              </button>
                            </form>
                          </div>
                        )}

                        {t.status === "completed" && (
                          <div className="text-sm text-text-muted">
                            Завершено: {formatDate(t.completed_at ?? null) ?? "—"}
                          </div>
                        )}
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
