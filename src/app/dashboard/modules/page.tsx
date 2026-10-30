import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getGlobalSettings, getModuleStates } from "@/lib/module-service";
import { MODULE_GROUPS, PLANS, PLAN_RANK } from "@/lib/modules";
import { ModuleIcon } from "@/components/module-icon";
import { ModuleToggle } from "@/components/module-toggle";
import { ApprovalRequestButton } from "@/components/approval-request-button";
import { approvalStatusByModule } from "@/lib/approval";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ماژول‌های من" };

export default async function MyModulesPage() {
  const user = await requireUser();
  const [states, global] = await Promise.all([getModuleStates(user), getGlobalSettings()]);
  const approvalMap = user.role === "CHILD" ? await approvalStatusByModule(user.id) : {};

  const visible = states.filter(({ module }) => {
    if (module.adminOnly && user.role !== "ADMIN") return false;
    if (module.roles && !module.roles.includes(user.role)) return false;
    return true;
  });

  const enabledCount = visible.filter((state) => state.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-forest">ماژول‌های من</h1>
          <p className="text-[11px] text-slate-500">
            {enabledCount} از {visible.length} ماژول روشن است. کلیدها در پنل و در API هم اعمال می‌شوند.
          </p>
        </div>
        <Badge tone="mint"><Sparkles size={12} /> قابل شخصی‌سازی</Badge>
      </div>

      <div className="rounded-2xl border-2 border-emerald-900/10 bg-emerald-50/60 p-3 text-[11px] leading-6 text-emerald-900">
        ماژول‌های «هسته» برای ایمنی کودکان همیشه روشن‌اند. ماژول‌های نیازمند پلن با ارتقای اشتراک باز می‌شوند و
        مدیر بازارچه می‌تواند هر ماژول را برای کل پلتفرم خاموش کند.
      </div>

      {MODULE_GROUPS.map((group) => {
        const items = visible.filter(({ module }) => module.group === group.key);
        if (items.length === 0) return null;
        return (
          <section key={group.key} className="space-y-2">
            <h2 className="flex items-center gap-1.5 px-1 text-xs font-black text-slate-600">
              <span>{group.emoji}</span> {group.title}
              <span className="mr-auto text-[10px] font-normal text-slate-400">{items.length} ماژول</span>
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {items.map(({ module, enabled, reason }) => {
                const globalOff = !module.locked && !(global[module.key] ?? module.defaultEnabled);
                const planBlocked = Boolean(module.minPlan && PLAN_RANK[user.plan] < PLAN_RANK[module.minPlan]);
                const locked = Boolean(module.locked);
                const needsParent = Boolean(module.parentApproval && user.role === "CHILD");
                const canToggle = !locked && !globalOff && !planBlocked && !module.adminOnly && !needsParent;
                return (
                  <div key={module.key} className={`kid-card p-4 ${!enabled ? "opacity-90" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        <ModuleIcon name={module.icon} size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-black text-forest">{module.title}</p>
                          {module.phase === 2 ? <Badge tone="sun" className="!px-1.5 !py-0.5 !text-[9px]">فاز ۲</Badge> : null}
                          {module.minPlan ? <Badge tone="clay" className="!px-1.5 !py-0.5 !text-[9px]">{PLANS[module.minPlan].title}</Badge> : null}
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">{module.short}</p>
                        {locked ? (
                          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-700"><Lock size={11} /> همیشه روشن (هستهٔ ایمنی)</p>
                        ) : globalOff ? (
                          <p className="mt-1.5 text-[10px] font-bold text-pink-600">توسط مدیر بازارچه برای همه خاموش شده است.</p>
                        ) : planBlocked ? (
                          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                            <Crown size={11} /> نیازمند پلن {PLANS[module.minPlan!].title}
                            <Link href="/dashboard/subscription" className="underline">ارتقا</Link>
                          </p>
                        ) : reason === "role" ? (
                          <p className="mt-1.5 text-[10px] text-slate-400">برای نقش شما در دسترس نیست.</p>
                        ) : needsParent ? (
                          <p className="mt-1.5 text-[10px] font-bold text-sky-700">
                            {enabled ? "والدین این اجازه را فعال کرده‌اند." : "با تأیید والدین از پنل والدین روشن می‌شود."}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[10px] text-slate-400">{enabled ? "روشن و در دسترس" : "خاموش شده توسط شما"}</p>
                        )}
                      </div>
                      <ModuleToggle moduleKey={module.key} enabled={enabled} scope="user" disabled={!canToggle} />
                    </div>
                    {needsParent && !globalOff ? (
                      <ApprovalRequestButton
                        moduleKey={module.key}
                        title={module.title}
                        granted={enabled}
                        initialStatus={approvalMap[module.key]?.status ?? null}
                        compact
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
