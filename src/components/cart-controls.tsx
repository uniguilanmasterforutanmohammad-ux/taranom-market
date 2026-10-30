"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

export function CartControls({ itemId, quantity }: { itemId: string; quantity: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(nextQuantity: number) {
    setBusy(true);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: nextQuantity }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => update(quantity + 1)} disabled={busy || quantity >= 20} className="rounded-lg border-2 border-emerald-900/10 bg-white p-1 disabled:opacity-40" aria-label="افزودن">
        <Plus size={13} />
      </button>
      <span className="w-6 text-center text-xs font-black text-forest">{busy ? <Loader2 size={12} className="mx-auto animate-spin" /> : quantity}</span>
      <button type="button" onClick={() => (quantity <= 1 ? remove() : update(quantity - 1))} disabled={busy} className="rounded-lg border-2 border-emerald-900/10 bg-white p-1 disabled:opacity-40" aria-label="کاهش">
        <Minus size={13} />
      </button>
      <button type="button" onClick={remove} disabled={busy} className="mr-1 rounded-lg border-2 border-pink-100 bg-pink-50 p-1 text-pink-600 disabled:opacity-40" aria-label="حذف">
        <Trash2 size={13} />
      </button>
    </div>
  );
}
