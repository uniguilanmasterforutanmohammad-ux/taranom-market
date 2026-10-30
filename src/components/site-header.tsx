import Link from "next/link";
import { Bell, LayoutDashboard, ShieldCheck, ShoppingBag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isModuleEnabled } from "@/lib/module-service";
import { OwlLogo, Wordmark } from "./owl-logo";
import { Avatar, Badge } from "./ui";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  let cartCount = 0;
  let unread = 0;

  if (user) {
    if (await isModuleEnabled("cart", user)) {
      cartCount = await db.cartItem.count({ where: { userId: user.id } });
    }
    if (await isModuleEnabled("notifications", user)) {
      unread = await db.notification.count({ where: { userId: user.id, read: false } });
    }
  }

  const links = [
    { href: "/", label: "خانه" },
    { href: "/explore", label: "بازارچه" },
    { href: "/#modules", label: "ماژول‌ها" },
    { href: "/#trust", label: "ایمنی kids" },
  ];
  const dashboardHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b-2 border-emerald-900/10 bg-cream/90 backdrop-blur">
      <div className="bg-forest text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-medium sm:justify-between">
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-300" />
            بازارچه‌ای امن برای کودکان و نوجوانان — هر محصول با بازبینی انسانی منتشر می‌شود.
          </p>
          <p className="hidden items-center gap-1 text-emerald-200 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            فاز ۱ و ۲ فعال
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <OwlLogo size={46} className="drop-shadow-sm" />
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 text-sm font-bold text-emerald-950/70 transition hover:bg-emerald-100/70 hover:text-emerald-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-2">
          {user && (await isModuleEnabled("cart", user)) ? (
            <Link
              href="/cart"
              className="relative hidden rounded-xl border-2 border-emerald-900/10 bg-white p-2 text-emerald-800 hover:bg-emerald-50 sm:block"
              aria-label="سبد خرید"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 ? (
                <span className="absolute -left-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="relative hidden items-center gap-1.5 rounded-xl border-2 border-emerald-900/10 bg-white px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 sm:flex"
              >
                <LayoutDashboard size={16} />
                {user.role === "ADMIN" ? "پنل مدیریت" : "پنل من"}
                {unread > 0 ? (
                  <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-800">
                    <Bell size={10} /> {unread}
                  </span>
                ) : null}
              </Link>
              <Link href={dashboardHref} className="flex items-center gap-2" aria-label="پروفایل">
                <Avatar name={user.name} color={user.avatarColor} size={36} />
              </Link>
              <Badge tone={user.role === "ADMIN" ? "clay" : user.role === "PARENT" ? "sky" : "mint"} className="hidden lg:inline-flex">
                {user.role === "ADMIN" ? "ادمین" : user.role === "PARENT" ? "والدین" : "عضو بازارچه"}
              </Badge>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100/70 sm:block">
                ورود
              </Link>
              <Link href="/register" className="kid-btn kid-btn-primary !px-4 !py-2 text-sm">
                عضو شو
              </Link>
            </>
          )}
          <MobileNav
            links={links}
            user={user ? { name: user.name, role: user.role, color: user.avatarColor } : null}
            dashboardHref={dashboardHref}
            cartCount={cartCount}
            unread={unread}
          />
        </div>
      </div>
    </header>
  );
}
