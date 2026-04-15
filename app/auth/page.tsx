"use client";

import { useState } from "react";
import { signInAction, signUpAction } from "./actions";

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Пароль должен быть не менее 8 символов";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Пароль должен содержать хотя бы одну букву латиницы";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return "Пароль должен содержать хотя бы один спецсимвол (!@#$%^&* и др.)";
  }
  return null;
}

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPasswordError(null);
    setConfirmError(null);

    // Валидация только для регистрации
    if (!isSignIn) {
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      const pwErr = validatePassword(password);
      if (pwErr) {
        setPasswordError(pwErr);
        return;
      }

      if (password !== confirmPassword) {
        setConfirmError("Пароли не совпадают");
        return;
      }
    }

    setLoading(true);
    try {
      const action = isSignIn ? signInAction : signUpAction;
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
            {isSignIn ? "С возвращением! ☕" : "Добро пожаловать! 🌱"}
          </p>
        </div>

        {/* Карточка формы */}
        <div className="card-cozy p-8">
          {/* Таб-переключатель */}
          <div className="flex rounded-lg bg-cream-dark p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsSignIn(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSignIn
                  ? "bg-white-soft text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-white-soft/50"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setIsSignIn(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                !isSignIn
                  ? "bg-white-soft text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-white-soft/50"
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Общая ошибка */}
          {error && (
            <div className="bg-rose-muted/10 border border-rose-muted/30 text-rose-muted px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Форма */}
          <form action={handleSubmit} className="space-y-5">
            {/* Имя (только регистрация) */}
            {isSignIn === false && (
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
                minLength={isSignIn ? 6 : 8}
                className="input-cozy"
                placeholder={
                  isSignIn ? "Введите пароль" : "Мин. 8 символов, буква, спецсимвол"
                }
              />
              {passwordError && (
                <p className="text-rose-muted text-xs mt-2">⚠ {passwordError}</p>
              )}
              {!isSignIn && (
                <ul className="text-xs text-text-muted mt-2 space-y-1">
                  <li>• Минимум 8 символов</li>
                  <li>• Хотя бы одна буква (A–Z, a–z)</li>
                  <li>• Хотя бы один спецсимвол (!@#$%^&*...)</li>
                </ul>
              )}
            </div>

            {/* Подтверждение пароля (только регистрация) */}
            {isSignIn === false && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Подтверждение пароля
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input-cozy"
                  placeholder="Повторите пароль"
                />
                {confirmError && (
                  <p className="text-rose-muted text-xs mt-2">⚠ {confirmError}</p>
                )}
              </div>
            )}

            {/* Кнопка */}
            <button
              type="submit"
              disabled={loading}
              className="btn-cozy w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Подождите..."
                : isSignIn
                  ? "Войти"
                  : "Создать аккаунт"}
            </button>
          </form>
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
