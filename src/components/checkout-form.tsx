"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

export function CheckoutForm({ isMinor, totalLabel }: { isMinor: boolean; totalLabel: string }) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [parentConfirmed, setParentConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isMinor && !parentConfirmed) {
      setError("بدون تأیید والدین امکان پرداخت نیست.");
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, note, parentConfirmed }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "پرداخت ناموفق بود.");
      return;
    }
    router.push(`/orders/${data.orderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label>
        <span className="kid-label">نشانی تحویل</span>
        <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={2} className="kid-field" placeholder="شهر، خیابان، کوچه و پلاک" required />
      </label>
      <label>
        <span className="kid-label">یادداشت برای فروشنده (اختیاری)</span>
        <input value={note} onChange={(event) => setNote(event.target.value)} className="kid-field" placeholder="مثلاً رنگ آبی را بیشتر دوست دارم" />
      </label>

      {isMinor ? (
        <label className="flex items-start gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
          <input type="checkbox" checked={parentConfirmed} onChange={(event) => setParentConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
          <span className="text-[11px] leading-5 text-amber-900">
            <strong className="block">تأیید والدین</strong>
            تأیید می‌کنم این خرید با اطلاع و موافقت والد یا سرپرست انجام می‌شود.
          </span>
        </label>
      ) : null}

      {error ? <p className="rounded-xl bg-pink-50 p-2.5 text-xs font-bold text-pink-700">{error}</p> : null}

      <button type="submit" disabled={loading} className="kid-btn kid-btn-primary w-full text-sm disabled:opacity-60">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        پرداخت {totalLabel}
      </button>
      <p className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
        <ShieldCheck size={12} /> درگاه نمایشی — هیچ دادهٔ کارت واقعی ذخیره نمی‌شود.
      </p>
    </form>
  );
}
