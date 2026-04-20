"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { Barcode, Check, ListTodo, Package, Plus } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  expiry_date: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  barcode: string | null;
};

type ShoppingList = {
  id: string;
  name: string;
  is_shared: boolean | null;
};

type ShoppingItem = {
  id: string;
  product_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  is_purchased: boolean | null;
};

type InventoryClientProps = {
  familyId: string;
  role: "parent" | "child";
};

const todayYmd = () => new Date().toISOString().slice(0, 10);

const addProductSchema = z.object({
  name: z.string().trim().min(1),
  barcode: z.string().trim().optional(),
  category: z.string().trim().optional(),
  quantity: z.coerce.number().int().min(0).default(1),
  unit: z.string().trim().min(1).default("pcs"),
  expiryDate: z
    .string()
    .trim()
    .min(1)
    .refine((v) => v >= todayYmd(), "Expiry date cannot be in the past"),
});

const addItemSchema = z.object({
  listId: z.string().uuid(),
  productName: z.string().trim().min(1),
  category: z.string().trim().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unit: z.string().trim().min(1).default("pcs"),
});

function daysUntil(dateYmd: string) {
  const target = new Date(`${dateYmd}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export default function InventoryClient({ familyId, role }: InventoryClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["shopping-list", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("id, name, is_shared")
        .eq("family_id", familyId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ShoppingList | null;
    },
  });

  const listId = listQuery.data?.id ?? null;

  const productsQuery = useQuery({
    queryKey: ["products", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, expiry_date, quantity, unit, category, barcode")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const itemsQuery = useQuery({
    queryKey: ["shopping-items", listId],
    enabled: Boolean(listId),
    queryFn: async () => {
      if (!listId) return [] as ShoppingItem[];
      const { data, error } = await supabase
        .from("shopping_items")
        .select("id, product_name, quantity, unit, category, is_purchased")
        .eq("list_id", listId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ShoppingItem[];
    },
  });

  useEffect(() => {
    const productsChannel = supabase
      .channel(`products-family-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `family_id=eq.${familyId}` },
        () => queryClient.invalidateQueries({ queryKey: ["products", familyId] }),
      )
      .subscribe();

    const tasksChannel = supabase
      .channel(`tasks-family-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `family_id=eq.${familyId}` },
        () => queryClient.invalidateQueries({ queryKey: ["tasks-review", familyId] }),
      )
      .subscribe();

    let itemsChannel: ReturnType<typeof supabase.channel> | null = null;
    if (listId) {
      itemsChannel = supabase
        .channel(`shopping-items-${listId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shopping_items", filter: `list_id=eq.${listId}` },
          () => queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] }),
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(tasksChannel);
      if (itemsChannel) supabase.removeChannel(itemsChannel);
    };
  }, [familyId, listId, queryClient, supabase]);

  const createListMutation = useMutation({
    mutationFn: async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");

      const { error } = await supabase.from("shopping_lists").insert({
        family_id: familyId,
        name: "Shopping List",
        created_by: uid,
        is_shared: true,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping-list", familyId] });
      toast.success("Shared shopping list created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const parsed = addProductSchema.parse({
        name: formData.get("name"),
        barcode: formData.get("barcode"),
        category: formData.get("category"),
        quantity: formData.get("quantity"),
        unit: formData.get("unit"),
        expiryDate: formData.get("expiryDate"),
      });
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");

      const { error } = await supabase.from("products").insert({
        family_id: familyId,
        name: parsed.name,
        barcode: parsed.barcode || null,
        category: parsed.category || null,
        quantity: parsed.quantity,
        unit: parsed.unit,
        expiry_date: parsed.expiryDate,
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products", familyId] });
      toast.success("Product added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addShoppingItemMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const parsed = addItemSchema.parse({
        listId: formData.get("listId"),
        productName: formData.get("productName"),
        category: formData.get("category"),
        quantity: formData.get("quantity"),
        unit: formData.get("unit"),
      });
      const { error } = await supabase.from("shopping_items").insert({
        list_id: parsed.listId,
        product_name: parsed.productName,
        category: parsed.category || null,
        quantity: parsed.quantity,
        unit: parsed.unit,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      if (listId) await queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
      toast.success("Shopping item added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePurchasedMutation = useMutation({
    mutationFn: async ({ itemId, next }: { itemId: string; next: boolean }) => {
      const { error } = await supabase
        .from("shopping_items")
        .update({ is_purchased: next })
        .eq("id", itemId);
      if (error) throw error;
    },
    onMutate: async ({ itemId, next }) => {
      if (!listId) return;
      await queryClient.cancelQueries({ queryKey: ["shopping-items", listId] });
      const prev = queryClient.getQueryData<ShoppingItem[]>(["shopping-items", listId]) ?? [];
      queryClient.setQueryData<ShoppingItem[]>(
        ["shopping-items", listId],
        prev.map((i) => (i.id === itemId ? { ...i, is_purchased: next } : i)),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (listId && ctx?.prev) {
        queryClient.setQueryData(["shopping-items", listId], ctx.prev);
      }
      toast.error(e.message);
    },
    onSettled: async () => {
      if (listId) await queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
    },
  });

  const products = productsQuery.data ?? [];
  const filteredProducts = products;
  const items = itemsQuery.data ?? [];

  const expiringCount = products.filter((p) => daysUntil(p.expiry_date) <= 3).length;
  const groupedItems = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = (item.category ?? "").trim() || "Uncategorized";
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="card-cozy p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="heading-handwritten text-2xl text-brown flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory
          </h2>
          <span className="text-xs text-text-muted">Expiring soon: {expiringCount}</span>
        </div>

        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="text-text-secondary">No products yet.</p>
          ) : (
            filteredProducts.map((p) => {
              const d = daysUntil(p.expiry_date);
              const status = d < 0 ? "Expired" : d <= 3 ? "Expiring" : "Fresh";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 bg-cream-dark border border-beige rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-muted">
                      {p.expiry_date} • {p.quantity ?? 0} {p.unit ?? "pcs"}
                      {p.category ? ` • ${p.category}` : ""}
                      {p.barcode ? ` • #${p.barcode}` : ""}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">{status}</span>
                </div>
              );
            })
          )}
        </div>

        {role === "parent" && (
          <form
            className="grid gap-3 sm:grid-cols-2 mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              addProductMutation.mutate(new FormData(e.currentTarget));
              e.currentTarget.reset();
            }}
          >
            <input name="name" className="input-cozy sm:col-span-2" placeholder="Milk" required />
            <div className="relative">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input name="barcode" className="input-cozy pl-9" placeholder="Barcode (MVP input)" />
            </div>
            <input name="expiryDate" type="date" className="input-cozy" required />
            <input name="category" className="input-cozy" placeholder="Category" />
            <input name="quantity" type="number" min={0} className="input-cozy" defaultValue={1} />
            <select name="unit" className="input-cozy" defaultValue="pcs">
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="l">l</option>
            </select>
            <button className="btn-cozy sm:col-span-2" type="submit" disabled={addProductMutation.isPending}>
              <Plus className="w-4 h-4 inline mr-2" />
              Add product
            </button>
          </form>
        )}
      </div>

      <div className="card-cozy p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="heading-handwritten text-2xl text-brown flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            Shopping List
          </h2>
          <span className="text-xs text-text-muted">{items.length} items</span>
        </div>

        {!listId ? (
          <div className="space-y-3">
            <p className="text-text-secondary">No shopping list yet.</p>
            {role === "parent" && (
              <button
                className="btn-cozy"
                type="button"
                onClick={() => createListMutation.mutate()}
                disabled={createListMutation.isPending}
              >
                Create shared list
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, group]) => (
                <div key={category} className="space-y-2">
                  <div className="text-xs text-text-muted px-1">{category}</div>
                  {group.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full flex items-center justify-between gap-3 bg-cream-dark border border-beige rounded-xl px-4 py-3 text-left"
                      onClick={() =>
                        togglePurchasedMutation.mutate({
                          itemId: item.id,
                          next: !item.is_purchased,
                        })
                      }
                    >
                      <div>
                        <div
                          className={[
                            "font-medium",
                            item.is_purchased ? "line-through text-text-muted" : "text-text-primary",
                          ].join(" ")}
                        >
                          {item.product_name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {item.quantity ?? 1} {item.unit ?? "pcs"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.is_purchased && role === "parent" && (
                          <button
                            type="button"
                            className="btn-cozy py-1 px-3 text-[10px] bg-gold-soft hover:bg-gold-soft-dark"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextWeek = new Date();
                              nextWeek.setDate(nextWeek.getDate() + 7);
                              const fd = new FormData();
                              fd.append("name", item.product_name);
                              fd.append("quantity", String(item.quantity || 1));
                              fd.append("unit", item.unit || "pcs");
                              fd.append("category", item.category || "");
                              fd.append("expiryDate", nextWeek.toISOString().slice(0, 10));
                              addProductMutation.mutate(fd);
                            }}
                          >
                            + Inventory
                          </button>
                        )}
                        <span className="inline-flex items-center text-xs text-text-secondary">
                          <Check className="w-4 h-4 mr-1" />
                          {item.is_purchased ? "Done" : "Mark done"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <form
              className="grid gap-3 sm:grid-cols-5 mt-6 pt-4 border-t border-beige"
              onSubmit={(e) => {
                e.preventDefault();
                addShoppingItemMutation.mutate(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <input type="hidden" name="listId" value={listId} />
              <input
                name="productName"
                className="input-cozy sm:col-span-2"
                placeholder="Add item..."
                required
              />
              <input name="category" className="input-cozy" placeholder="Category" />
              <input name="quantity" type="number" min={1} className="input-cozy" defaultValue={1} />
              <select name="unit" className="input-cozy" defaultValue="pcs">
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="l">l</option>
              </select>
              <button className="btn-cozy sm:col-span-5" type="submit" disabled={addShoppingItemMutation.isPending}>
                Add to list
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
