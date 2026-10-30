import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, Star } from "lucide-react";
import { getSellerProfile } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { isModuleEnabled } from "@/lib/module-service";
import { guardiansOf, isMinor, maskEmail, sellerContactInfo } from "@/lib/contact";
import { PLANS } from "@/lib/modules";
import { PRODUCT_TYPE_LABEL, faDateLabel, faNum } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { Avatar, Badge, EmptyState, StatCard } from "@/components/ui";
import { ContactSeller } from "@/components/contact-seller";

export const dynamic = "force-dynamic";

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSellerProfile(id);
  if (!data || data.seller.plan === undefined) notFound();
  const { seller, products, rating, reviewCount } = data;

  const [viewer, contactOn, sellerInfo] = await Promise.all([
    getCurrentUser(),
    isModuleEnabled("sellerContact", null),
    sellerContactInfo(seller.id),
  ]);
  const viewerIsMinor = Boolean(viewer && isMinor(viewer.birthDate));
  const viewerGuardians = viewer && viewerIsMinor ? await guardiansOf(viewer.id) : [];

  const types = new Set(products.map((product) => PRODUCT_TYPE_LABEL[product.type]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/explore" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900">
        <ArrowRight size={13} /> بازگشت به بازارچه
      </Link>

      <div className="relative overflow-hidden rounded-[2rem] border-2 border-emerald-900/10 bg-gradient-to-l from-emerald-100 via-cream to-amber-50 p-6">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar name={seller.name} color={seller.avatarColor} size={76} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-forest">{seller.name}</h1>
              <Badge tone={seller.plan === "PRO" ? "clay" : seller.plan === "STARTER" ? "sun" : "mint"}>
                {PLANS[seller.plan].emoji} سازندهٔ {PLANS[seller.plan].title}
              </Badge>
              <Badge tone="sky"><ShieldCheck size={11} /> پروفایل تأییدشده</Badge>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-7 text-slate-600">
              {seller.bio || "این سازنده هنوز توضیحی دربارهٔ خودش ننوشته است."}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">عضو بازارچه از {faDateLabel(seller.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="ساخته‌های منتشرشده" value={faNum(products.length)} hint="همه با تأیید ادمین" />
        <StatCard
          label="میانگین امتیاز"
          value={rating > 0 ? `${faNum(rating)} از ۵` : "بدون امتیاز"}
          hint={`${faNum(reviewCount)} نظر تأییدشده`}
          tone="sun"
          icon={<Star size={15} />}
        />
        <StatCard label="تنوع ساخته‌ها" value={faNum(types.size)} hint="فیزیکی، خدماتی یا مجازی" tone="sky" icon={<Sparkles size={15} />} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-base font-black text-forest">ساخته‌های این سازنده</h2>
        <span className="text-[11px] text-slate-400">{faNum(products.length)} محصول تأییدشده</span>
      </div>

      {products.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            emoji="🎨"
            title="هنوز ساخته‌ای منتشر نشده"
            body="اگر محصول این سازنده در صف بازبینی باشد، به‌زودی اینجا نمایش داده می‌شود."
            action={<Link href="/explore" className="kid-btn kid-btn-primary text-xs">دیدن بازارچه</Link>}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <p className="mt-6 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-[11px] leading-6 text-emerald-900">
        برای حفظ حریم خصوصی کودکان، اطلاعات تماس شخصی سازندگان (ایمیل، تلفن و نشانی) در پروفایل عمومی نمایش داده نمی‌شود.
        هر پیام یا هماهنگی از مسیر خود بازارچه و با نظارت والدین انجام می‌شود.
      </p>

      {contactOn ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="kid-card p-5">
            <p className="text-sm font-black text-forest">راه‌های ارتباط با سازنده</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-6 text-slate-600">
              <li>💬 پیام درون بازارچه: فروشنده در پنل خود پیام را می‌بیند و پاسخ می‌دهد.</li>
              <li>📞 درخواست تماس تلفنی: شمارهٔ تماس ردوبدل نمی‌شود؛ والدین هماهنگی را انجام می‌دهند.</li>
              <li>📧 درخواست هماهنگی ایمیلی برای خرید یا سفارش ویژه.</li>
              {sellerInfo?.minor ? (
                <li>
                  🛡️ والدین سازنده ({sellerInfo.guardians.map((guardian) => maskEmail(guardian.email)).join("، ") || "در حال تکمیل"}) هم از پیام‌ها باخبر می‌شوند.
                </li>
              ) : null}
            </ul>
          </div>
          <ContactSeller
            sellerId={seller.id}
            sellerName={seller.name}
            signedIn={Boolean(viewer)}
            senderIsMinor={viewerIsMinor}
            senderGuardians={viewerGuardians.map((guardian) => ({ name: guardian.name, email: guardian.email, phone: guardian.phone }))}
            sellerIsMinor={Boolean(sellerInfo?.minor)}
            sellerGuardianEmails={(sellerInfo?.guardians ?? []).map((guardian) => maskEmail(guardian.email))}
          />
        </div>
      ) : null}
    </div>
  );
}
