"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldQuestion, XCircle } from "lucide-react";

type ApprovalState = "PENDING" | "APPROVED" | "DENIED";

export function ApprovalRequestButton({
  moduleKey,
  title,
  initialStatus = null,
  granted = false,
  compact = false,
}: {
  moduleKey: string;
  title: string;
  initialStatus?: ApprovalState | null;
  /** والدین از قبل این اجازه را روشن کرده‌اند. */
  granted?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ApprovalState | null>(granted ? "APPROVED" : initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function request() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/approval-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleKey }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "ثبت درخواست ناموفق بود.");
      return;
    }
    setStatus("APPROVED" === data.status ? "APPROVED" : "PENDING");
    router.refresh();
  }

  if (status === "APPROVED") {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/80 p-2 text-[10px] leading-5 font-bold text-emerald-800">
        <CheckCircle2 size={12} /> والدینت اجازهٔ «{title}» را داده‌اند.
      </p>
    );
  }

  if (status === "PENDING") {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 p-2 text-[10px] leading-5 text-amber-900">
        <Clock3 size={12} /> درخواستت ثبت شد و برای والدینت فرستادیم؛ به‌محض تأیید، «{title}» برایت روشن می‌شود.
      </p>
    );
  }

  return (
    <div className="mt-1.5 space-y-1">
      {status === "DENIED" ? (
        <p className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/70 p-2 text-[10px] leading-5 text-pink-800">
          <XCircle size={12} /> درخواست قبلی‌ات تأیید نشد. می‌توانی با والدینت صحبت کنی و دوباره درخواست بدهی.
        </p>
      ) : null}
      <button
        type="button"
        onClick={request}
        disabled={busy}
        className={`kid-btn kid-btn-ghost w-full ${compact ? "!py-1.5 text-[10px]" : "!py-2 text-[11px]"} disabled:opacity-60`}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <ShieldQuestion size={13} />}
        درخواست اجازه از والدین
      </button>
      {error ? <p className="text-[10px] font-bold text-pink-600">{error}</p> : null}
    </div>
  );
}
