"use client";

import { useState } from "react";
import { signInAction, signUpAction } from "./actions";

type AuthFormProps = {
  intent: string | null;
};

export default function AuthForm({ intent }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">(intent === "signup" ? "signup" : "login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const action = mode === "login" ? signInAction : signUpAction;
      const result = await action(formData);
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
      <div className="absolute top-12 left-8 text-5xl opacity-15 breathe hidden sm:block">
        🌿
      </div>
      <div className="absolute bottom-16 right-12 text-4xl opacity-10 sway hidden sm:block">
        🍂
      </div>
      <div className="absolute top-1/3 right-20 text-3xl opacity-10 breathe hidden lg:block">
        🪵
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="heading-handwritten text-5xl text-brown mb-2">
            HomeHelper
          </h1>
          <p className="text-text-secondary">
            {mode === "login" ? "С возвращением!" : "Присоединяйтесь к нам"}
          </p>
        </div>

        <div className="card-cozy p-8">
          <div className="flex rounded-lg bg-cream-dark p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === "login"
                  ? "bg-white-soft text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === "signup"
                  ? "bg-white-soft text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Регистрация
            </button>
          </div>

          {error && (
            <div className="bg-rose-muted/10 border border-rose-muted/30 text-rose-muted px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Имя
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-cozy"
                  placeholder="Как вас зовут?"
                />
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading}
              className="btn-cozy w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Подождите..." : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          <a href="/" className="text-olive hover:text-olive-dark transition-colors">
            ← На главную
          </a>
        </p>
      </div>
    </div>
  );
}


