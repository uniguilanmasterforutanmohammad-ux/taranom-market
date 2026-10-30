import Link from "next/link";
import { BarChart3, Crown, Eye, Package, TrendingUp, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModuleStates } from "@/lib/module-service";
import { MODULE_MAP, PLANS } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { StatCard } from "@/components/ui";
import { faNum, toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "آمار و گزارش" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  const states = await getModuleStates(user);
  const state = states.find((item) => item.module.key === "analytics");

  if (!state?.enabled) {
    if (state?.reason === "plan") {
      return (
        <div className="kid-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><Crown size={30} /></span>
          <div>
            <p className="text-base font-black text-forest">گزارش تحلیلی برای پلن‌های بالاتر</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-slate-500">
              با پلن {PLANS[user.plan].title} فقط آمار پایه را می‌بینی. برای بازدید دقیق، فروش و عملکرد محصولات به پلن
              {" "}{PLANS.STARTER.title} یا بالاتر ارتقا بده.
            </p>
          </div>
          <Link href="/dashboard/subscription" className="kid-btn kid-btn-primary text-xs"><Crown size={14} /> دیدن پلن‌ها</Link>
        </div>
      );
    }
    return <ModuleOff module={MODULE_MAP.analytics} />;
  }

  const [products, sales] = await Promise.all([
    db.product.findMany({ where: { sellerId: user.id }, orderBy: { views: "desc" } }),
    db.orderItem.findMany({
      where: { sellerId: user.id, order: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } },
      include: { order: { select: { createdAt: true } } },
    }),
  ]);

  const totalViews = products.reduce((sum, product) => sum + product.views, 0);
  const approved = products.filter((product) => product.status === "APPROVED").length;
  const revenue = sales.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const maxViews = Math.max(1, ...products.map((product) => product.views));

  const months: { label: string; total: number }[] = [];
  for (let index = 4; index >= 0; index -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    const label = new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(date);
    const total = sales
      .filter((item) => {
        const created = item.order.createdAt;
        return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth();
      })
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    months.push({ label, total });
  }
  const maxMonth = Math.max(1, ...months.map((month) => month.total));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-black text-forest"><BarChart3 size={20} /> آمار و گزارش</h1>
        <p className="text-[11px] text-slate-500">تصویر داده‌محور از دیده‌شدن و فروش محصولاتت.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="بازدید کل" value={faNum(totalViews)} icon={<Eye size={15} />} />
        <StatCard label="محصولات تأییدشده" value={`${faNum(approved)} / ${faNum(products.length)}`} icon={<Package size={15} />} tone="sky" />
        <StatCard label="فروش کل" value={toman(revenue)} icon={<TrendingUp size={15} />} tone="sun" />
        <StatCard label="درآمد خالص" value={toman(Math.round(revenue * 0.93))} icon={<Wallet size={15} />} tone="berry" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="kid-card p-5">
          <h2 className="text-sm font-black text-forest">پربازدیدترین محصولات</h2>
          <div className="mt-3 space-y-3">
            {products.slice(0, 5).map((product) => (
              <div key={product.id}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="truncate font-bold text-slate-700">{product.title}</span>
                  <span className="mr-2 shrink-0 text-slate-400">{faNum(product.views)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-emerald-950/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(product.views / maxViews) * 100}%` }} />
                </div>
              </div>
            ))}
            {products.length === 0 ? <p className="text-xs text-slate-500">هنوز محصولی نداری.</p> : null}
          </div>
        </section>

        <section className="kid-card p-5">
          <h2 className="text-sm font-black text-forest">فروش در ۵ ماه اخیر</h2>
          <div className="mt-3 flex h-40 items-end justify-between gap-2">
            {months.map((month) => (
              <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-emerald-700">{month.total ? faNum(Math.round(month.total / 1000)) + "k" : "—"}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400" style={{ height: `${Math.max(6, (month.total / maxMonth) * 120)}px` }} />
                <span className="text-[10px] text-slate-500">{month.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="rounded-2xl bg-emerald-50 p-3 text-[11px] leading-6 text-emerald-800">
        آمار بازدید از شمارندهٔ واقعی صفحهٔ محصول و فروش از سفارش‌های پرداخت‌شده محاسبه می‌شود. کارمزد ۷٪ در ستون درآمد خالص کسر شده است.
      </p>
    </div>
  );
}
