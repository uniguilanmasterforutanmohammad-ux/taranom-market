import { CheckCircle2, CreditCard, RefreshCw } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModuleStates } from "@/lib/module-service";
import { MODULE_MAP, PLANS, type PlanTier } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { SubscribeButton } from "@/components/subscribe-button";
import { Badge, ProgressBar } from "@/components/ui";
import { faDateLabel, faNum, toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "اشتراک من" };

export default async function SubscriptionPage() {
  const user = await requireUser();
  const states = await getModuleStates(user);
  if (!states.find((state) => state.module.key === "subscriptions")?.enabled) {
    return <ModuleOff module={MODULE_MAP.subscriptions} />;
  }

  const subscription = await db.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
  });
  const productCount = await db.product.count({ where: { sellerId: user.id } });
  const plans: PlanTier[] = ["FREE", "STARTER", "PRO"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-forest">اشتراک و پلن‌ها</h1>
        <p className="text-[11px] text-slate-500">سقف آپلود و امکانات حساب را با پلن مناسب مدیریت کن.</p>
      </div>

      <div className="kid-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-l from-emerald-50 to-white p-5">
        <div>
          <p className="text-[11px] font-bold text-slate-500">پلن فعلی</p>
          <p className="mt-1 text-lg font-black text-forest">{PLANS[user.plan].emoji} {PLANS[user.plan].title}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">مصرف {faNum(productCount)} از {faNum(PLANS[user.plan].productLimit)} محصول</p>
          <div className="mt-2 w-48"><ProgressBar value={productCount} max={PLANS[user.plan].productLimit} /></div>
        </div>
        <div className="text-left">
          {subscription ? (
            <>
              <Badge tone="mint"><CheckCircle2 size={11} /> فعال</Badge>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><RefreshCw size={12} /> تمدید بعدی: {faDateLabel(subscription.renewsAt)}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">صورتحساب ماهانه: {toman(subscription.price)}</p>
            </>
          ) : (
            <Badge tone="slate">پلن رایگان — بدون صورتحساب</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {plans.map((planKey) => {
          const plan = PLANS[planKey];
          const current = user.plan === planKey;
          return (
            <div key={planKey} className={`kid-card relative flex flex-col p-5 ${current ? "border-emerald-500 ring-2 ring-emerald-200" : ""}`}>
              {planKey === "STARTER" ? (
                <span className="absolute -top-2.5 right-4 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-amber-950">پیشنهاد ما</span>
              ) : null}
              <p className="text-2xl">{plan.emoji}</p>
              <p className="mt-1 text-sm font-black text-forest">{plan.title}</p>
              <p className="mt-0.5 text-lg font-black text-emerald-700">{plan.price === 0 ? "رایگان" : `${faNum(plan.price)} تومان`}</p>
              <p className="text-[10px] text-slate-400">{plan.price === 0 ? "همیشه" : "در ماه"}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-600">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-600" /> {perk}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <SubscribeButton plan={planKey} current={current} price={plan.price} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-[11px] leading-6 text-emerald-900">
        <CreditCard size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        پرداخت در این نسخهٔ نمایشی شبیه‌سازی می‌شود و هیچ شمارهٔ کارت واقعی ذخیره نمی‌شود. پس از اتصال درگاه واقعی،
        یادآور تمدید و صورتحساب ماهانه از همین صفحه در دسترس خواهد بود.
      </div>
    </div>
  );
}
