"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signUpOrSignInAction } from "./actions";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent"); // "start" | "login" | null

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);

    setLoading(true);
    try {
      const result = await signUpOrSignInAction(formData);
      if (result?.error) {
        setError(result.error);
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
      <div className="absolute top-12 left-8 text-5xl opacity-15 breathe hidden sm:block">
        🌿
      </div>
      <div className="absolute bottom-16 right-12 text-4xl opacity-10 sway hidden sm:block">
        🍃
      </div>
      <div className="absolute top-1/3 right-20 text-3xl opacity-10 breathe hidden lg:block">
        🪴
      </div>

      <div className="w-full max-w-md relative">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="heading-handwritten text-5xl text-brown mb-2">
            HomeHelper
          </h1>
          <p className="text-text-secondary">
            {intent === "login"
              ? "Войдите или создайте аккаунт"
              : "Создайте аккаунт или войдите"}
          </p>
        </div>

        {/* Карточка формы */}
        <div className="card-cozy p-8">
          {/* Общая ошибка */}
          {error && (
            <div className="bg-rose-muted/10 border border-rose-muted/30 text-rose-muted px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Форма */}
          <form action={handleSubmit} className="space-y-5">
            {/* Имя (опционально — пригодится для новых аккаунтов) */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Имя (опционально)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input-cozy"
                placeholder="Как вас зовут?"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Электронная почта
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-cozy"
                placeholder="you@example.com"
              />
            </div>

            {/* Пароль */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-cozy"
                placeholder="Введите пароль"
              />
            </div>

            {/* Кнопка */}
            <button
              type="submit"
              disabled={loading}
              className="btn-cozy w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Подождите..." : "Продолжить"}
            </button>
          </form>

          <p className="text-text-muted text-xs mt-4">
            Если аккаунта ещё нет — мы создадим его. Если уже есть — просто войдём.
          </p>
        </div>

        {/* Ссылка на главную */}
        <p className="text-center text-text-muted text-sm mt-6">
          <a href="/" className="text-olive hover:text-olive-dark transition-colors">
            ← На главную
          </a>
        </p>
      </div>
    </div>
  );
}
