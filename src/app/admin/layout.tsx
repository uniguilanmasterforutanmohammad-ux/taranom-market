import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { Avatar, Badge } from "@/components/ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
  const pending = await db.product.count({ where: { status: "PENDING" } });

  const items: NavItem[] = [
    { href: "/admin", label: "نمای کلی", icon: "home" },
    { href: "/admin/moderation", label: "صف بازبینی", icon: "shield", badge: pending ? String(pending) : undefined },
    { href: "/admin/users", label: "کاربران", icon: "users" },
    { href: "/admin/modules", label: "ماژول‌ها", icon: "slider" },
    { href: "/admin/orders", label: "سفارش‌ها", icon: "bag" },
    { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "folder" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.avatarColor} size={46} />
          <div>
            <p className="text-base font-black text-forest">پنل مدیریت جوانه‌بازار</p>
            <p className="text-[11px] text-slate-500">کنترل کیفیت، ایمنی و ماژول‌های پلتفرم</p>
          </div>
        </div>
        <Badge tone="clay">ادمین</Badge>
      </div>
      <div className="lg:hidden"><DashboardNav items={items} variant="mobile" /></div>
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block"><DashboardNav items={items} /></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
