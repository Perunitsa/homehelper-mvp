"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1),
  barcode: z.string().trim().optional(),
  expiryDate: z.string().trim().min(1),
});

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

export async function quickAddProductAction(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    barcode: formData.get("barcode"),
    expiryDate: formData.get("expiryDate"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=Please+fill+name+and+expiry+date");
  }

  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.expiryDate < today) {
    redirect("/dashboard?error=Expiry+date+cannot+be+in+the+past");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id || profile.role !== "parent") {
    redirect("/dashboard?error=Only+parents+can+add+products");
  }

  const { error } = await supabase.from("products").insert({
    family_id: profile.family_id,
    name: parsed.data.name,
    barcode: parsed.data.barcode || null,
    expiry_date: toDateOnly(parsed.data.expiryDate),
    category: "quick-add",
    quantity: 1,
    unit: "pcs",
    created_by: user.id,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/inventory");
}
