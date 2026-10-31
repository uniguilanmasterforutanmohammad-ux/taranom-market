import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChartNoAxesCombined,
  Crown,
  Eye,
  Package,
  PackagePlus,
  Plus,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEnabledModuleKeys, getQuota, consentBlocked } from "@/lib/module-service";
import { PLANS } from "@/lib/modules";
import { PRODUCT_STATUS_LABEL, faDateLabel, faNum, productStatusTone, toman } from "@/lib/format";
import { Alert, Badge, EmptyState, ProgressBar, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [products, sales, quota, enabled] = await Promise.all([
    db.product.findMany({ where: { sellerId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.orderItem.findMany({
      where: { sellerId: user.id, order: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } },
      select: { quantity: true, unitPrice: true },
    }),
    getQuota(user),
    getEnabledModuleKeys(user),
  ]);

  const notifications = enabled.has("notifications")
    ? await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 })
    : [];

  const approved = products.filter((product) => product.status === "APPROVED").length;
  const pending = products.filter((product) => product.status === "PENDING").length;
  const views = products.reduce((sum, product) => sum + product.views, 0);
  const revenue = sales.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const earning = Math.round(revenue * 0.93);
  const plan = PLANS[user.plan];
  const blocked = consentBlocked(user);
  const canUpload = enabled.has("productUpload") && quota.remaining > 0;

  return (
    <div className="space-y-5">
      {blocked ? (
        <Alert
          tone="sky"
          title="رضایت والدین هنوز تأیید نشده است"
          action={<Link href="/parent" className="kid-btn kid-btn-ghost !py-1.5 text-[11px]">پنل والدین</Link>}
        >
          می‌توانی محصول ثبت کنی، اما محصولت اول برای تأیید والدین می‌رود و بعد برای بازبینی ادمین؛ تا آن زمان در ویترین
          دیده نمی‌شود. درخواست رضایت برای والدینت فرستاده شده است.
        </Alert>
      ) : null}

      <div className="relative overflow-hidden rounded-[2rem] border-2 border-emerald-900/10 bg-gradient-to-l from-emerald-100 via-white to-amber-50 p-6">
        <div className="absolute -left-6 -top-6 text-6xl opacity-20">🌱</div>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-700">سلام {user.name.split(" ")[0]}! 👋</p>
            <h1 className="mt-1 text-2xl font-black text-forest">امروز چه می‌سازیم؟</h1>
            <p className="mt-1 text-xs text-slate-500">سقف پلن {plan.title}: {faNum(quota.limit)} محصول</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500">{faNum(quota.used)} از {faNum(quota.limit)} محصول</span>
              <Link href="/dashboard/subscription" className="text-emerald-700 hover:text-emerald-900">ارتقای پلن</Link>
            </div>
            <ProgressBar value={quota.used} max={quota.limit} tone={quota.remaining === 0 ? "bg-pink-500" : "bg-emerald-500"} />
            <p className="mt-1 text-[10px] text-slate-400">{quota.remaining === 0 ? "سقف پر شد؛ برای ثبت بعدی پلن را ارتقا بده." : `${faNum(quota.remaining)} جای خالی داری.`}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="محصولات تأییدشده" value={faNum(approved)} hint={`${faNum(pending)} در انتظار تأیید`} icon={<BadgeCheck size={16} />} />
        <StatCard label="بازدید کل" value={faNum(views)} hint="مجموع بازدید محصولات" icon={<Eye size={16} />} tone="sky" />
        <StatCard label="فروش (GMV)" value={toman(revenue)} hint="سفارش‌های پرداخت‌شده" icon={<ChartNoAxesCombined size={16} />} tone="sun" />
        <StatCard label="درآمد پس از کارمزد" value={toman(earning)} hint="کارمزد ۷٪ کسر شده" icon={<Wallet size={16} />} tone="berry" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="kid-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-forest"><Package size={16} /> آخرین محصولات</h2>
            <Link href="/dashboard/products" className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900">
              همه <ArrowLeft size={13} />
            </Link>
          </div>

          <div className="mt-3 space-y-2">
            {products.length === 0 ? (
              <EmptyState
                emoji="🧺"
                title="هنوز محصولی ثبت نکرده‌ای"
                body="اولین ساخته‌ات را ثبت کن تا بعد از تأیید در ویترین دیده شود."
                action={
                  enabled.has("productUpload") ? (
                    <Link
                      href={canUpload ? "/dashboard/products/new" : "/dashboard/subscription"}
                      className="kid-btn kid-btn-primary text-xs"
                    >
                      {canUpload ? <Plus size={14} /> : <Crown size={14} />}
                      {canUpload ? "ثبت محصول" : "ارتقای پلن"}
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              products.map((product) => (
                <Link key={product.id} href={product.status === "APPROVED" ? `/product/${product.id}` : `/dashboard/products/${product.id}/edit`} className="flex items-center gap-3 rounded-2xl border border-emerald-900/5 bg-emerald-50/30 p-3 transition hover:bg-emerald-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">🎁</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-forest">{product.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{faDateLabel(product.createdAt)} · {faNum(product.views)} بازدید</p>
                  </div>
                  <Badge tone={productStatusTone(product.status)}>
                    {PRODUCT_STATUS_LABEL[product.status]}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="kid-card p-5">
            <h2 className="text-sm font-black text-forest">میان‌برهای سریع</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={enabled.has("productUpload") ? (canUpload ? "/dashboard/products/new" : "/dashboard/subscription") : "/dashboard/modules"}
                className="rounded-2xl border-2 border-emerald-900/10 bg-white p-3 text-center hover:bg-emerald-50"
              >
                <PackagePlus size={20} className="mx-auto text-emerald-600" />
                <p className="mt-1 text-[11px] font-black text-forest">{canUpload ? "ثبت محصول" : "ارتقای پلن"}</p>
              </Link>
              <Link href="/explore" className="rounded-2xl border-2 border-emerald-900/10 bg-white p-3 text-center hover:bg-emerald-50">
                <Eye size={20} className="mx-auto text-sky-600" />
                <p className="mt-1 text-[11px] font-black text-forest">دیدن ویترین</p>
              </Link>
              <Link href="/dashboard/subscription" className="rounded-2xl border-2 border-emerald-900/10 bg-white p-3 text-center hover:bg-emerald-50">
                <Wallet size={20} className="mx-auto text-amber-600" />
                <p className="mt-1 text-[11px] font-black text-forest">ارتقای پلن</p>
              </Link>
              <Link href="/dashboard/modules" className="rounded-2xl border-2 border-emerald-900/10 bg-white p-3 text-center hover:bg-emerald-50">
                <ShieldAlert size={20} className="mx-auto text-pink-600" />
                <p className="mt-1 text-[11px] font-black text-forest">ماژول‌ها</p>
              </Link>
            </div>
          </section>

          {enabled.has("notifications") ? (
            <section className="kid-card p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-black text-forest"><Bell size={15} /> اعلان‌ها</h2>
              <div className="mt-2 space-y-2">
                {notifications.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">اعلان جدیدی نداری.</p>
                ) : (
                  notifications.map((notification) => (
                    <Link key={notification.id} href={notification.href ?? "/dashboard"} className="block rounded-xl border border-emerald-900/5 bg-emerald-50/40 p-2.5 hover:bg-emerald-50">
                      <p className="text-[11px] font-black text-forest">{notification.title}</p>
                      <p className="mt-0.5 text-[10px] leading-5 text-slate-500">{notification.body}</p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
