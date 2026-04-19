import BottomNav from "@/app/_components/BottomNav";
import { requireProfile } from "@/app/_components/requireProfile";
import {
  addProductAction,
  addShoppingItemAction,
  createDefaultListAction,
  generateExpiryNotificationsAction,
  toggleListSharedAction,
  togglePurchasedAction,
} from "./actions";

export const dynamic = "force-dynamic";

function inventoryStatus(quantity: number | null, expiryDate: string) {
  const q = typeof quantity === "number" ? quantity : 0;
  const today = new Date();
  const exp = new Date(`${expiryDate}T00:00:00`);
  const days = Math.floor((+exp - +today) / (1000 * 60 * 60 * 24));

  if (days < 0) return { label: "EXPIRED", color: "text-rose-muted" };
  if (days <= 3) return { label: "SOON", color: "text-gold-soft-dark" };
  if (q <= 0) return { label: "OUT", color: "text-rose-muted" };
  if (q <= 1) return { label: "LOW", color: "text-gold-soft-dark" };
  return { label: "OK", color: "text-olive-dark" };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { supabase, user, profile } = await requireProfile();
  const error =
    typeof searchParams?.error === "string"
      ? decodeURIComponent(searchParams.error)
      : null;

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id, name, is_shared")
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: items } = list
    ? await supabase
        .from("shopping_items")
        .select("id, product_name, quantity, unit, category, is_purchased, created_at")
        .eq("list_id", list.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const { data: products } = await supabase
    .from("products")
    .select("id, name, quantity, unit, expiry_date, category, barcode, created_at")
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })
    .limit(12);

  const shoppingItems = (items ?? []) as Array<{
    id: string;
    product_name: string;
    quantity: number | null;
    unit: string | null;
    category: string | null;
    is_purchased: boolean | null;
  }>;

  const groupedShoppingItems = new Map<string, typeof shoppingItems>();
  for (const it of shoppingItems) {
    const key = (it.category ?? "").trim() || "Без категории";
    const group = groupedShoppingItems.get(key) ?? [];
    group.push(it);
    groupedShoppingItems.set(key, group);
  }

  const groupedShoppingEntries = Array.from(groupedShoppingItems.entries()).sort(
    ([a], [b]) => {
      if (a === "Без категории") return 1;
      if (b === "Без категории") return -1;
      return a.localeCompare(b, "ru");
    },
  );

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Supplies
            </h1>
            <p className="text-text-secondary mt-1">
              Инвентарь и общий список покупок
            </p>
          </div>
          <a
            href="/dashboard"
            className="btn-cozy btn-cozy-secondary text-sm px-4 py-2 self-center"
          >
            ← Home
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {error && (
            <div className="card-cozy p-4 border-l-4 border-rose-muted">
              <p className="text-rose-muted text-sm">{error}</p>
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="card-cozy p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="heading-handwritten text-2xl text-brown">
                  INVENTORY STATUS
                </h2>
                <span className="text-text-muted text-xs">
                  {products?.length ?? 0} items
                </span>
              </div>

              {profile.role === "parent" && (
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <form action={generateExpiryNotificationsAction}>
                    <button
                      className="btn-cozy btn-cozy-secondary text-xs px-4 py-2"
                      type="submit"
                    >
                      Проверить сроки (уведомления)
                    </button>
                  </form>
                  <a
                    href="/notifications"
                    className="text-sm text-olive hover:text-olive-dark transition-colors"
                  >
                    Открыть уведомления →
                  </a>
                </div>
              )}

              <div className="space-y-3">
                {(products ?? []).length === 0 ? (
                  <p className="text-text-secondary">
                    Пока пусто. Добавьте продукты ниже.
                  </p>
                ) : (
                  (products ?? []).map((p) => {
                    const st = inventoryStatus(p.quantity, p.expiry_date);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-4 bg-cream-dark border border-beige rounded-xl px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-text-primary truncate">
                            {p.name}
                          </div>
                          <div className="text-xs text-text-muted">
                            exp: {p.expiry_date} • {p.quantity ?? 0} {p.unit}
                            {p.category ? ` • ${p.category}` : ""}
                            {p.barcode ? ` • #${p.barcode}` : ""}
                          </div>
                        </div>
                        <div className={`text-xs font-semibold ${st.color}`}>
                          {st.label}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-text-secondary mb-3">
                  Добавить продукт
                </h3>
                <form action={addProductAction} className="grid gap-3 sm:grid-cols-2">
                  <input
                    name="name"
                    className="input-cozy sm:col-span-2"
                    placeholder="Milk"
                    required
                  />
                  <input
                    name="barcode"
                    className="input-cozy"
                    placeholder="barcode (опц.)"
                    inputMode="numeric"
                  />
                  <input
                    name="expiryDate"
                    type="date"
                    className="input-cozy"
                    required
                  />
                  <input
                    name="category"
                    className="input-cozy"
                    placeholder="dairy (опц.)"
                  />
                  <input
                    name="quantity"
                    type="number"
                    min={0}
                    className="input-cozy"
                    placeholder="1"
                  />
                  <select name="unit" className="input-cozy" defaultValue="pcs">
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="l">l</option>
                  </select>
                  <button className="btn-cozy sm:col-span-2" type="submit">
                    Добавить
                  </button>
                </form>
              </div>
            </div>

            <div className="card-cozy p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="heading-handwritten text-2xl text-brown">
                  SHOPPING LIST
                </h2>
                <span className="text-text-muted text-xs">
                  {(items ?? [])?.length ?? 0} items
                </span>
              </div>

              {!list ? (
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    Список покупок ещё не создан.
                  </p>
                  {profile.role === "parent" ? (
                    <form action={createDefaultListAction}>
                      <button className="btn-cozy" type="submit">
                        Создать общий список
                      </button>
                    </form>
                  ) : (
                    <p className="text-text-muted text-sm">
                      Попросите родителя создать общий список.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-text-muted">
                      {list.name} {list.is_shared ? "• shared" : "• private"}
                    </div>
                    {profile.role === "parent" && (
                      <form action={toggleListSharedAction}>
                        <input type="hidden" name="listId" value={list.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={(!list.is_shared).toString()}
                        />
                        <button
                          type="submit"
                          className="btn-cozy btn-cozy-secondary text-xs px-3 py-2"
                        >
                          {list.is_shared ? "Сделать приватным" : "Сделать общим"}
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(items ?? []).length === 0 ? (
                      <p className="text-text-secondary">
                        Пока пусто. Добавьте первые пункты.
                      </p>
                    ) : (
                      groupedShoppingEntries.map(([category, group]) => (
                        <div key={category} className="space-y-2">
                          <div className="text-xs text-text-muted px-2 pt-2">
                            {category}
                          </div>
                          {group.map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between gap-3 bg-cream-dark border border-beige rounded-xl px-4 py-3"
                            >
                              <div className="min-w-0">
                                <div
                                  className={[
                                    "font-medium truncate",
                                    it.is_purchased
                                      ? "text-text-muted line-through"
                                      : "text-text-primary",
                                  ].join(" ")}
                                >
                                  {it.product_name}
                                </div>
                                <div className="text-xs text-text-muted">
                                  {it.quantity} {it.unit}
                                </div>
                              </div>
                              <form action={togglePurchasedAction}>
                                <input type="hidden" name="itemId" value={it.id} />
                                <input
                                  type="hidden"
                                  name="next"
                                  value={(!it.is_purchased).toString()}
                                />
                                <button
                                  type="submit"
                                  className="btn-cozy btn-cozy-secondary text-xs px-3 py-2"
                                >
                                  {it.is_purchased ? "Вернуть" : "Купить"}
                                </button>
                              </form>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-beige">
                    <form action={addShoppingItemAction} className="grid gap-3 sm:grid-cols-5">
                      <input type="hidden" name="listId" value={list.id} />
                      <input
                        name="productName"
                        className="input-cozy sm:col-span-2"
                        placeholder="Add item..."
                        required
                      />
                      <input
                        name="category"
                        className="input-cozy"
                        placeholder="Category"
                      />
                      <input
                        name="quantity"
                        type="number"
                        min={1}
                        className="input-cozy"
                        placeholder="1"
                      />
                      <select name="unit" className="input-cozy" defaultValue="pcs">
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="l">l</option>
                      </select>
                      <button className="btn-cozy sm:col-span-5" type="submit">
                        Добавить в список
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
