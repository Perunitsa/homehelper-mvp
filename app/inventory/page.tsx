import BottomNav from "@/app/_components/BottomNav";
import { requireProfile } from "@/app/_components/requireProfile";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { profile } = await requireProfile();

  return (
    <div className="min-h-full bg-cream flex flex-col">
      <header className="watercolor-gradient px-6 py-8 sm:px-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="heading-handwritten text-4xl sm:text-5xl text-brown">
              Инвентарь
            </h1>
            <p className="text-text-secondary mt-1">
              Продукты, сроки годности и список покупок
            </p>
          </div>
          <a
            href="/dashboard"
            className="btn-cozy btn-cozy-secondary text-sm px-4 py-2 self-center"
          >
            ← Главная
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-12">
        <div className="max-w-5xl mx-auto">
          <InventoryClient
            familyId={profile.family_id}
            role={profile.role as "parent" | "child"}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
