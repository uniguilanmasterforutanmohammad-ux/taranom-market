"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingBag, LayoutDashboard, Bell } from "lucide-react";
import { OwlLogo, Wordmark } from "./owl-logo";
import { Avatar } from "./ui";
import { LogoutButton } from "./logout-button";

export function MobileNav({
  links,
  user,
  dashboardHref,
  cartCount,
  unread,
}: {
  links: { href: string; label: string }[];
  user: { name: string; role: string; color: string } | null;
  dashboardHref: string;
  cartCount: number;
  unread: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border-2 border-emerald-900/10 bg-white p-2 text-emerald-900"
        aria-label="باز کردن منو"
      >
        <Menu size={20} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col gap-4 bg-cream p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <OwlLogo size={40} />
                <Wordmark />
              </Link>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border-2 border-emerald-900/10 bg-white p-2" aria-label="بستن منو">
                <X size={18} />
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2 rounded-2xl border-2 border-emerald-900/10 bg-white p-3">
                <Avatar name={user.name} color={user.color} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-forest">{user.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {user.role === "ADMIN" ? "مدیر بازارچه" : user.role === "PARENT" ? "حساب والدین" : "عضو بازارچه"}
                  </p>
                </div>
              </div>
            ) : null}

            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-950/80 hover:bg-emerald-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2 border-t-2 border-dashed border-emerald-900/10 pt-4">
              {user ? (
                <>
                  <Link href={dashboardHref} onClick={() => setOpen(false)} className="kid-btn kid-btn-primary w-full text-sm">
                    <LayoutDashboard size={16} /> پنل من
                  </Link>
                  <Link href="/cart" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl border-2 border-emerald-900/10 bg-white px-3 py-2 text-sm font-bold">
                    <span className="flex items-center gap-2"><ShoppingBag size={16} /> سبد خرید</span>
                    <span className="text-xs text-slate-500">{cartCount} مورد</span>
                  </Link>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Bell size={12} /> {unread} اعلان خوانده‌نشده
                  </p>
                  <LogoutButton className="w-full !py-2.5 text-xs" onDone={() => setOpen(false)} />
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="kid-btn kid-btn-ghost w-full text-sm">ورود</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="kid-btn kid-btn-primary w-full text-sm">ساخت حساب</Link>
                </>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
