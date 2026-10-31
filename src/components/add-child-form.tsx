"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Baby, Loader2, Plus, ShieldCheck } from "lucide-react";

export function AddChildForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setDone("");
    setLoading(true);
    const response = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate, bio }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "ساخت پروفایل فرزند ناموفق بود.");
      return;
    }
    setDone(`پروفایل «${name}» ساخته شد و رضایت والدین برایش ثبت است.`);
    setName("");
    setBirthDate("");
    setBio("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="kid-card mt-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Baby size={17} />
          </span>
          <div>
            <p className="text-[12px] font-black text-forest">فرزندت اینترنت ندارد؟ پروفایلش را خودت بساز</p>
            <p className="mt-0.5 max-w-xl text-[10px] leading-5 text-slate-500">
              بدون ایمیل، موبایل و رمز عبور برای کودک. همهٔ کارها — ثبت محصول، پاسخ به پیام و مدیریت — با حساب خودت
              انجام می‌شود و کودک هیچ‌وقت وارد سایت نمی‌شود.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setError("");
          }}
          className="kid-btn kid-btn-primary !py-2 text-[11px]"
        >
          <Plus size={14} /> {open ? "بستن فرم" : "افزودن فرزند تحت مدیریت من"}
        </button>
      </div>

      {done ? (
        <p className="mt-3 rounded-xl bg-emerald-50 p-2.5 text-[11px] font-bold text-emerald-800">✅ {done}</p>
      ) : null}

      {open ? (
        <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="kid-label">نام فرزند</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="kid-field !bg-white"
                placeholder="مثلاً نیکا احمدی"
                required
                minLength={2}
                maxLength={60}
              />
            </label>
            <label>
              <span className="kid-label">تاریخ تولد</span>
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="kid-field !bg-white"
                required
              />
            </label>
          </div>
          <label>
            <span className="kid-label">دربارهٔ فرزندم (اختیاری)</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={2}
              maxLength={300}
              className="kid-field resize-y !bg-white"
              placeholder="مثلاً دست‌سازها را دوست دارد؛ من به‌جای او پاسخ می‌دهم."
            />
          </label>
          <p className="flex items-center gap-1.5 text-[10px] leading-5 text-sky-900/80">
            <ShieldCheck size={12} className="text-sky-600" />
            اطلاعات شخصی کودک (ایمیل، موبایل، نشانی) نه گرفته می‌شود و نه نمایش داده می‌شود.
          </p>
          {error ? <p className="rounded-xl bg-pink-50 p-2.5 text-[11px] font-bold text-pink-700">{error}</p> : null}
          <button type="submit" disabled={loading} className="kid-btn kid-btn-primary text-xs disabled:opacity-60">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Baby size={14} />} ساخت پروفایل فرزند
          </button>
        </form>
      ) : null}
    </div>
  );
}
