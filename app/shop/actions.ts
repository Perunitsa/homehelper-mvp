"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id) {
    redirect("/onboarding");
  }

  return { supabase, user, profile };
}

export async function createDefaultListAction() {
  const { supabase, user, profile } = await getSession();
  const { error } = await supabase.from("shopping_lists").insert({
    family_id: profile.family_id,
    name: "Shopping List",
    created_by: user.id,
    is_shared: true,
  });

  if (error) {
    console.error("createDefaultListAction:", error);
    redirect(`/shop?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/shop");
}

export async function addShoppingItemAction(formData: FormData) {
  const listId = getString(formData, "listId");
  const productName = getString(formData, "productName");
  const quantity = getNumber(formData, "quantity") ?? 1;
  const unit = getString(formData, "unit") || "pcs";
  const category = getString(formData, "category") || null;

  if (!listId || !productName) {
    redirect("/shop?error=Заполните название");
  }

  const { supabase } = await getSession();
  const { error } = await supabase.from("shopping_items").insert({
    list_id: listId,
    product_name: productName,
    quantity,
    unit,
    category,
  });

  if (error) {
    console.error("addShoppingItemAction:", error);
    redirect(`/shop?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/shop");
}

export async function togglePurchasedAction(formData: FormData) {
  const itemId = getString(formData, "itemId");
  const next = getString(formData, "next") === "true";
  if (!itemId) {
    redirect("/shop?error=Не найден itemId");
  }

  const { supabase } = await getSession();
  const { error } = await supabase
    .from("shopping_items")
    .update({ is_purchased: next })
    .eq("id", itemId);

  if (error) {
    console.error("togglePurchasedAction:", error);
    redirect(`/shop?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/shop");
}

export async function toggleListSharedAction(formData: FormData) {
  const listId = getString(formData, "listId");
  const next = getString(formData, "next") === "true";
  if (!listId) {
    redirect("/shop?error=Не найден listId");
  }

  const { supabase, profile } = await getSession();
  if (profile.role !== "parent") {
    redirect("/shop?error=Доступ запрещён");
  }

  const { error } = await supabase
    .from("shopping_lists")
    .update({ is_shared: next })
    .eq("id", listId);

  if (error) {
    console.error("toggleListSharedAction:", error);
    redirect(`/shop?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/shop");
}

export async function addProductAction(formData: FormData) {
  const name = getString(formData, "name");
  const barcode = getString(formData, "barcode") || null;
  const expiryDate = getString(formData, "expiryDate");
  const quantity = getNumber(formData, "quantity") ?? 1;
  const unit = getString(formData, "unit") || "pcs";
  const category = getString(formData, "category") || null;

  if (!name || !expiryDate) {
    redirect("/shop?error=Заполните название и срок годности");
  }

  const { supabase, user, profile } = await getSession();
  const { error } = await supabase.from("products").insert({
    family_id: profile.family_id,
    name,
    barcode,
    expiry_date: expiryDate,
    quantity,
    unit,
    category,
    created_by: user.id,
  });

  if (error) {
    console.error("addProductAction:", error);
    redirect(`/shop?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/shop");
}

export async function generateExpiryNotificationsAction() {
  const { supabase, user, profile } = await getSession();
  if (profile.role !== "parent") {
    redirect("/shop?error=Доступ запрещён");
  }

  const soon = new Date();
  soon.setDate(soon.getDate() + 3);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, expiry_date")
    .eq("family_id", profile.family_id);

  if (error) {
    console.error("generateExpiryNotificationsAction products:", error);
    redirect(`/shop?error=${encodeURIComponent(error.message)}`);
  }

  const expiring = (products ?? []).filter((p) => {
    const d = new Date(`${p.expiry_date}T00:00:00Z`);
    return d <= soon;
  });

  if (expiring.length === 0) {
    redirect("/shop?error=Нет продуктов со сроком в ближайшие 3 дня");
  }

  const payload = expiring.slice(0, 10).map((p) => ({
    user_id: user.id,
    type: "expiry",
    title: "Срок годности скоро",
    message: `${p.name}: до ${p.expiry_date}`,
  }));

  const { error: insErr } = await supabase.from("notifications").insert(payload);
  if (insErr) {
    console.error("generateExpiryNotificationsAction insert:", insErr);
    redirect(`/shop?error=${encodeURIComponent(insErr.message)}`);
  }

  redirect("/notifications");
}
