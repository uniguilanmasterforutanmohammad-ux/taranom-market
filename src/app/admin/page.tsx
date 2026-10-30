import Link from "next/link";
import { Clock, Package, ShieldCheck, TrendingUp, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { getGlobalSettings } from "@/lib/module-service";
import { MODULES } from "@/lib/modules";
import { ORDER_STATUS_LABEL, PRODUCT_STATUS_LABEL, faDateLabel, faNum, toman } from "@/lib/format";
import { Badge, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [users, products, pending, approved, orders, audits, global] = await Promise.all([
    db.user.count(),
    db.product.count(),
    db.product.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { status: "APPROVED" } }),
    db.order.findMany({ where: { status: { not: "PENDING_PAYMENT" } }, select: { total: true, fee: true }, take: 500 }),
    db.auditLog.findMany({ include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
    getGlobalSettings(),
  ]);
  const gmv = orders.reduce((sum, order) => sum + order.total, 0);
  const fees = orders.reduce((sum, order) => sum + order.fee, 0);
  const onModules = MODULES.filter((module) => module.locked || (global[module.key] ?? module.defaultEnabled)).length;
  const queue = await db.product.findMany({ where: { status: "PENDING" }, include: { seller: true, category: true }, orderBy: { createdAt: "asc" }, take: 4 });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-forest">نمای کلی پلتفرم</h1>
        <p className="text-[11px] text-slate-500">سلامت بازارچه در یک نگاه؛ از صف بازبینی تا درآمد کارمزد.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="کاربران" value={faNum(users)} hint="کودک، والد و ادمین" icon={<Users size={15} />} />
        <StatCard label="محصولات" value={faNum(products)} hint={`${faNum(approved)} تأییدشده`} icon={<Package size={15} />} tone="sky" />
        <StatCard label="GMV" value={toman(gmv)} hint="سفارش‌های پرداخت‌شده" icon={<TrendingUp size={15} />} tone="sun" />
        <StatCard label="درآمد کارمزد" value={toman(fees)} hint="۷٪ از فروش" icon={<Wallet size={15} />} tone="berry" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="kid-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-forest"><Clock size={15} /> صف بازبینی</h2>
            <Link href="/admin/moderation" className="text-[11px] font-bold text-emerald-700">همه ({faNum(pending)})</Link>
          </div>
          <div className="mt-3 space-y-2">
            {queue.length === 0 ? (
              <p className="rounded-2xl bg-emerald-50 p-4 text-center text-xs text-emerald-800">صف خالی است. همه‌چیز تأیید شده ✅</p>
            ) : (
              queue.map((product) => (
                <Link key={product.id} href="/admin/moderation" className="flex items-center gap-2.5 rounded-2xl border border-emerald-900/5 bg-amber-50/40 p-2.5 hover:bg-amber-50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">{product.category.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-black text-forest">{product.title}</p>
                    <p className="text-[10px] text-slate-400">{product.seller.name} · {faDateLabel(product.createdAt)}</p>
                  </div>
                  <Badge tone="sun">{PRODUCT_STATUS_LABEL[product.status]}</Badge>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="kid-card p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-black text-forest"><ShieldCheck size={15} /> وضعیت ماژول‌ها</h2>
          <p className="mt-2 text-[11px] text-slate-500">{faNum(onModules)} از {faNum(MODULES.length)} ماژول روشن است.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {MODULES.map((module) => {
              const on = module.locked || (global[module.key] ?? module.defaultEnabled);
              return <span key={module.key} className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${on ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{module.title}</span>;
            })}
          </div>
          <Link href="/admin/modules" className="kid-btn kid-btn-ghost mt-3 w-full !py-1.5 text-[11px]">مدیریت ماژول‌ها</Link>
        </section>
      </div>

      <section className="kid-card p-5">
        <h2 className="text-sm font-black text-forest">رخدادهای اخیر (Audit Log)</h2>
        <div className="mt-2 divide-y divide-emerald-900/5">
          {audits.map((audit) => (
            <div key={audit.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[11px]">
              <span className="font-bold text-slate-700">{audit.action}</span>
              <span className="text-slate-400">{audit.actor?.name ?? "سیستم"} · {audit.detail ?? audit.entity}</span>
              <span className="text-[10px] text-slate-400">{faDateLabel(audit.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
