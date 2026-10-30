import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MessageCircle, Package, ShieldCheck, Star, Store, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isModuleEnabled } from "@/lib/module-service";
import { getProductDetail } from "@/lib/products";
import { PRODUCT_STATUS_LABEL, PRODUCT_TYPE_LABEL, faDateLabel, faNum, toman } from "@/lib/format";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { AddToCart } from "@/components/add-to-cart";
import { ReviewForm } from "@/components/review-form";
import { ContactSeller } from "@/components/contact-seller";
import { guardiansOf, isMinor, maskEmail, sellerContactInfo } from "@/lib/contact";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, user] = await Promise.all([getProductDetail(id), getCurrentUser()]);
  if (!product) notFound();

  const isOwner = user?.id === product.sellerId;
  const isAdmin = user?.role === "ADMIN";
  if (product.status !== "APPROVED" && !isOwner && !isAdmin) notFound();

  const [cartOn, checkoutOn, reviewsOn, contactOn] = await Promise.all([
    isModuleEnabled("cart", user),
    isModuleEnabled("checkout", user),
    isModuleEnabled("reviews", user),
    isModuleEnabled("sellerContact", user),
  ]);
  const purchaseOn = cartOn && checkoutOn;
  const [sellerInfo, senderGuardians] = await Promise.all([
    sellerContactInfo(product.sellerId),
    user && isMinor(user.birthDate) ? guardiansOf(user.id) : Promise.resolve([]),
  ]);

  if (product.status === "APPROVED") {
    await db.product.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
        <Link href="/" className="hover:text-emerald-700">خانه</Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-emerald-700">بازارچه</Link>
        <span>/</span>
        <Link href={`/explore?category=${product.category.slug}`} className="hover:text-emerald-700">{product.category.title}</Link>
        <span>/</span>
        <span className="line-clamp-1 text-emerald-800">{product.title}</span>
      </nav>

      {product.status !== "APPROVED" ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900">
          <Package size={15} />
          این محصول در وضعیت «{PRODUCT_STATUS_LABEL[product.status]}» است و فقط برای شما و ادمین قابل مشاهده است.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="kid-card relative flex h-72 items-center justify-center overflow-hidden sm:h-96" style={{ backgroundColor: product.category.tint }}>
            <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40" />
            <span className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-white/30" />
            <span className="absolute left-5 top-5 rotate-[-6deg] rounded-2xl bg-white/90 px-3 py-1.5 text-[11px] font-black text-emerald-800 shadow-sm">
              {product.category.emoji} {product.category.title}
            </span>
            <span className="text-[8rem] drop-shadow-sm sm:text-[10rem]">{product.category.emoji}</span>
            <span className="absolute bottom-4 right-4 rounded-2xl bg-white/95 px-4 py-2 text-sm font-black text-forest shadow-sm">
              {toman(product.price)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone="sky">{PRODUCT_TYPE_LABEL[product.type]}</Badge>
            {product.featured ? <Badge tone="sun">⭐ پیشنهاد ویژه</Badge> : null}
            <Badge tone="mint"><ShieldCheck size={11} /> تأییدشده</Badge>
            <span className="text-[11px] text-slate-400">ثبت: {faDateLabel(product.createdAt)}</span>
          </div>

          <h1 className="mt-3 text-3xl font-black leading-snug text-forest">{product.title}</h1>

          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            {product.rating > 0 ? (
              <span className="flex items-center gap-1 font-bold text-amber-600">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {faNum(product.rating)} از ۵
                <span className="font-normal text-slate-400">({faNum(product._count.reviews)} نظر)</span>
              </span>
            ) : (
              <span>هنوز نظری ثبت نشده</span>
            )}
            <span className="text-slate-300">|</span>
            <span>{faNum(product.views)} بازدید</span>
          </div>

          <div className="mt-5 rounded-3xl border-2 border-emerald-900/10 bg-white p-5">
            <h2 className="text-sm font-black text-forest">دربارهٔ این محصول</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-8 text-slate-600">{product.description}</p>
            {product.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Link key={tag} href={`/explore?q=${encodeURIComponent(tag)}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100">
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-3xl border-2 border-emerald-900/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-black text-forest"><MessageCircle size={16} /> نظرهای خریداران</h2>
              <span className="text-[11px] text-slate-400">پس از تأیید منتشر می‌شوند</span>
            </div>

            {reviewsOn && user && !isOwner && product.status === "APPROVED" ? (
              <div className="mt-3">
                <ReviewForm productId={product.id} />
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {product.reviews.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">اولین نفری باش که نظر می‌دهد.</p>
              ) : (
                product.reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-emerald-900/5 bg-emerald-50/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Avatar name={review.author.name} color={review.author.avatarColor} size={26} />
                        <span className="text-xs font-black text-forest">{review.author.name}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} size={11} className={index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-6 text-slate-600">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="kid-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500">قیمت نمایشی</p>
              {product.type === "DIGITAL" ? <Badge tone="mint">دانلود فوری</Badge> : null}
            </div>
            <p className="mt-1 text-2xl font-black text-forest">{toman(product.price)}</p>
            <p className="mt-1 text-[11px] text-slate-400">
              {product.type === "SERVICE" ? "زمان انجام با هماهنگی فروشنده" : product.type === "DIGITAL" ? "لینک دانلود پس از پرداخت" : "ارسال پس از تأیید سفارش"}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {cartOn ? (
                <AddToCart productId={product.id} disabled={!user} />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-3 text-center">
                  <p className="text-[11px] font-black text-amber-900">خرید آنلاین موقتاً غیرفعال است</p>
                  <p className="mt-1 text-[10px] leading-5 text-amber-800">
                    فعلاً می‌توانی مشخصات سازنده و بقیهٔ ساخته‌هایش را ببینی. به‌زودی خرید آنلاین دوباره فعال می‌شود.
                  </p>
                </div>
              )}
              <Link href={`/explore?category=${product.category.slug}`} className="kid-btn kid-btn-ghost w-full text-sm">
                <Store size={16} /> محصولات مشابه
              </Link>
            </div>

            <div className="mt-4 space-y-2 border-t border-dashed border-emerald-900/10 pt-3 text-[11px] text-slate-500">
              <p className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> بازبینی انسانی محتوا</p>
              {purchaseOn ? (
                <>
                  <p className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> پرداخت با تأیید والدین</p>
                  <p className="flex items-center gap-1.5"><ArrowRight size={13} className="text-emerald-600" /> پشتیبانی بازگشت وجه تا ۷ روز</p>
                </>
              ) : (
                <p className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> پروفایل سازنده با تأیید والدین یا ادمین</p>
              )}
            </div>
          </div>

          <div className="kid-card p-5">
            <p className="text-[11px] font-bold text-slate-500">سازنده</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={product.seller.name} color={product.seller.avatarColor} size={46} />
              <div>
                <p className="text-sm font-black text-forest">{product.seller.name}</p>
                <p className="text-[11px] text-slate-500">فروشندهٔ تأییدشده · از {faDateLabel(product.seller.createdAt)}</p>
              </div>
            </div>
            <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-[11px] leading-6 text-emerald-800">
              همهٔ سازندگان بازارچه پروفایلشان با تأیید والدین یا ادمین فعال شده است. برای حفظ حریم خصوصی کودکان، اطلاعات
              تماس خصوصی نمایش داده نمی‌شود.
            </p>
            <Link
              href={`/seller/${product.seller.id}`}
              className={`mt-3 w-full text-xs ${purchaseOn ? "kid-btn kid-btn-ghost" : "kid-btn kid-btn-primary"}`}
            >
              <UserRound size={15} /> دیدن پروفایل و ساخته‌های سازنده
            </Link>
          </div>

          {contactOn ? (
            <ContactSeller
              sellerId={product.sellerId}
              sellerName={product.seller.name}
              productId={product.id}
              productTitle={product.title}
              signedIn={Boolean(user)}
              senderIsMinor={Boolean(user && isMinor(user.birthDate))}
              senderGuardians={senderGuardians.map((guardian) => ({ name: guardian.name, email: guardian.email, phone: guardian.phone }))}
              sellerIsMinor={Boolean(sellerInfo?.minor)}
              sellerGuardianEmails={(sellerInfo?.guardians ?? []).map((guardian) => maskEmail(guardian.email))}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
