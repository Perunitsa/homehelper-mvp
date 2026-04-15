"use server";

import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}

export async function createFamilyAction() {
  const result = await getUser();
  if (!result) {
    return { error: "Необходимо войти в систему" };
  }

  const { supabase, user } = result;

  // Берём имя из email (часть до @) или из user_metadata
  const firstName =
    user.user_metadata?.first_name ||
    user.email?.split("@")[0] ||
    "Пользователь";

  const familyName = `${firstName} и семья`;

  // 1. Сначала создаём семью
  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({ name: familyName, owner_id: user.id })
    .select("id, invite_code")
    .single();

  if (familyError) {
    console.error("createFamilyAction — familyError:", familyError);
    return { error: `Не удалось создать семью: ${familyError.message}` };
  }
  if (!family) {
    return { error: "Не удалось создать семью" };
  }

  // 2. Обновляем профиль — сначала пробуем upsert
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      first_name: firstName,
      last_name: null,
      role: "parent",
      family_id: family.id,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("createFamilyAction — profileError:", profileError);
    // 3. Если upsert не сработал — пробуем обычный update
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        family_id: family.id,
        email: user.email ?? "",
        first_name: firstName,
        role: "parent",
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("createFamilyAction — updateError:", updateError);
      return { error: `Не удалось обновить профиль: ${updateError.message}` };
    }
  }

  // 4. Перепроверяем что профиль действительно обновился
  const { data: checkProfile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!checkProfile?.family_id) {
    return { error: "Профиль не был обновлён. Попробуйте ещё раз." };
  }

  return { inviteCode: family.invite_code };
}

export async function joinFamilyAction(formData: FormData) {
  const inviteCode = getString(formData, "inviteCode");
  const role = getString(formData, "role") === "parent" ? "parent" : "child";

  if (!inviteCode) {
    return { error: "Введите код приглашения" };
  }

  const result = await getUser();
  if (!result) {
    return { error: "Необходимо войти в систему" };
  }

  const { supabase, user } = result;

  const firstName =
    user.user_metadata?.first_name ||
    user.email?.split("@")[0] ||
    "Пользователь";

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id")
    .eq("invite_code", inviteCode.toLowerCase())
    .maybeSingle();

  if (familyError) {
    console.error("joinFamilyAction — familyError:", familyError);
    return { error: `Ошибка поиска семьи: ${familyError.message}` };
  }
  if (!family) {
    return { error: "Код приглашения не найден" };
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      first_name: firstName,
      last_name: null,
      role,
      family_id: family.id,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("joinFamilyAction — profileError:", profileError);
    // Пробуем update
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        family_id: family.id,
        email: user.email ?? "",
        first_name: firstName,
        role,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("joinFamilyAction — updateError:", updateError);
      return { error: `Не удалось присоединиться: ${updateError.message}` };
    }
  }

  return { success: true };
}
