"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ModuleToggle({
  moduleKey,
  enabled,
  scope,
  userId,
  disabled = false,
}: {
  moduleKey: string;
  enabled: boolean;
  scope: "global" | "user";
  userId?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (disabled || busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/modules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, moduleKey, enabled: !on, userId }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "تغییر وضعیت ناموفق بود.");
      return;
    }
    setOn(!on);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={on ? "خاموش کردن ماژول" : "روشن کردن ماژول"}
        onClick={toggle}
        disabled={disabled || busy}
        className={`relative h-6 w-11 shrink-0 rounded-full border-2 transition ${
          on ? "border-emerald-700 bg-emerald-600" : "border-slate-300 bg-slate-200"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            on ? "right-0.5" : "right-[1.35rem]"
          }`}
        />
        {busy ? <Loader2 size={10} className="absolute inset-0 m-auto animate-spin text-white" /> : null}
      </button>
      {error ? <span className="max-w-36 text-left text-[9px] font-bold text-pink-600">{error}</span> : null}
    </div>
  );
}
