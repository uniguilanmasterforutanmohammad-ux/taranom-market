import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, PackagePlus, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireChildAccess } from "@/lib/children";
import { getQuota } from "@/lib/module-service";
import { ageLabel } from "@/lib/age";
import { PRODUCT_STATUS_LABEL, PRODUCT_TYPE_LABEL, faDateLabel, faNum, productStatusTone, toman } from "@/lib/format";
import { Avatar, Badge, EmptyState, ProgressBar } from "@/components/ui";
import { QuotaLockedCard } from "@/components/quota-locked-card";
import { PlanUpgradeGuardian } from "@/components/plan-upgrade-guardian";

export const dynamic = "force-dynamic";
export const metadata = { title: "محصولات فرزند" };

export default async function ParentChildProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (user.role === "CHILD") redirect("/dashboard");

  const child = await requireChildAccess(user, id);
  if (!child) notFound();

  const [products, quota] = await Promise.all([
    db.product.findMany({ where: { sellerId: child.id }, orderBy: { createdAt: "desc" }, include: { category: true } }),
    getQuota(child),
  ]);
  const full = quota.remaining === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Link href="/parent" className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900">
        <ArrowRight size={13} /> بازگشت به پنل والدین
      </Link>

      <div className="kid-card flex flex-wrap items-center gap-3 p-4">
        <Avatar name={child.name} color={child.avatarColor} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-base font-black text-forest">{child.name}</p>
            <Badge tone="sky">{ageLabel(child.birthDate)}</Badge>
            {child.managedByGuardian ? <Badge tone="clay">تحت مدیریت والدین</Badge> : null}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {child.managedByGuardian
              ? "بدون حساب مستقل — همهٔ کارها با حساب شما انجام می‌شود"
              : `${faNum(products.length)} محصول در این حساب ثبت شده است`}
          </p>
        </div>
        {full ? null : (
          <Link href={`/parent/children/${child.id}/products/new`} className="kid-btn kid-btn-primary !py-2 text-xs">
            <PackagePlus size={14} /> ثبت محصول برای {child.name}
          </Link>
        )}
      </div>

      <div className="kid-card p-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-500">مصرف سقف پلن {child.name}</span>
          <span className="text-forest">{faNum(quota.used)} / {faNum(quota.limit)}</span>
        </div>
        <ProgressBar value={quota.used} max={quota.limit} tone={quota.remaining === 0 ? "bg-pink-500" : "bg-emerald-500"} />
        <p className="mt-1.5 text-[10px] text-slate-400">
          {full ? "سقف پلن پر است؛ تا ارتقای پلن، ثبت محصول جدید برای این فرزند ممکن نیست." : `${faNum(quota.remaining)} جای خالی باقی است.`}
        </p>
      </div>

      {full ? (
        <QuotaLockedCard plan={child.plan} ownerLabel={child.name}>
          <p className="text-[10px] leading-5 text-slate-500">
            می‌توانی همین‌جا با حساب خودت پلن فرزندت را ارتقا بدهی؛ اگر هم فرزندت درخواست ارتقا فرستاده باشد، همان
            درخواست در بخش «درخواست‌های در انتظار تأیید» بالای پنل والدین می‌آید.
          </p>
          <PlanUpgradeGuardian childId={child.id} childName={child.name} currentPlan={child.plan} />
        </QuotaLockedCard>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          emoji="🧺"
          title="هنوز محصولی برای این فرزند ثبت نشده"
          body="ساختهٔ فرزندت را با همان فرم همیشگی ثبت کن؛ محصول به نام او و با حساب تو ثبت می‌شود."
          action={full ? undefined : (
            <Link href={`/parent/children/${child.id}/products/new`} className="kid-btn kid-btn-primary text-xs">
              <PackagePlus size={14} /> ثبت اولین محصول
            </Link>
          )}
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
                  {product.viaGuardian ? <Badge tone="clay">ثبت‌شده توسط والدین</Badge> : null}
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {faDateLabel(product.createdAt)} · {toman(product.price)} · {faNum(product.views)} بازدید
                </p>
                {product.status === "REJECTED" && product.rejectionReason ? (
                  <p className="mt-1 rounded-xl bg-pink-50 p-2 text-[10px] leading-5 text-pink-800">دلیل رد: {product.rejectionReason}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/product/${product.id}`} className="kid-btn kid-btn-ghost !py-1.5 text-[11px]">صفحهٔ محصول</Link>
                <Link href={`/parent/children/${child.id}/products/${product.id}`} className="kid-btn kid-btn-primary !py-1.5 text-[11px]">
                  <Pencil size={12} /> ویرایش
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
