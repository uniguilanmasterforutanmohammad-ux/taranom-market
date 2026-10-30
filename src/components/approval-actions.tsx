"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

export function ApprovalActions({ requestId, childName, moduleTitle }: { requestId: string; childName: string; moduleTitle: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"APPROVED" | "DENIED" | null>(null);

  async function respond(status: "APPROVED" | "DENIED") {
    setBusy(status === "APPROVED" ? "approve" : "deny");
    setError("");
    const response = await fetch(`/api/approval-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setError(data.error ?? "ثبت پاسخ ناموفق بود.");
      return;
    }
    setDone(status);
    router.refresh();
  }

  if (done) {
    return (
      <p className={`text-[10px] font-black ${done === "APPROVED" ? "text-emerald-700" : "text-pink-600"}`}>
        {done === "APPROVED" ? `«${moduleTitle}» برای ${childName} روشن شد.` : `درخواست رد شد و کلید خاموش ماند.`}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => respond("APPROVED")}
          disabled={busy !== null}
          className="kid-btn kid-btn-primary !px-3 !py-1.5 text-[10px] disabled:opacity-60"
        >
          {busy === "approve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} تأیید
        </button>
        <button
          type="button"
          onClick={() => respond("DENIED")}
          disabled={busy !== null}
          className="kid-btn kid-btn-ghost !px-3 !py-1.5 text-[10px] disabled:opacity-60"
        >
          {busy === "deny" ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} رد
        </button>
      </div>
      {error ? <span className="max-w-40 text-left text-[9px] font-bold text-pink-600">{error}</span> : null}
    </div>
  );
}
