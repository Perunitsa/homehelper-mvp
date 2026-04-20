"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Home, ClipboardList, ShoppingBasket, BarChart3, Bell, UserCircle } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/inventory", label: "Inventory", icon: ShoppingBasket },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/notifications", label: "Notify", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-cream-dark border-t border-beige z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-6 gap-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-colors",
                  active
                    ? "bg-white-soft text-text-primary border border-beige"
                    : "text-text-muted hover:text-text-secondary hover:bg-white-soft/50",
                ].join(" ")}
              >
                <div className="text-lg leading-none">
                  <Icon className={`w-5 h-5 ${active ? "text-olive" : ""}`} />
                </div>
                <div className="text-[10px] mt-1 font-medium">{item.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

