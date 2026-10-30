"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const STATUSES = [
  ["PAID", "پرداخت‌شده"],
  ["PREPARING", "در حال آماده‌سازی"],
  ["SHIPPED", "ارسال‌شده"],
  ["DELIVERED", "تحویل‌شده"],
] as const;

export function OrderStatusControl({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "تغییر وضعیت ناموفق بود.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select value={value} onChange={(event) => setValue(event.target.value)} className="kid-field !w-auto !py-1.5 !text-[11px]" aria-label="وضعیت سفارش">
        {STATUSES.map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <button type="button" onClick={update} disabled={busy || value === status} className="kid-btn kid-btn-ghost !px-2.5 !py-1.5 text-[11px] disabled:opacity-40">
        {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} به‌روزرسانی
      </button>
      {error ? <p className="text-[10px] font-bold text-pink-600">{error}</p> : null}
    </div>
  );
}
