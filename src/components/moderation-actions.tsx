"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

export function ModerationActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function run(action: "approve" | "reject") {
    if (action === "reject" && reason.trim().length < 5) {
      setError("دلیل رد را بنویس (حداقل ۵ حرف).");
      return;
    }
    setBusy(action);
    setError("");
    const response = await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, action, reason }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setError(data.error ?? "عملیات ناموفق بود.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <div className="flex gap-1.5">
        <button type="button" onClick={() => run("approve")} disabled={busy !== null} className="kid-btn kid-btn-primary !px-3 !py-1.5 text-[11px] disabled:opacity-60">
          {busy === "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} تأیید
        </button>
        <button
          type="button"
          onClick={() => setRejecting((value) => !value)}
          disabled={busy !== null}
          className="kid-btn kid-btn-ghost !border-pink-200 !px-3 !py-1.5 text-[11px] !text-pink-700 disabled:opacity-60"
        >
          <X size={12} /> رد
        </button>
      </div>
      {rejecting ? (
        <div className="flex gap-1.5">
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="دلیل رد…" className="kid-field !py-1.5 !text-[11px]" />
          <button type="button" onClick={() => run("reject")} disabled={busy !== null} className="kid-btn kid-btn-primary !bg-pink-600 !shadow-none !px-3 !py-1.5 text-[11px]">
            {busy === "reject" ? <Loader2 size={12} className="animate-spin" /> : "ثبت"}
          </button>
        </div>
      ) : null}
      {error ? <p className="text-[10px] font-bold text-pink-600">{error}</p> : null}
    </div>
  );
}
