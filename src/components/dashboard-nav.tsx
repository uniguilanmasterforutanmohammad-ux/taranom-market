"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Package,
  PackagePlus,
  ShoppingBag,
  SlidersHorizontal,
  Crown,
  ShieldCheck,
  Users,
  FolderTree,
  MessageCircle,
} from "lucide-react";
import { LogoutButton } from "./logout-button";

const ICONS = {
  home: Home,
  package: Package,
  plus: PackagePlus,
  bag: ShoppingBag,
  chart: BarChart3,
  crown: Crown,
  slider: SlidersHorizontal,
  shield: ShieldCheck,
  users: Users,
  folder: FolderTree,
  chat: MessageCircle,
};

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: string;
};

export function DashboardNav({ items, variant = "desktop" }: { items: NavItem[]; variant?: "desktop" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-[11px] font-bold ${
                active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-900/10 bg-white text-emerald-900"
              }`}
            >
              <Icon size={14} /> {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="kid-card sticky top-28 overflow-hidden">
      <nav className="flex flex-col gap-0.5 p-2">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                active ? "bg-emerald-700 text-white" : "text-emerald-950/75 hover:bg-emerald-50"
              }`}
            >
              <Icon size={16} />
              {item.label}
              {item.badge ? (
                <span className={`mr-auto rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <LogoutButton variant="row" />
    </div>
  );
}
