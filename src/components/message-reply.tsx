"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Lock, Reply, Send, ShieldCheck } from "lucide-react";

export function MessageReply({
  messageId,
  counterpartName,
  allowed,
  lockedHint,
  showContactFields = false,
  label = "پاسخ",
}: {
  messageId: string;
  counterpartName: string;
  allowed: boolean;
  lockedHint: string;
  showContactFields?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!allowed) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-2.5">
        <p className="flex items-center gap-1.5 text-[10px] leading-5 text-sky-900">
          <Lock size={11} /> {lockedHint}
        </p>
        <Link href="/dashboard/messages#permissions" className="text-[10px] font-black text-sky-800 underline">
          درخواست اجازه از والدین
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim().length < 2) {
      setState("error");
      setMessage("متن پاسخ را بنویس.");
      return;
    }
    setState("loading");
    setMessage("");
    const response = await fetch("/api/messages/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, body: text, contactEmail, contactPhone }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "ارسال پاسخ ناموفق بود.");
      return;
    }
    setState("done");
    setText("");
    router.refresh();
  }

  if (state === "done") {
    return (
      <div className="mt-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-2.5">
        <p className="flex items-center gap-1.5 text-[11px] font-black text-emerald-900">
          <CheckCircle2 size={13} /> پاسخت برای {counterpartName} ثبت شد
        </p>
        <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800">
          <ShieldCheck size={11} /> نسخهٔ گفت‌وگو برای والدین هم ثبت می‌شود.
        </p>
        <button type="button" onClick={() => setState("idle")} className="kid-btn kid-btn-ghost mt-2 w-full !py-1.5 text-[10px]">
          پاسخ دیگر
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="kid-btn kid-btn-ghost mt-2 w-full !py-2 text-[11px]">
        <Reply size={13} /> {label}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2 rounded-xl border-2 border-emerald-200 bg-white p-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800">
        <Reply size={12} /> پاسخ به {counterpartName}
      </p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        autoFocus
        className="kid-field resize-y text-[11px]"
        placeholder="پاسخ خودت را بنویس…"
      />
      {showContactFields ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="email"
            dir="ltr"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className="kid-field !py-1.5 text-left text-[11px]"
            placeholder="ایمیل برای هماهنگی (اختیاری)"
          />
          <input
            dir="ltr"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            className="kid-field !py-1.5 text-left text-[11px]"
            placeholder="موبایل برای هماهنگی (اختیاری)"
          />
        </div>
      ) : null}
      {message ? (
        <p className={`text-[10px] font-bold ${state === "error" ? "text-pink-600" : "text-emerald-700"}`}>{message}</p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={state === "loading"} className="kid-btn kid-btn-primary flex-1 !py-2 text-[11px] disabled:opacity-60">
          {state === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} ارسال پاسخ
        </button>
        <button type="button" onClick={() => setOpen(false)} className="kid-btn kid-btn-ghost !px-3 !py-2 text-[11px]">
          بستن
        </button>
      </div>
    </form>
  );
}
