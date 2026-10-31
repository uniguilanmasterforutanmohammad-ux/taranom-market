import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/products";
import { getModuleStates, getQuota } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { db } from "@/lib/db";
import { guardianAccountsOf, PLAN_UPGRADE_KEY } from "@/lib/approval";
import { requiresGuardianApproval } from "@/lib/children";
import type { PlanTier } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { ProductForm } from "@/components/product-form";
import { QuotaLockedCard } from "@/components/quota-locked-card";
import { PlanUpgradeRequest } from "@/components/plan-upgrade-request";
import { Alert } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ثبت محصول" };

export default async function NewProductPage() {
  const user = await requireUser();
  const states = await getModuleStates(user);
  const uploadState = states.find((state) => state.module.key === "productUpload");

  if (!uploadState?.enabled) return <ModuleOff module={MODULE_MAP.productUpload} />;

  const [categories, quota] = await Promise.all([getCategories(), getQuota(user)]);
  const parentFirst = requiresGuardianApproval(user);

  if (quota.remaining <= 0) {
    const [guardians, upgradeRequest] = await Promise.all([
      guardianAccountsOf(user.id),
      db.approvalRequest.findFirst({
        where: { childId: user.id, moduleKey: PLAN_UPGRADE_KEY },
        orderBy: { createdAt: "desc" },
        select: { status: true, note: true },
      }),
    ]);
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-black text-forest">ثبت ساختهٔ جدید</h1>
          <p className="text-[11px] text-slate-500">امکان ثبت محصول جدید تا ارتقای پلن وجود ندارد.</p>
        </div>
        <QuotaLockedCard plan={user.plan}>
          {upgradeRequest?.status === "PENDING" ? (
            <p className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 px-3 py-2 text-[11px] font-bold text-amber-900">
              درخواست ارتقای پلنت برای والدین فرستاده شده و منتظر پاسخ آن‌هاست.
            </p>
          ) : null}
          {upgradeRequest?.status === "DENIED" ? (
            <p className="rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/70 px-3 py-2 text-[11px] font-bold text-pink-800">
              درخواست قبلی‌ات تأیید نشد؛ می‌توانی دوباره درخواست بدهی.
            </p>
          ) : null}
          <PlanUpgradeRequest
            currentPlan={user.plan}
            hasGuardian={guardians.length > 0}
            requested={(upgradeRequest?.note as PlanTier) ?? null}
          />
        </QuotaLockedCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-forest">ثبت ساختهٔ جدید</h1>
        <p className="text-[11px] text-slate-500">فرم کوتاه است؛ فقط چیزهایی را پر کن که برای معرفی لازم است.</p>
      </div>

      {parentFirst ? (
        <Alert tone="sky" title="محصولت اول به دست والدین می‌رسد">
          می‌توانی همین حالا ساخته‌ات را ثبت کنی؛ اما تا وقتی والدینت آن را تأیید نکنند، برای بازبینی ادمین فرستاده
          نمی‌شود و در ویترین دیده نمی‌شود.
        </Alert>
      ) : null}

      <ProductForm
        categories={categories.map((category) => ({ id: category.id, title: category.title, emoji: category.emoji }))}
        quotaRemaining={quota.remaining}
        parentFirst={parentFirst}
      />
    </div>
  );
}
