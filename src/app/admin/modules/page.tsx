import { Lock, SlidersHorizontal } from "lucide-react";
import { getGlobalSettings } from "@/lib/module-service";
import { MODULES, MODULE_GROUPS, PLANS, PURCHASE_MODULE_KEYS } from "@/lib/modules";
import { ModuleIcon } from "@/components/module-icon";
import { ModuleToggle } from "@/components/module-toggle";
import { PurchaseModeSwitch } from "@/components/purchase-mode-switch";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "مدیریت ماژول‌ها" };

export default async function AdminModulesPage() {
  const global = await getGlobalSettings();
  const purchaseOn = PURCHASE_MODULE_KEYS.every((key) => global[key] ?? true);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-black text-forest"><SlidersHorizontal size={19} /> مدیریت ماژول‌ها</h1>
        <p className="text-[11px] leading-6 text-slate-500">
          هر کلید برای کل پلتفرم اعمال می‌شود و در سرور جلوی دسترسی را می‌گیرد. ماژول‌های هسته برای ایمنی کودکان قابل خاموش‌شدن نیستند.
        </p>
      </div>

      <PurchaseModeSwitch enabled={purchaseOn} />

      {MODULE_GROUPS.map((group) => (
        <section key={group.key} className="space-y-2">
          <h2 className="px-1 text-xs font-black text-slate-600">{group.emoji} {group.title}</h2>
          <div className="grid gap-2.5 md:grid-cols-2">
            {MODULES.filter((module) => module.group === group.key).map((module) => {
              const enabled = global[module.key] ?? module.defaultEnabled;
              return (
                <div key={module.key} className="kid-card flex items-start gap-3 p-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    <ModuleIcon name={module.icon} size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <p className="text-xs font-black text-forest">{module.title}</p>
                      {module.phase === 2 ? <Badge tone="sun" className="!px-1.5 !py-0 !text-[9px]">فاز ۲</Badge> : null}
                      {module.minPlan ? <Badge tone="clay" className="!px-1.5 !py-0 !text-[9px]">{PLANS[module.minPlan].title}+</Badge> : null}
                    </div>
                    <p className="mt-1 text-[10px] leading-5 text-slate-500">{module.description}</p>
                    {module.locked ? (
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Lock size={10} /> هستهٔ همیشه روشن</p>
                    ) : (
                      <p className="mt-1 text-[10px] text-slate-400">{enabled ? "برای همه روشن" : "برای همه خاموش"}</p>
                    )}
                  </div>
                  <ModuleToggle moduleKey={module.key} enabled={enabled} scope="global" disabled={module.locked} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
