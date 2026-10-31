"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { PLANS, PLAN_RANK, type PlanTier } from "@/lib/modules";

const ORDER: PlanTier[] = ["FREE", "STARTER", "PRO"];

/** ارتقای پلن فرزند با حساب والدین (پرداخت نمایشی). */
export function PlanUpgradeGuardian({
  childId,
  childName,
  currentPlan,
}: {
  childId: string;
  childName: string;
  currentPlan: PlanTier;
}) {
  const router = useRouter();
  const options = ORDER.filter((plan) => PLAN_RANK[plan] > PLAN_RANK[currentPlan]);
  const [plan, setPlan] = useState<PlanTier>(options[0] ?? "STARTER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upgrade() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, childId }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "ارتقای پلن ناموفق بود.");
      return;
    }
    router.refresh();
  }

  if (options.length === 0) {
    return <p className="text-[10px] font-bold text-emerald-800">بالاترین پلن برای {childName} فعال است. 🌳</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPlan(option)}
            className={`rounded-xl border-2 px-3 py-1.5 text-[11px] font-bold transition ${
              plan === option ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-emerald-900/10 bg-white text-slate-600"
            }`}
          >
            {PLANS[option].emoji} {PLANS[option].title}
          </button>
        ))}
      </div>
      <button type="button" onClick={upgrade} disabled={busy} className="kid-btn kid-btn-primary !py-2 text-xs disabled:opacity-60">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />} ارتقای پلن {childName} (پرداخت نمایشی)
      </button>
      {error ? <p className="text-[10px] font-bold text-pink-600">{error}</p> : null}
    </div>
  );
}
