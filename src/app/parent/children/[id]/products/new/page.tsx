import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { requireChildAccess } from "@/lib/children";
import { getCategories } from "@/lib/products";
import { getModuleStates, getQuota } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { ProductForm } from "@/components/product-form";
import { QuotaLockedCard } from "@/components/quota-locked-card";
import { PlanUpgradeGuardian } from "@/components/plan-upgrade-guardian";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ثبت محصول برای فرزند" };

export default async function NewChildProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (user.role === "CHILD") redirect("/dashboard");

  const child = await requireChildAccess(user, id);
  if (!child) notFound();

  const [parentStates, childStates] = await Promise.all([getModuleStates(user), getModuleStates(child)]);
  const uploadEnabled = (states: typeof parentStates) =>
    Boolean(states.find((state) => state.module.key === "productUpload")?.enabled);
  if (!uploadEnabled(parentStates) || !uploadEnabled(childStates)) return <ModuleOff module={MODULE_MAP.productUpload} />;

  const [categories, quota] = await Promise.all([getCategories(), getQuota(child)]);

  if (quota.remaining <= 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Link href={`/parent/children/${child.id}`} className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900">
          <ArrowRight size={13} /> بازگشت به محصولات {child.name}
        </Link>
        <QuotaLockedCard plan={child.plan} ownerLabel={child.name}>
          <PlanUpgradeGuardian childId={child.id} childName={child.name} currentPlan={child.plan} />
        </QuotaLockedCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Link href={`/parent/children/${child.id}`} className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900">
        <ArrowRight size={13} /> بازگشت به محصولات {child.name}
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black text-forest">ثبت محصول برای {child.name}</h1>
          {child.managedByGuardian ? <Badge tone="clay">تحت مدیریت والدین</Badge> : null}
        </div>
        <p className="text-[11px] text-slate-500">
          فرم کوتاه است؛ محصول به نام فرزندت ثبت می‌شود و پس از تأیید ادمین منتشر می‌شود.
        </p>
      </div>

      <ProductForm
        categories={categories.map((category) => ({ id: category.id, title: category.title, emoji: category.emoji }))}
        quotaRemaining={quota.remaining}
        ownerId={child.id}
        ownerName={child.name}
        redirectTo={`/parent/children/${child.id}`}
      />
    </div>
  );
}
