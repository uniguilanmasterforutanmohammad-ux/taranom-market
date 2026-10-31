import { redirect } from "next/navigation";
import { CheckCircle2, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { OwlLogo } from "@/components/owl-logo";

export const metadata = { title: "عضویت" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : user.role === "PARENT" ? "/parent" : "/dashboard");

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1fr_0.85fr] lg:items-start">
      <div className="kid-card overflow-hidden">
        <div className="border-b-2 border-emerald-900/10 bg-emerald-50/60 px-6 py-5">
          <h1 className="text-2xl font-black text-forest">به بازارچه خوش آمدی 🌱</h1>
          <p className="mt-1 text-xs text-slate-500">در چند ثانیه عضو شو؛ اگر زیر ۱۳ سالی، تأیید والدین هماهنگ می‌شود.</p>
        </div>
        <div className="p-6">
          <AuthForm mode="register" />
        </div>
      </div>

      <div className="space-y-3 lg:sticky lg:top-28">
        <div className="kid-card bg-gradient-to-b from-emerald-50 to-white p-6 text-center">
          <OwlLogo size={100} className="mx-auto" />
          <p className="mt-2 text-sm font-black text-forest">«اول ایمنی، بعد فروش»</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">شعار جغد کوچک بازارچه</p>
        </div>
        <div className="kid-card space-y-2 p-4">
          {[
            { icon: <HeartHandshake size={15} />, text: "برای زیر ۱۳ سال، تأیید والدین با موبایل (ایمیل اختیاری)" },
            { icon: <Sparkles size={15} />, text: "محصول کودک زیر ۱۳ سال اول تأیید والدین، بعد بازبینی ادمین" },
            { icon: <ShieldCheck size={15} />, text: "بازبینی انسانی هر محصول پیش از انتشار" },
            { icon: <CheckCircle2 size={15} />, text: "کنترل کامل والدین روی ماژول‌های فرزند" },
            { icon: <Sparkles size={15} />, text: "پلن رایگان برای شروع؛ ارتقا هر زمان" },
          ].map((item) => (
            <p key={item.text} className="flex items-center gap-2 rounded-xl bg-emerald-50/60 px-3 py-2 text-[11px] font-bold text-emerald-900">
              <span className="text-emerald-600">{item.icon}</span> {item.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
