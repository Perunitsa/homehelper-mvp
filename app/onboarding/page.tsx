"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createFamilyAction, joinFamilyAction } from "./actions";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<"create" | "join">("create");
  const [error, setError] = useState<string | null>(
    urlError ? decodeURIComponent(urlError) : null
  );
  const [loading, setLoading] = useState(false);

  // Очищаем ошибку при переключении режима
  useEffect(() => {
    setError(null);
  }, [mode]);

  async function handleCreate() {
    setError(null);
    setLoading(true);
    try {
      const result = await createFamilyAction();
      if (result?.error) {
        setError(result.error);
      } else if (result?.inviteCode) {
        // Сохраняем код и переходим на dashboard
        sessionStorage.setItem("inviteCode", result.inviteCode);
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = await joinFamilyAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex-1 flex items-center justify-center bg-cream px-4 py-12 relative overflow-hidden">
      {/* Декоративные растения */}
      <div className="absolute top-12 right-16 text-5xl opacity-15 sway hidden sm:block">
        🌿
      </div>
      <div className="absolute bottom-12 left-12 text-4xl opacity-10 breathe hidden sm:block">
        🪴
      </div>

      <div className="w-full max-w-lg relative">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="heading-handwritten text-5xl text-brown mb-2">
            {mode === "create" ? "Создайте семью" : "Присоединяйтесь"}
          </h1>
          <p className="text-text-secondary">
            {mode === "create"
              ? "Один клик — и семья готова"
              : "Введите код от того, кто создал семью"}
          </p>
        </div>

        {/* Карточка */}
        <div className="card-cozy p-8">
          {/* Табы */}
          <div className="flex rounded-lg bg-cream-dark p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                mode === "create"
                  ? "bg-white-soft text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-white-soft/50"
              }`}
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                mode === "join"
                  ? "bg-white-soft text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-white-soft/50"
              }`}
            >
              Присоединиться
            </button>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-rose-muted/10 border border-rose-muted/30 text-rose-muted px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Форма создания — только кнопка */}
          {mode === "create" && (
            <div className="space-y-5">
              <p className="text-text-secondary text-sm">
                Семья будет названа <strong>«{mode === "create" ? "ваше имя" : ""} и семья»</strong>.
                Имя берётся из вашей учётной записи.
              </p>

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="btn-cozy w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Создаём..." : "Создать семью"}
              </button>
            </div>
          )}

          {/* Форма присоединения — только код и роль */}
          {mode === "join" && (
            <form action={handleJoin} className="space-y-5">
              <div>
                <label
                  htmlFor="inviteCode"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Код приглашения
                </label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  required
                  className="input-cozy"
                  placeholder="Введите код"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Ваша роль
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="child"
                  className="input-cozy"
                >
                  <option value="child">Ребёнок</option>
                  <option value="parent">Родитель</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-cozy w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Присоединяемся..." : "Присоединиться"}
              </button>
            </form>
          )}
        </div>

        {/* Ссылка */}
        <p className="text-center text-text-muted text-sm mt-6">
          <a href="/" className="text-olive hover:text-olive-dark transition-colors">
            ← На главную
          </a>
        </p>
      </div>
    </div>
  );
}
