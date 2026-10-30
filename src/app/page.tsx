import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  HeartHandshake,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { OwlLogo } from "@/components/owl-logo";
import { ModuleIcon } from "@/components/module-icon";
import { ProductCard } from "@/components/product-card";
import { Badge, CTAButton, SectionHeading, StatCard } from "@/components/ui";
import { MODULES, MODULE_GROUPS } from "@/lib/modules";
import { getGlobalSettings } from "@/lib/module-service";
import { getCategories, getLandingStats, listApprovedProducts } from "@/lib/products";
import { faNum } from "@/lib/format";

export const dynamic = "force-dynamic";

const HOW_STEPS = [
  {
    emoji: "🧑‍🎨",
    title: "بساز و معرفی کن",
    body: "در سه دستهٔ فیزیکی، خدماتی و مجازی محصولت را با عکس و توضیح ساده ثبت کن.",
    color: "bg-emerald-100",
  },
  {
    emoji: "🛡️",
    title: "تأیید والدین و ادمین",
    body: "برای زیر ۱۳ سال، رضایت والدین لازم است. بعد تیم ایمنی محتوا را بازبینی می‌کند.",
    color: "bg-amber-100",
  },
  {
    emoji: "🎉",
    title: "در ویترین بدرخش",
    body: "محصول تأییدشده در بازارچه منتشر می‌شود؛ بازدید بگیر و با خیال راحت بفروش.",
    color: "bg-pink-100",
  },
];

export default async function HomePage() {
  const [categories, products, stats, globalSettings] = await Promise.all([
    getCategories(),
    listApprovedProducts(),
    getLandingStats(),
    getGlobalSettings(),
  ]);
  const featured = products.slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden border-b-2 border-emerald-900/10">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-900/10 bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
              <Sparkles size={14} className="text-amber-500" />
              بازارچهٔ آنلاین ساخته‌های کودکان و نوجوانان
            </span>

            <h1 className="mt-5 text-4xl font-black leading-[1.25] tracking-tight text-forest sm:text-5xl lg:text-[3.4rem]">
              ساخته‌هایت را
              <span className="relative mx-2 inline-block text-emerald-600">
                بدرخشان
                <svg className="absolute -bottom-2 right-0 w-full" height="10" viewBox="0 0 180 10" fill="none" preserveAspectRatio="none">
                  <path d="M2 7c40-5 80-5 176-2" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
              کن!
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              جوانه‌بازار جایی است که بچه‌ها دست‌سازه‌ها، مهارت‌ها و خلاقیتشان را معرفی می‌کنند؛
              با تأیید والدین، بازبینی انسانی و فضایی امن برای اولین تجربهٔ فروش.
            </p>

            <form action="/explore" className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border-2 border-emerald-900/10 bg-white p-1.5 shadow-[0_6px_0_rgba(6,78,59,0.06)]">
              <span className="pr-2 text-emerald-700"><Search size={20} /></span>
              <input
                name="q"
                placeholder="دنبال چه چیزی می‌گردی؟ مثلاً دست‌بند بافتنی"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="kid-btn kid-btn-sun !rounded-xl !px-4 !py-2 text-sm">
                جست‌وجو
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CTAButton href="/explore" variant="primary">
                گشت در بازارچه <ArrowLeft size={16} />
              </CTAButton>
              <CTAButton href="/dashboard/products/new" variant="ghost">
                ثبت ساختهٔ من <PackageCheck size={16} />
              </CTAButton>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-emerald-900/70">
              <span className="flex items-center gap-1"><BadgeCheck size={14} className="text-emerald-600" /> تأیید والدین</span>
              <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> بازبینی انسانی</span>
              <span className="flex items-center gap-1"><HeartHandshake size={14} className="text-emerald-600" /> حریم خصوصی کودکان</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -right-6 -top-6 rotate-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 shadow-md">
              ✅ تأییدشده توسط ادمین
            </div>
            <div className="absolute -left-4 bottom-16 -rotate-6 rounded-2xl border-2 border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-md">
              👨‍👩‍👧 رضایت والدین
            </div>
            <div className="kid-card relative flex flex-col items-center gap-2 bg-gradient-to-b from-emerald-50 to-white p-8">
              <div className="absolute left-4 top-4 rounded-xl bg-white px-2 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">جغدِ کتاب‌خوان</div>
              <OwlLogo size={210} className="float-slow" />
              <p className="mt-1 text-center text-sm font-black text-forest">«هر ساخته‌ای یک داستان دارد»</p>
              <p className="text-center text-[11px] leading-5 text-slate-500">
                جغد کوچک جوانه‌بازار، راهنمای تو در دنیای ساخت‌وساز و فروش است.
              </p>
              <div className="mt-2 grid w-full grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl bg-white py-2 shadow-sm">
                  <p className="text-base font-black text-emerald-700">{faNum(stats.products)}</p>
                  <p className="text-[9px] text-slate-500">محصول</p>
                </div>
                <div className="rounded-xl bg-white py-2 shadow-sm">
                  <p className="text-base font-black text-emerald-700">{faNum(stats.sellers)}</p>
                  <p className="text-[9px] text-slate-500">سازنده</p>
                </div>
                <div className="rounded-xl bg-white py-2 shadow-sm">
                  <p className="text-base font-black text-emerald-700">۲۴h</p>
                  <p className="text-[9px] text-slate-500">زمان تأیید</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="محصولات تأییدشده" value={faNum(stats.products)} hint="همه با بازبینی انسانی" icon={<ShoppingBag size={16} />} />
          <StatCard label="سازندگان کوچک" value={faNum(stats.sellers)} hint="کودک و نوجوان" icon={<Users size={16} />} tone="sky" />
          <StatCard label="دسته‌بندی‌ها" value={faNum(stats.categories)} hint="از صنایع دستی تا دیجیتال" icon={<Sparkles size={16} />} tone="sun" />
          <StatCard label="میانگین زمان تأیید" value="< ۲۴ ساعت" hint="هدف تیم ایمنی" icon={<ShieldCheck size={16} />} tone="berry" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <SectionHeading
          eyebrow="دسته‌بندی‌ها"
          title="از کدام دنیا شروع می‌کنی؟"
          body="هر دسته یک دنیای رنگی از ساخته‌های بچه‌هاست. روی هر کارت بزن و بگرد."
          action={<Link href="/explore" className="flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-900">همهٔ محصولات <ChevronLeft size={14} /></Link>}
        />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/explore?category=${category.slug}`}
              className="kid-card kid-card-hover group flex flex-col items-center gap-2 p-4 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110" style={{ backgroundColor: category.tint }}>
                {category.emoji}
              </span>
              <span className="text-xs font-black text-forest">{category.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white/60 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow="تازه‌های بازارچه"
            title="ساخته‌های امروز بچه‌ها"
            body="محصولات تازه‌تأییدشده؛ هر کدام با داستانی پشت سرشان."
            action={<Link href="/explore?sort=newest" className="flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-900">دیدن همه <ChevronLeft size={14} /></Link>}
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeading
          center
          eyebrow="چطور کار می‌کند؟"
          title="سه قدم تا دیده‌شدن ساخته‌ات"
          body="فرایند ساده و کودک‌محور؛ هر مرحله کوتاه، تصویری و قابل فهم."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {HOW_STEPS.map((step, index) => (
            <div key={step.title} className="kid-card relative p-6">
              <span className="absolute -top-3 right-6 flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-black text-white">
                {faNum(index + 1)}
              </span>
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${step.color}`}>{step.emoji}</span>
              <h3 className="mt-4 text-base font-black text-forest">{step.title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="relative overflow-hidden border-y-2 border-emerald-900/10 bg-emerald-950 py-16 text-white">
        <div className="absolute inset-0 bg-squiggle opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-3 py-1 text-xs font-bold text-emerald-100">
                <Sparkles size={13} className="text-amber-300" /> معماری ماژولار
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">بازارچه، از قطعه‌های قابل روشن/خاموش</h2>
              <p className="mt-3 text-sm leading-7 text-emerald-100/80">
                هر قابلیت یک ماژول مستقل است. ادمین می‌تواند آن را برای کل پلتفرم خاموش کند و هر کاربر کلیدهای خودش را دارد.
                ماژول‌های هسته برای ایمنی کودکان همیشه روشن می‌مانند.
              </p>
            </div>
            <div className="flex gap-2">
              <CTAButton href="/register" variant="sun" className="text-sm">امتحان کن</CTAButton>
              <Link href="/#trust" className="rounded-2xl border-2 border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-900">
                قواعد ایمنی
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {MODULE_GROUPS.map((group) => {
              const items = MODULES.filter((module) => module.group === group.key);
              return (
                <div key={group.key} className="rounded-3xl border border-emerald-800 bg-emerald-900/50 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-black text-emerald-200">
                    <span>{group.emoji}</span> {group.title}
                    <span className="mr-auto rounded-full bg-emerald-800 px-2 py-0.5 text-[10px] text-emerald-200">{faNum(items.length)} ماژول</span>
                  </p>
                  <div className="space-y-2">
                    {items.map((module) => {
                      const on = module.locked || (globalSettings[module.key] ?? module.defaultEnabled);
                      return (
                        <div key={module.key} className="flex items-center gap-3 rounded-2xl bg-emerald-950/50 px-3 py-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-emerald-100">
                            <ModuleIcon name={module.icon} size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white">{module.title}</p>
                            <p className="truncate text-[10px] text-emerald-300/70">{module.short}</p>
                          </div>
                          {module.phase === 2 ? <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">فاز ۲</span> : null}
                          {module.locked ? <Badge className="!border-emerald-600 !bg-emerald-800 !text-emerald-100">هسته</Badge> : null}
                          <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-emerald-400" : "bg-slate-500"}`} title={on ? "روشن" : "خاموش"} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative">
          <div className="kid-card bg-emerald-50 p-6">
            <div className="flex items-center gap-3">
              <OwlLogo size={58} />
              <div>
                <p className="text-sm font-black text-forest">جغدِ نگهبان</p>
                <p className="text-[11px] text-emerald-700">ایمنی قبل از هر چیز</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { icon: <ShieldCheck size={15} />, title: "بازبینی انسانی هر محصول", body: "هیچ محصولی بدون تأیید ادمین منتشر نمی‌شود." },
                { icon: <HeartHandshake size={15} />, title: "رضایت والدین برای زیر ۱۳ سال", body: "ثبت‌نام و فروش فقط با تأیید والدین کامل می‌شود." },
                { icon: <PackageCheck size={15} />, title: "حداقل‌سازی داده", body: "فقط اطلاعات ضروری جمع‌آوری و دورهٔ نگهداری مشخص است." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl bg-white p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">{item.icon}</span>
                  <div>
                    <p className="text-xs font-black text-forest">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="حریم خصوصی کودکان"
            title="امنیت، نه یک قابلیت اضافه؛ پایهٔ بازارچه"
            body="طراحی ما بر اساس اصول COPPA و تجربهٔ کودک‌محور شکل گرفته است: بدون تبلیغات رفتاری، بدون الگوهای تاریک و با امکان مشاهده، حذف و لغو رضایت توسط والدین."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["درگاه سنی", "تشخیص خودکار زیر ۱۳ سال هنگام ثبت‌نام"],
              ["رضایت قابل‌راستی‌آزمایی", "تأیید والدین با ایمیل و پنل اختصاصی"],
              ["کنترل والدین", "مشاهدهٔ فعالیت، اشتراک و ماژول‌های فرزند"],
              ["حق حذف داده", "درخواست حذف حساب و داده‌های مرتبط"],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border-2 border-emerald-900/10 bg-white p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-black text-forest"><CheckCircle2 size={14} className="text-emerald-600" /> {title}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-emerald-900/10 bg-gradient-to-l from-amber-100 via-cream to-emerald-100 p-8 sm:p-10">
          <span className="absolute -left-8 -top-8 text-7xl opacity-20">🛒</span>
          <span className="absolute -bottom-6 right-1/4 text-6xl opacity-20">💳</span>
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <Badge tone="sun">فاز ۲ آماده است</Badge>
              <h2 className="mt-3 text-2xl font-black text-forest sm:text-3xl">از دیدن تا خرید، همه در یک بازارچه</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                سبد خرید، پرداخت با تأیید والدین، مدیریت سفارش و تسویهٔ فروشنده هم به همین معماری ماژولار اضافه شده‌اند.
                اگر بخواهی، ادمین می‌تواند هر کدام را جدا خاموش کند.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <CTAButton href="/cart" variant="primary"><ShoppingBag size={16} /> سبد خرید</CTAButton>
              <CTAButton href="/dashboard/subscription" variant="ghost"><Wallet size={16} /> پلن‌ها</CTAButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
