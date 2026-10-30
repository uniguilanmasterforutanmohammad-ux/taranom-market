"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { ageFrom } from "@/lib/age";

const DEMO = [
  { label: "ادمین", email: "admin@javaneh.ir", password: "Admin@1405", color: "bg-orange-100 text-orange-800" },
  { label: "والدین", email: "mahsa@example.com", password: "Parent@1405", color: "bg-sky-100 text-sky-800" },
  { label: "فروشنده", email: "sara@example.com", password: "Child@1405", color: "bg-emerald-100 text-emerald-800" },
];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [role, setRole] = useState<"CHILD" | "PARENT">("CHILD");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isMinor = useMemo(() => {
    if (mode !== "register" || role !== "CHILD" || !birthDate) return false;
    return ageFrom(birthDate) < 13;
  }, [birthDate, mode, role]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "login"
          ? { email, password }
          : { name, email, password, role, birthDate, parentName, parentEmail, parentPhone },
      ),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "مشکلی پیش آمد. دوباره تلاش کن.");
      return;
    }
    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  function fillDemo(demo: (typeof DEMO)[number]) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError("");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "register" ? (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-emerald-50 p-1">
            <button
              type="button"
              onClick={() => setRole("CHILD")}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${role === "CHILD" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-700/60"}`}
            >
              🧒 کودک / نوجوان
            </button>
            <button
              type="button"
              onClick={() => setRole("PARENT")}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${role === "PARENT" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-700/60"}`}
            >
              👨‍👩‍👧 والدین
            </button>
          </div>
          <label>
            <span className="kid-label">نام و نام خانوادگی</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="kid-field" placeholder="مثلاً سارا رضایی" required />
          </label>
        </>
      ) : null}

      <label>
        <span className="kid-label">ایمیل</span>
        <input
          type="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="kid-field text-left"
          placeholder="you@example.com"
          required
        />
      </label>

      <label>
        <span className="kid-label">رمز عبور</span>
        <span className="relative block">
          <input
            type={showPassword ? "text" : "password"}
            dir="ltr"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="kid-field pl-10 text-left"
            placeholder="حداقل ۸ کاراکتر"
            required
            minLength={mode === "register" ? 8 : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="نمایش رمز"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      </label>

      {mode === "register" && role === "CHILD" ? (
        <>
          <label>
            <span className="kid-label">تاریخ تولد</span>
            <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="kid-field" required />
          </label>
          {isMinor ? (
            <div className="space-y-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
              <p className="text-[11px] font-black text-amber-900">🔒 چون زیر ۱۳ سال هستی، تأیید والدین لازم است.</p>
              <input value={parentName} onChange={(event) => setParentName(event.target.value)} className="kid-field !bg-white" placeholder="نام والد یا سرپرست" required />
              <input
                type="email"
                dir="ltr"
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
                className="kid-field !bg-white text-left"
                placeholder="parent@example.com"
                required
              />
              <input
                dir="ltr"
                value={parentPhone}
                onChange={(event) => setParentPhone(event.target.value)}
                className="kid-field !bg-white text-left"
                placeholder="موبایل والدین — ۰۹۱۲… (اختیاری)"
              />
              <p className="text-[10px] leading-4 text-amber-800/80">
                حساب فعال می‌شود، اما تا تأیید والدین امکان ثبت محصول نداری. اگر والدین حساب دارند، با همان ایمیل وارد شوند.
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      {error ? <p className="rounded-xl bg-pink-50 p-2.5 text-xs font-bold text-pink-700">{error}</p> : null}

      <button type="submit" disabled={loading} className="kid-btn kid-btn-primary w-full text-sm disabled:opacity-60">
        {loading ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
        {mode === "login" ? "ورود به بازارچه" : "ساخت حساب"}
      </button>

      {mode === "login" ? (
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 p-3">
          <p className="text-[11px] font-black text-forest">ورود سریع نمایشی</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {DEMO.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo)}
                className={`rounded-xl px-2 py-1.5 text-[10px] font-black transition hover:brightness-95 ${demo.color}`}
              >
                {demo.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-400">روی دکمه بزن تا ایمیل و رمز پر شود؛ سپس «ورود» را بزن.</p>
        </div>
      ) : null}

      <p className="text-center text-[11px] text-slate-500">
        {mode === "login" ? "حساب نداری؟" : "قبلاً ثبت‌نام کرده‌ای؟"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-black text-emerald-700 hover:text-emerald-900">
          {mode === "login" ? "عضو شو" : "وارد شو"}
        </Link>
      </p>
    </form>
  );
}
