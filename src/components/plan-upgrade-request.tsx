"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock3, Crown, Loader2, Send } from "lucide-react";
import { PLANS, PLAN_RANK, type PlanTier } from "@/lib/modules";

const ORDER: PlanTier[] = ["FREE", "STARTER", "PRO"];

export function PlanUpgradeRequest({
  currentPlan,
  hasGuardian,
  requested,
}: {
  currentPlan: PlanTier;
  hasGuardian: boolean;
  /** پلنی که در آخرین درخواست انتخاب شده بود. */
  requested?: PlanTier | null;
}) {
  const router = useRouter();
  const options = ORDER.filter((plan) => PLAN_RANK[plan] > PLAN_RANK[currentPlan]);
  const [plan, setPlan] = useState<PlanTier>(requested ?? options[0] ?? "STARTER");
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "DENIED" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function request() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/approval-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleKey: "planUpgrade", note: plan }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "ثبت درخواست ناموفق بود.");
      return;
    }
    setStatus(data.status === "APPROVED" ? "APPROVED" : "PENDING");
    router.refresh();
  }

  if (!hasGuardian) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] leading-5 text-slate-500">
          راه تماس والدین روی حسابت ثبت نشده است؛ برای ارسال درخواست، اول از والدینت بخواه حسابت را در پنل والدین وصل کنند.
        </p>
        <Link href="/dashboard/subscription" className="kid-btn kid-btn-primary text-xs">
          <Crown size={14} /> ارتقای پلن
        </Link>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <p className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 px-3 py-2 text-[11px] font-bold text-amber-900">
        <Clock3 size={13} /> درخواست ارتقا به «{PLANS[plan].title}» برای والدینت فرستاده شد؛ به‌محض تأیید، سقف ثبت محصولت بیشتر می‌شود.
      </p>
    );
  }

  return (
    <div className="w-full max-w-md space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPlan(option)}
            className={`rounded-2xl border-2 p-3 text-right transition ${
              plan === option ? "border-emerald-600 bg-emerald-50" : "border-emerald-900/10 bg-white hover:bg-emerald-50/50"
            }`}
          >
            <span className="text-lg">{PLANS[option].emoji}</span>
            <p className="text-[11px] font-black text-forest">{PLANS[option].title}</p>
            <p className="text-[10px] text-slate-500">تا {PLANS[option].productLimit} محصول</p>
          </button>
        ))}
      </div>
      <button type="button" onClick={request} disabled={busy} className="kid-btn kid-btn-primary w-full text-xs disabled:opacity-60">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} ارسال درخواست ارتقا پلن برای والدین
      </button>
      {error ? <p className="text-[10px] font-bold text-pink-600">{error}</p> : null}
    </div>
  );
}
