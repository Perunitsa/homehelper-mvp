import type { SupabaseClient } from "@supabase/supabase-js";

type ExpiryProduct = {
  id: string;
  name: string;
  expiry_date: string | null;
};

function toValidNotifyDays(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(30, Math.max(0, Math.round(n)));
}

function daysUntil(dateYmd: string) {
  const target = new Date(`${dateYmd}T00:00:00`);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - startOfToday.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export async function ensureExpiryNotifications(params: {
  supabase: SupabaseClient;
  userId: string;
  notifyDays: number;
  products: ExpiryProduct[];
}) {
  const notifyDays = toValidNotifyDays(params.notifyDays);
  const rows = (params.products ?? [])
    .filter((p) => p.expiry_date)
    .map((p) => {
      const expiry = p.expiry_date as string;
      const d = daysUntil(expiry);
      if (d > notifyDays) return null;

      const isExpired = d < 0;
      const title = isExpired ? "Просрочено" : "Скоро истекает срок годности";
      const message = isExpired
        ? `${p.name} (до ${expiry})`
        : `${p.name} (до ${expiry}, осталось ${d} дн.)`;

      return {
        user_id: params.userId,
        type: "expiry",
        title,
        message,
        dedupe_key: `expiry:${p.id}:${expiry}`,
      };
    })
    .filter(Boolean) as Array<{
    user_id: string;
    type: "expiry";
    title: string;
    message: string;
    dedupe_key: string;
  }>;

  if (rows.length === 0) return;

  const { error } = await params.supabase.from("notifications").upsert(rows, {
    onConflict: "user_id,dedupe_key",
    ignoreDuplicates: true,
  });

  if (error) {
    // Non-blocking: notifications should never break the page.
    console.warn("ensureExpiryNotifications:", error);
  }
}
