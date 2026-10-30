import Link from "next/link";
import { Heart, Mail, MapPin, ShieldCheck } from "lucide-react";
import { OwlLogo } from "./owl-logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-emerald-900/10 bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <OwlLogo size={42} />
            <div>
              <p className="text-lg font-black text-forest">جوانه‌بازار</p>
              <p className="text-[11px] text-slate-500">بازارچهٔ ساخته‌های بچه‌ها</p>
            </div>
          </div>
          <p className="text-xs leading-6 text-slate-500">
            فضایی امن برای اینکه کودکان و نوجوانان ساخته‌هایشان را معرفی کنند؛ با تأیید والدین، بازبینی انسانی و حریم خصوصی جدی.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-black text-forest">دسترسی سریع</p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li><Link className="hover:text-emerald-700" href="/explore">گشت در بازارچه</Link></li>
            <li><Link className="hover:text-emerald-700" href="/dashboard/products/new">ثبت محصول</Link></li>
            <li><Link className="hover:text-emerald-700" href="/dashboard/subscription">پلن‌های اشتراک</Link></li>
            <li><Link className="hover:text-emerald-700" href="/parent">پنل والدین</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-black text-forest">ایمنی و اعتماد</p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> بازبینی انسانی همهٔ محصولات</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> رضایت والدین برای زیر ۱۳ سال</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> حداقل‌سازی داده و حق حذف</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> بدون تبلیغات هدفمند رفتاری</li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-black text-forest">ارتباط با ما</p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-1.5"><Mail size={13} /> hello@javaneh.ir</li>
            <li className="flex items-center gap-1.5"><MapPin size={13} /> تهران، خیابان جوانه</li>
          </ul>
          <p className="mt-4 rounded-xl bg-emerald-50 p-2.5 text-[11px] leading-5 text-emerald-800">
            این نسخهٔ نمایشی است؛ پرداخت‌ها شبیه‌سازی می‌شوند و هیچ دادهٔ واقعی پرداخت ذخیره نمی‌شود.
          </p>
        </div>
      </div>
      <div className="border-t border-emerald-900/10 py-3 text-center text-[11px] text-slate-500">
        ساخته‌شده با <Heart size={11} className="mx-0.5 inline text-pink-500" /> برای بچه‌های کنجکاو — © ۱۴۰۵ جوانه‌بازار
      </div>
    </footer>
  );
}
