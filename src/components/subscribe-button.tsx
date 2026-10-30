"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export function SubscribeButton({ plan, current, price }: { plan: string; current: boolean; price: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function subscribe() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "تغییر پلن ناموفق بود.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (current) {
    return (
      <span className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-100 py-2 text-[11px] font-black text-emerald-800">
        <Check size={13} /> پلن فعلی شما
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={subscribe}
        disabled={loading || done}
        className="kid-btn kid-btn-primary w-full !py-2 text-[11px] disabled:opacity-60"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : done ? <Check size={13} /> : null}
        {done ? "فعال شد" : price === 0 ? "انتخاب پلن رایگان" : "فعال‌سازی (پرداخت نمایشی)"}
      </button>
      {error ? <p className="mt-1 text-center text-[10px] font-bold text-pink-600">{error}</p> : null}
    </div>
  );
}
