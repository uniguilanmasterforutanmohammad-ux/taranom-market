import Link from "next/link";
import { Eye, Pencil, Plus, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQuota } from "@/lib/module-service";
import { guardianAccountsOf, PLAN_UPGRADE_KEY } from "@/lib/approval";
import type { PlanTier } from "@/lib/modules";
import { PRODUCT_STATUS_LABEL, PRODUCT_TYPE_LABEL, faDateLabel, faNum, productStatusTone, toman } from "@/lib/format";
import { QuotaLockedCard } from "@/components/quota-locked-card";
import { PlanUpgradeRequest } from "@/components/plan-upgrade-request";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MyProductsPage() {
  const user = await requireUser();
  const [products, quota, guardians, upgradeRequest] = await Promise.all([
    db.product.findMany({ where: { sellerId: user.id }, orderBy: { createdAt: "desc" }, include: { category: true } }),
    getQuota(user),
    guardianAccountsOf(user.id),
    db.approvalRequest.findFirst({
      where: { childId: user.id, moduleKey: PLAN_UPGRADE_KEY },
      orderBy: { createdAt: "desc" },
      select: { status: true, note: true },
    }),
  ]);
  const full = quota.remaining === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-forest">محصولات من</h1>
          <p className="text-[11px] text-slate-500">{faNum(products.length)} محصول ثبت‌شده · {faNum(quota.remaining)} جای خالی</p>
        </div>
        {full ? null : (
          <Link href="/dashboard/products/new" className="kid-btn kid-btn-primary !py-2 text-xs">
            <Plus size={15} /> محصول جدید
          </Link>
        )}
      </div>

      <div className="kid-card p-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-500">مصرف سقف پلن</span>
          <span className="text-forest">{faNum(quota.used)} / {faNum(quota.limit)}</span>
        </div>
        <ProgressBar value={quota.used} max={quota.limit} tone={quota.remaining === 0 ? "bg-pink-500" : "bg-emerald-500"} />
      </div>

      {full ? (
        <QuotaLockedCard plan={user.plan}>
          {upgradeRequest?.status === "PENDING" ? (
            <p className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 px-3 py-2 text-[11px] font-bold text-amber-900">
              درخواست ارتقای پلنت برای والدین فرستاده شده و منتظر پاسخ آن‌هاست.
            </p>
          ) : null}
          <PlanUpgradeRequest
            currentPlan={user.plan}
            hasGuardian={guardians.length > 0}
            requested={(upgradeRequest?.note as PlanTier) ?? null}
          />
        </QuotaLockedCard>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          emoji="🧺"
          title="سبدت خالی است"
          body="اولین ساخته‌ات را ثبت کن؛ چند دقیقه بیشتر طول نمی‌کشد."
          action={
            full ? undefined : (
              <Link href="/dashboard/products/new" className="kid-btn kid-btn-primary text-xs"><Plus size={14} /> ثبت اولین محصول</Link>
            )
          }
        />
      ) : (
        <div className="space-y-2.5">
          {products.map((product) => (
            <div key={product.id} className="kid-card flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: product.category.tint }}>
                {product.category.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-black text-forest">{product.title}</p>
                  <Badge tone={productStatusTone(product.status)}>
                    {PRODUCT_STATUS_LABEL[product.status]}
                  </Badge>
                  <Badge tone="sky">{PRODUCT_TYPE_LABEL[product.type]}</Badge>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {toman(product.price)} · {faNum(product.views)} بازدید · {faDateLabel(product.createdAt)} · {product.category.title}
                </p>
                {product.status === "REJECTED" && product.rejectionReason ? (
                  <p className="mt-1.5 flex items-start gap-1 rounded-lg bg-pink-50 p-2 text-[10px] leading-5 text-pink-800">
                    <ShieldAlert size={12} className="mt-0.5 shrink-0" /> دلیل رد: {product.rejectionReason}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1.5">
                {product.status === "APPROVED" ? (
                  <Link href={`/product/${product.id}`} className="rounded-xl border-2 border-emerald-900/10 bg-white p-2 text-emerald-700 hover:bg-emerald-50" aria-label="مشاهده">
                    <Eye size={15} />
                  </Link>
                ) : null}
                <Link href={`/dashboard/products/${product.id}/edit`} className="rounded-xl border-2 border-emerald-900/10 bg-white p-2 text-emerald-700 hover:bg-emerald-50" aria-label="ویرایش">
                  <Pencil size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
