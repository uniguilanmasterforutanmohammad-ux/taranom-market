"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShoppingBag, ShoppingCart } from "lucide-react";

export function PurchaseModeSwitch({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/purchase-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !on }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "تغییر وضعیت خرید ناموفق بود.");
      return;
    }
    setOn(!on);
    setMessage(
      !on
        ? "خرید آنلاین روشن شد: سبد، پرداخت، سفارش و تسویه فعال شدند."
        : "خرید آنلاین خاموش شد: فقط مشخصات سازنده و محصولات نمایش داده می‌شود.",
    );
    router.refresh();
  }

  return (
    <div className={`kid-card p-5 ${on ? "" : "border-amber-300 bg-amber-50/60"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${on ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {on ? <ShoppingCart size={22} /> : <ShoppingBag size={22} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-forest">خرید آنلاین پلتفرم</p>
          <p className="mt-0.5 text-[11px] leading-6 text-slate-600">
            با یک کلید، ماژول‌های <code>cart</code>، <code>checkout</code>، <code>orders</code> و <code>payouts</code> با هم
            خاموش/روشن می‌شوند. در حالت خاموش، صفحهٔ محصول فقط مشخصات و محصولات سازنده را نشان می‌دهد و قیمت‌ها «نمایشی» می‌مانند.
          </p>
          {message ? <p className="mt-1.5 text-[11px] font-bold text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-1.5 text-[11px] font-bold text-pink-600">{error}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={toggle}
            disabled={busy}
            className={`kid-btn !px-4 !py-2 text-xs ${on ? "kid-btn-ghost !border-pink-200 !text-pink-700" : "kid-btn-primary"} disabled:opacity-60`}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            {on ? "غیرفعال کردن خرید" : "فعال کردن خرید"}
          </button>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${on ? "bg-emerald-100 text-emerald-800" : "bg-amber-200 text-amber-900"}`}>
            {on ? "خرید فعال است" : "حالت نمایشی — فقط معرفی سازنده"}
          </span>
        </div>
      </div>
    </div>
  );
}
