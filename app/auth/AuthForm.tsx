"use client";

import { useState } from "react";
import { signUpOrSignInAction } from "./actions";

type AuthFormProps = {
  intent: string | null;
};

export default function AuthForm({ intent }: AuthFormProps) {
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
      setError("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex-1 flex items-center justify-center bg-cream px-4 py-12 relative overflow-hidden">
      <div className="absolute top-12 left-8 text-5xl opacity-15 breathe hidden sm:block">
        рџЊї
      </div>
      <div className="absolute bottom-16 right-12 text-4xl opacity-10 sway hidden sm:block">
        рџЌѓ
      </div>
      <div className="absolute top-1/3 right-20 text-3xl opacity-10 breathe hidden lg:block">
        рџЄґ
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="heading-handwritten text-5xl text-brown mb-2">
            HomeHelper
          </h1>
          <p className="text-text-secondary">
            {intent === "login"
              ? "Р’РѕР№РґРёС‚Рµ РёР»Рё СЃРѕР·РґР°Р№С‚Рµ Р°РєРєР°СѓРЅС‚"
              : "РЎРѕР·РґР°Р№С‚Рµ Р°РєРєР°СѓРЅС‚ РёР»Рё РІРѕР№РґРёС‚Рµ"}
          </p>
        </div>

        <div className="card-cozy p-8">
          {error && (
            <div className="bg-rose-muted/10 border border-rose-muted/30 text-rose-muted px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                РРјСЏ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input-cozy"
                placeholder="РљР°Рє РІР°СЃ Р·РѕРІСѓС‚?"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Р­Р»РµРєС‚СЂРѕРЅРЅР°СЏ РїРѕС‡С‚Р°
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
                РџР°СЂРѕР»СЊ
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-cozy"
                placeholder="Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cozy w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "РџРѕРґРѕР¶РґРёС‚Рµ..." : "РџСЂРѕРґРѕР»Р¶РёС‚СЊ"}
            </button>
          </form>

          <p className="text-text-muted text-xs mt-4">
            Р•СЃР»Рё Р°РєРєР°СѓРЅС‚Р° РµС‰С‘ РЅРµС‚ вЂ” РјС‹ СЃРѕР·РґР°РґРёРј РµРіРѕ. Р•СЃР»Рё СѓР¶Рµ РµСЃС‚СЊ вЂ” РїСЂРѕСЃС‚Рѕ РІРѕР№РґС‘Рј.
          </p>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          <a href="/" className="text-olive hover:text-olive-dark transition-colors">
            в†ђ РќР° РіР»Р°РІРЅСѓСЋ
          </a>
        </p>
      </div>
    </div>
  );
}

