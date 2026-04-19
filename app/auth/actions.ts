"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    return { error: "Электронная почта и пароль обязательны" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (!profile?.family_id) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const name = getString(formData, "name");
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!name || !email || !password) {
    return { error: "Все поля обязательны" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Входим сразу после регистрации
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "Аккаунт создан. Проверьте почту для подтверждения." };
  }

  // После регистрации — на onboarding (семьи ещё нет)
  redirect("/onboarding");
}

export async function signUpOrSignInAction(formData: FormData) {
  const name = getString(formData, "name");
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    return { error: "Электронная почта и пароль обязательны" };
  }

  const firstName = name || email.split("@")[0] || "Пользователь";

  const supabase = await createClient();

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName },
    },
  });

  if (signUpError) {
    // Если пользователь уже существует — пробуем войти.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: signInError.message };
    }
  } else {
    // Новый пользователь: пробуем войти сразу (если включено подтверждение email — покажем подсказку).
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: "Аккаунт создан. Проверьте почту для подтверждения." };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (!profile?.family_id) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth?message=Signed+out");
}
