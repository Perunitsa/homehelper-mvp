"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "рџЏ " },
  { href: "/tasks", label: "Tasks", icon: "рџ“‹" },
  { href: "/inventory", label: "Inventory", icon: "рџ›’" },
  { href: "/stats", label: "Stats", icon: "рџ“Љ" },
  { href: "/notifications", label: "Notify", icon: "рџ””" },
  { href: "/profile", label: "Profile", icon: "рџ‘¤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 bg-cream-dark border-t border-beige">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-6 gap-1 py-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-xl px-2 py-2 text-center transition-colors",
                  active
                    ? "bg-white-soft text-text-primary border border-beige"
                    : "text-text-muted hover:text-text-secondary hover:bg-white-soft/50",
                ].join(" ")}
              >
                <div className="text-lg leading-none">{item.icon}</div>
                <div className="text-[11px] mt-1 font-medium">{item.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

