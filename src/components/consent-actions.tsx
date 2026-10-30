"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, ShieldOff } from "lucide-react";

export function ConsentActions({ childId, status }: { childId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "revoke" | null>(null);
  const [error, setError] = useState("");

  async function run(action: "approve" | "revoke") {
    if (action === "revoke" && !window.confirm("با لغو رضایت، همهٔ محصولات این کودک از ویترین برداشته می‌شوند. مطمئنی؟")) return;
    setBusy(action);
    setError("");
    const response = await fetch("/api/consent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, action }),
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
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {status !== "APPROVED" ? (
          <button type="button" onClick={() => run("approve")} disabled={busy !== null} className="kid-btn kid-btn-primary !px-3 !py-1.5 text-[11px] disabled:opacity-60">
            {busy === "approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} تأیید رضایت
          </button>
        ) : (
          <button type="button" onClick={() => run("revoke")} disabled={busy !== null} className="kid-btn kid-btn-ghost !border-pink-200 !px-3 !py-1.5 text-[11px] !text-pink-700 disabled:opacity-60">
            {busy === "revoke" ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />} لغو رضایت
          </button>
        )}
      </div>
      {error ? <p className="text-[10px] font-bold text-pink-600">{error}</p> : null}
    </div>
  );
}
