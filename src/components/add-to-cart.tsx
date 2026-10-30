"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShoppingBag, Check } from "lucide-react";

export function AddToCart({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (disabled) {
    return (
      <a href="/login" className="kid-btn kid-btn-primary w-full text-sm">
        <ShoppingBag size={16} /> برای خرید وارد شو
      </a>
    );
  }

  async function add() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "افزودن به سبد ناموفق بود.");
      return;
    }
    setState("done");
    setMessage("به سبد خرید اضافه شد ✅");
    router.refresh();
  }

  return (
    <div>
      <button type="button" onClick={add} disabled={state === "loading"} className="kid-btn kid-btn-primary w-full text-sm disabled:opacity-60">
        {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : state === "done" ? <Check size={16} /> : <ShoppingBag size={16} />}
        {state === "done" ? "به سبد اضافه شد" : "افزودن به سبد"}
      </button>
      {message ? (
        <p className={`mt-1.5 text-center text-[11px] font-bold ${state === "error" ? "text-pink-600" : "text-emerald-700"}`}>{message}</p>
      ) : null}
    </div>
  );
}
