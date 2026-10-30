import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { OwlLogo } from "@/components/owl-logo";

export const metadata = { title: "ورود" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : user.role === "PARENT" ? "/parent" : "/dashboard");

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-2 lg:items-center">
      <div className="kid-card overflow-hidden">
        <div className="border-b-2 border-emerald-900/10 bg-emerald-50/60 px-6 py-5">
          <h1 className="text-2xl font-black text-forest">خوش برگشتی! 👋</h1>
          <p className="mt-1 text-xs text-slate-500">وارد حساب جوانه‌بازار شو و کارت را ادامه بده.</p>
        </div>
        <div className="p-6">
          <AuthForm mode="login" />
        </div>
      </div>

      <div className="relative hidden overflow-hidden rounded-[2rem] border-2 border-emerald-900/10 bg-emerald-950 p-8 text-white lg:block">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="relative">
          <OwlLogo size={110} className="float-slow" />
          <h2 className="mt-4 text-2xl font-black leading-snug">جغدِ جوانه‌بازار همیشه بیدار است</h2>
          <p className="mt-2 text-sm leading-7 text-emerald-100/80">
            هر محصول قبل از انتشار بازبینی می‌شود و برای بچه‌های زیر ۱۳ سال، تأیید والدین شرط اصلی است.
          </p>
          <div className="mt-6 space-y-2 text-xs">
            {["بازبینی انسانی همهٔ محتوا", "پرداخت با تأیید والدین", "حریم خصوصی جدی برای کودکان"].map((item) => (
              <p key={item} className="flex items-center gap-2 rounded-xl bg-emerald-900/60 px-3 py-2 text-emerald-100">
                <ShieldCheck size={14} className="text-emerald-300" /> {item}
              </p>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-emerald-200/60">
            حساب نمایشی نمی‌داری؟{" "}
            <Link href="/register" className="font-black text-amber-300 hover:text-amber-200">همین حالا بساز</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
