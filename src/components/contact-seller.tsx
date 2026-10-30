"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Phone, Mail, Send, ShieldCheck } from "lucide-react";

const CHANNELS = [
  { key: "IN_APP", label: "پیام درون بازارچه", icon: MessageCircle, hint: "سریع‌ترین راه؛ فروشنده در پنل پیام می‌بیند" },
  { key: "CALLBACK", label: "درخواست تماس تلفنی", icon: Phone, hint: "فروشنده یا والدینش با تو هماهنگ می‌کنند" },
  { key: "EMAIL", label: "درخواست هماهنگی ایمیلی", icon: Mail, hint: "برای هماهنگی خرید یا سفارش ویژه" },
] as const;

type Guardian = { name: string; email: string; phone?: string | null };

export function ContactSeller({
  sellerId,
  sellerName,
  productId,
  productTitle,
  senderIsMinor,
  senderGuardians,
  sellerIsMinor,
  sellerGuardianEmails,
  signedIn,
}: {
  sellerId: string;
  sellerName: string;
  productId?: string;
  productTitle?: string;
  senderIsMinor: boolean;
  senderGuardians: Guardian[];
  sellerIsMinor: boolean;
  sellerGuardianEmails: string[];
  signedIn: boolean;
}) {
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["key"]>("IN_APP");
  const [text, setText] = useState(
    productTitle ? `سلام ${sellerName}! دربارهٔ «${productTitle}» چند سؤال داشتم. ` : `سلام ${sellerName}! `,
  );
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    copies: { masked: string }[];
    sellerParentsInformed: boolean;
    contact: { email: string | null; phone: string | null };
  } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!signedIn) return;
    if (text.trim().length < 5) {
      setState("error");
      setMessage("متن پیام را کامل‌تر بنویس.");
      return;
    }
    setState("loading");
    setMessage("");
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId,
        productId,
        body: text,
        channel,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "ارسال پیام ناموفق بود.");
      return;
    }
    setState("done");
    setResult({
      copies: data.copies ?? [],
      sellerParentsInformed: Boolean(data.sellerParentsInformed),
      contact: data.contact ?? { email: null, phone: null },
    });
  }

  if (!signedIn) {
    return (
      <div className="kid-card p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-black text-slate-500"><MessageCircle size={13} /> ارتباط با سازنده</p>
        <p className="mt-2 text-[11px] leading-6 text-slate-600">
          برای ارسال پیام به {sellerName} اول وارد حساب خودت شو. ما پیام‌ها را پیگیری می‌کنیم تا ارتباط کودکان امن بماند.
        </p>
        <Link href="/login" className="kid-btn kid-btn-primary mt-3 w-full text-xs">ورود و ارسال پیام</Link>
      </div>
    );
  }

  if (state === "done" && result) {
    return (
      <div className="kid-card border-emerald-300 bg-emerald-50 p-5">
        <p className="flex items-center gap-1.5 text-sm font-black text-emerald-900">
          <CheckCircle2 size={16} /> پیامت به {sellerName} رسید
        </p>
        <div className="mt-2 space-y-1.5 text-[11px] leading-6 text-emerald-900/90">
          {result.copies.length > 0 ? (
            <p>
              <ShieldCheck size={12} className="ml-1 inline text-emerald-700" />
              نسخهٔ پیام برای والدین ({result.copies.map((copy) => copy.masked).join("، ")}) ارسال شد.
            </p>
          ) : null}
          {result.contact.email || result.contact.phone ? (
            <p>
              راه تماس ثبت‌شده برای هماهنگی:
              {result.contact.email ? <span dir="ltr" className="mr-1 font-bold">{result.contact.email}</span> : null}
              {result.contact.phone ? <span dir="ltr" className="mr-1 font-bold">{result.contact.phone}</span> : null}
            </p>
          ) : null}
          {result.sellerParentsInformed ? <p>والدین سازنده هم در جریان این پیام قرار گرفتند.</p> : null}
          <p className="text-emerald-700/80">پاسخ سازنده در «پنل من ← پیام‌ها» و اعلان‌ها نمایش داده می‌شود.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setResult(null);
          }}
          className="kid-btn kid-btn-ghost mt-3 w-full text-[11px]"
        >
          ارسال پیام دیگر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="kid-card p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-black text-slate-500"><MessageCircle size={13} /> ارتباط با سازنده</p>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">پیام امن</span>
      </div>

      <div className="mt-3 space-y-1.5">
        {CHANNELS.map((item) => {
          const Icon = item.icon;
          const active = channel === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setChannel(item.key)}
              className={`flex w-full items-start gap-2 rounded-xl border-2 p-2.5 text-right transition ${
                active ? "border-emerald-500 bg-emerald-50" : "border-emerald-900/10 bg-white hover:bg-emerald-50/50"
              }`}
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                <Icon size={14} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-black text-forest">{item.label}</span>
                <span className="block text-[10px] leading-5 text-slate-500">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {sellerIsMinor ? (
        <p className="mt-3 rounded-xl bg-sky-50 p-2.5 text-[10px] leading-5 text-sky-900">
          این سازنده زیر ۱۸ سال است؛ والدین او در جریان پیام‌ها قرار می‌گیرند
          {sellerGuardianEmails.length ? ` (${sellerGuardianEmails.join("، ")})` : ""}. اطلاعات تماس شخصی او نمایش داده نمی‌شود.
        </p>
      ) : null}

      {senderIsMinor ? (
        <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-2.5">
          <p className="text-[10px] font-black text-amber-900">چون زیر ۱۳ سال هستی، یک نسخه از پیام برای والدینت هم ارسال می‌شود.</p>
          <p className="mt-1 text-[10px] leading-5 text-amber-800">
            راه ارتباطی والدین تو (همین اطلاعات برای هماهنگی به سازنده هم داده می‌شود):
            {senderGuardians.length ? (
              <span className="mr-1 font-bold">
                {senderGuardians
                  .map((guardian) => `${guardian.name} (${[guardian.email, guardian.phone].filter(Boolean).join(" · ")})`)
                  .join(" | ")}
              </span>
            ) : (
              <span className="mr-1 font-bold">هنوز والدین به حسابت وصل نشده‌اند؛ در پنل خود این را کامل کن.</span>
            )}
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="kid-label">ایمیل برای هماهنگی</span>
            <input
              type="email"
              dir="ltr"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className="kid-field !py-2 text-left text-xs"
              placeholder="you@example.com (اختیاری)"
            />
          </label>
          <label className="block">
            <span className="kid-label">موبایل برای هماهنگی</span>
            <input
              dir="ltr"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              className="kid-field !py-2 text-left text-xs"
              placeholder="۰۹۱۲… (اختیاری)"
            />
          </label>
          <p className="text-[10px] leading-5 text-slate-400 sm:col-span-2">
            اگر خالی بگذاری، ایمیل حساب خودت به‌عنوان راه تماس ثبت می‌شود. این اطلاعات برای والدین هم ثبت می‌شود.
          </p>
        </div>
      )}

      <label className="mt-3 block">
        <span className="kid-label">متن پیام</span>
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} className="kid-field resize-y text-xs" required />
      </label>

      {message ? (
        <p className={`mt-2 text-[11px] font-bold ${state === "error" ? "text-pink-600" : "text-emerald-700"}`}>{message}</p>
      ) : null}

      <button type="submit" disabled={state === "loading"} className="kid-btn kid-btn-primary mt-3 w-full text-xs disabled:opacity-60">
        {state === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} ارسال پیام به {sellerName}
      </button>
      <p className="mt-2 text-center text-[10px] text-slate-400">پیام‌ها در بازارچه ثبت و برای ایمنی کودکان پایش می‌شوند.</p>
    </form>
  );
}
