import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEnabledModuleKeys, getQuota } from "@/lib/module-service";
import { db } from "@/lib/db";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { Avatar, Badge } from "@/components/ui";
import { PLANS } from "@/lib/modules";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role === "PARENT") redirect("/parent");

  const [enabled, pendingCount, quota] = await Promise.all([
    getEnabledModuleKeys(user),
    db.product.count({ where: { sellerId: user.id, status: "PENDING" } }),
    getQuota(user),
  ]);

  const items: NavItem[] = [{ href: "/dashboard", label: "نمای کلی", icon: "home" }];
  if (enabled.has("productUpload")) {
    items.push({ href: "/dashboard/products", label: "محصولات من", icon: "package", badge: pendingCount ? String(pendingCount) : undefined });
    // وقتی سقف پلن پر است، ورودی «ثبت محصول» از منو برداشته می‌شود.
    if (quota.remaining > 0) items.push({ href: "/dashboard/products/new", label: "ثبت محصول", icon: "plus" });
  }
  if (enabled.has("orders")) items.push({ href: "/dashboard/orders", label: "سفارش‌ها", icon: "bag" });
  if (enabled.has("sellerContact")) items.push({ href: "/dashboard/messages", label: "پیام‌ها", icon: "chat" });
  if (enabled.has("analytics")) items.push({ href: "/dashboard/analytics", label: "آمار و گزارش", icon: "chart" });
  if (enabled.has("subscriptions")) items.push({ href: "/dashboard/subscription", label: "اشتراک من", icon: "crown" });
  items.push({ href: "/dashboard/modules", label: "ماژول‌های من", icon: "slider" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.avatarColor} size={48} />
          <div>
            <p className="text-base font-black text-forest">{user.name}</p>
            <p className="text-[11px] text-slate-500">
              فروشندهٔ {PLANS[user.plan].title} · {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={user.plan === "PRO" ? "clay" : user.plan === "STARTER" ? "sun" : "mint"}>
            {PLANS[user.plan].emoji} پلن {PLANS[user.plan].title}
          </Badge>
          {user.role === "ADMIN" ? <Badge tone="berry">ادمین</Badge> : null}
        </div>
      </div>

      <div className="lg:hidden">
        <DashboardNav items={items} variant="mobile" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <DashboardNav items={items} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
