import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/app/_components/BottomNav";
import ParentReviewRealtimeCard from "@/app/_components/ParentReviewRealtimeCard";
import RewardConfettiListener from "@/app/_components/RewardConfettiListener";
import { signOutAction } from "@/app/auth/actions";
import { quickAddProductAction } from "./actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const error =
    typeof searchParams?.error === "string"
      ? decodeURIComponent(searchParams.error)
      : null;
  const message =
    typeof searchParams?.message === "string"
      ? decodeURIComponent(searchParams.message)
      : null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, role, family_id, current_xp, level")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id) redirect("/onboarding");

  const { data: family } = await supabase
    .from("families")
    .select("invite_code")
    .eq("id", profile.family_id)
    .maybeSingle();

  const { data: myTasks } = await supabase
    .from("tasks")
    .select("id, title, points, status")
    .eq("family_id", profile.family_id)
    .eq("assigned_to", user.id)
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: expiringProducts } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .eq("family_id", profile.family_id)
    .lte("expiry_date", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  const { data: recentProducts } = await supabase
    .from("products")
    .select("id, name, expiry_date, status")
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })
    .limit(3);

  const expiringCount = expiringProducts?.length ?? 0;

  return (
    <div className="min-h-full bg-cream flex flex-col">
      {profile.role === "child" && <RewardConfettiListener userId={user.id} />}

      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Welcome{profile.first_name ? `, ${profile.first_name}` : ""}!
            </h1>
            <p className="text-text-secondary mt-1">Family home command center</p>
          </div>
          <form action={signOutAction}>
            <button className="btn-cozy btn-cozy-secondary text-sm px-4 py-2">Sign out</button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <section className="card-cozy p-4 border-l-4 border-rose-muted">
              <p className="text-rose-muted text-sm">{error}</p>
            </section>
          )}

          {message && (
            <section className="card-cozy p-4 border-l-4 border-olive">
              <p className="text-olive text-sm font-medium">{message}</p>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="card-cozy p-5">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-text-muted">Level</div>
                  <div className="heading-handwritten text-3xl text-brown">{profile.level}</div>
                </div>
                <div className="text-[10px] text-text-secondary font-medium pb-1">
                  {profile.current_xp % 100} / 100 XP
                </div>
              </div>
              <div className="w-full bg-cream-dark rounded-full h-2 overflow-hidden border border-beige">
                <div 
                  className="bg-gold-soft h-full transition-all duration-500 shadow-[0_0_8px_rgba(212,168,75,0.4)]" 
                  style={{ width: `${profile.current_xp % 100}%` }}
                />
              </div>
            </div>
            <div className="card-cozy p-5 flex flex-col justify-center">
              <div className="text-xs text-text-muted">Role</div>
              <div className="heading-handwritten text-3xl text-brown capitalize mt-1">{profile.role}</div>
            </div>
            <Link href="/notifications" className="card-cozy p-5 block group">
              <div className="text-xs text-text-muted group-hover:text-brown transition-colors">Expiring products (3 days)</div>
              <div className="flex items-center justify-between">
                <div className="heading-handwritten text-3xl text-brown mt-1">{expiringCount}</div>
                <span className="text-2xl group-hover:scale-110 transition-transform">🍎</span>
              </div>
            </Link>
          </section>

          {profile.role === "child" && (myTasks ?? []).length > 0 && (
            <section className="card-cozy p-6 bg-gradient-to-br from-white-soft to-mint-light/20 border-l-4 border-mint">
              <h2 className="heading-handwritten text-2xl text-brown mb-4 flex items-center gap-2">
                ✨ Featured Quest
              </h2>
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-xl text-text-primary">{myTasks![0].title}</h3>
                  <p className="text-text-secondary text-sm">Reward: <span className="font-bold text-olive">{myTasks![0].points} XP</span></p>
                </div>
                <Link href="/tasks" className="btn-cozy px-6 py-2 shadow-md">
                  Claim →
                </Link>
              </div>
            </section>
          )}

          {profile.role === "parent" && (
            <>
              <ParentReviewRealtimeCard familyId={profile.family_id} />

              <section className="card-cozy p-6">
                <h2 className="heading-handwritten text-2xl text-brown mb-2">Quick Add Product</h2>
                <p className="text-text-muted text-sm mb-4">
                  Barcode is simulated for MVP and can be replaced with scanner API later.
                </p>
                <form action={quickAddProductAction} className="grid gap-3 sm:grid-cols-3">
                  <input name="name" className="input-cozy" placeholder="Product name" required />
                  <input name="barcode" className="input-cozy" placeholder="Barcode (optional)" />
                  <input name="expiryDate" type="date" className="input-cozy" required />
                  <button className="btn-cozy sm:col-span-3" type="submit">
                    Add Product
                  </button>
                </form>
              </section>

              <section className="card-cozy p-6">
                <h2 className="heading-handwritten text-2xl text-brown mb-3">Recent Products</h2>
                {(recentProducts ?? []).length === 0 ? (
                  <p className="text-text-secondary italic">No products in inventory yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {(recentProducts ?? []).map((p) => (
                      <div key={p.id} className="bg-cream-dark border border-beige rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-text-primary">{p.name}</div>
                          <div className="text-xs text-text-muted">Exp: {p.expiry_date}</div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          p.status === 'expired' ? 'bg-rose-muted/20 text-rose-muted' :
                          p.status === 'expiring' ? 'bg-gold-soft/20 text-gold-soft' :
                          'bg-olive/20 text-olive'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                    <Link href="/inventory" className="text-olive text-sm font-medium hover:underline mt-2 inline-block">
                      View all inventory →
                    </Link>
                  </div>
                )}
              </section>
            </>
          )}

          <section className="card-cozy p-6">
            <h2 className="heading-handwritten text-2xl text-brown mb-3">My Quests</h2>
            {(myTasks ?? []).length === 0 ? (
              <p className="text-text-secondary">No active quests yet.</p>
            ) : (
              <div className="space-y-3">
                {(myTasks ?? []).map((t) => (
                  <div key={t.id} className="bg-cream-dark border border-beige rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-text-primary">{t.title}</div>
                      <div className="text-xs text-text-muted">{t.points} XP • {t.status === 'pending' ? 'ожидает' : 'на проверке'}</div>
                    </div>
                    <Link href="/tasks" className="btn-cozy text-xs px-4 py-2">Done</Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-4">
            <Link href="/tasks" className="card-cozy p-5 block">Quest Board</Link>
            <Link href="/inventory" className="card-cozy p-5 block">Inventory & Shopping</Link>
            <Link href="/stats" className="card-cozy p-5 block">Stats</Link>
            <Link href="/profile" className="card-cozy p-5 block">Profile</Link>
          </section>

          {family?.invite_code && profile.role === "parent" && (
            <section className="card-cozy p-5 border-l-4 border-gold-soft">
              <div className="text-sm text-text-secondary mb-2">Family invite code</div>
              <code className="text-xl font-semibold text-brown">{family.invite_code}</code>
            </section>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

