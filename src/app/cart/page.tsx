import Link from "next/link";
import { ArrowLeft, ShoppingBag, Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModuleStates } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { CartControls } from "@/components/cart-controls";
import { EmptyState } from "@/components/ui";
import { faNum, toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "سبد خرید" };

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          emoji="🔐"
          title="برای دیدن سبد خرید وارد شو"
          body="سبد خرید به حساب تو وصل است تا والدین هم بتوانند آن را ببینند."
          action={<Link href="/login" className="kid-btn kid-btn-primary text-xs">ورود به حساب</Link>}
        />
      </div>
    );
  }

  const states = await getModuleStates(user);
  if (!states.find((state) => state.module.key === "cart")?.enabled) {
    return <div className="mx-auto max-w-2xl px-4 py-10"><ModuleOff module={MODULE_MAP.cart} /></div>;
  }

  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true, seller: { select: { name: true } } } } },
  });
  const checkoutOn = Boolean(states.find((state) => state.module.key === "checkout")?.enabled);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-forest"><ShoppingBag size={24} /> سبد خرید</h1>
      <p className="mt-1 text-[11px] text-slate-500">قبل از پرداخت، با والدین دربارهٔ خرید صحبت کن.</p>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            emoji="🧺"
            title="سبد خرید خالی است"
            body="از بازارچه چند ساختهٔ قشنگ انتخاب کن و به سبد اضافه کن."
            action={<Link href="/explore" className="kid-btn kid-btn-primary text-xs">گشت در بازارچه</Link>}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.id} className="kid-card flex flex-wrap items-center gap-3 p-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: item.product.category.tint }}>
                  {item.product.category.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.productId}`} className="truncate text-sm font-black text-forest hover:text-emerald-700">{item.product.title}</Link>
                  <p className="mt-0.5 text-[10px] text-slate-400">{item.product.category.title} · فروشنده: {item.product.seller.name}</p>
                  <p className="mt-1 text-[11px] font-bold text-emerald-700">{toman(item.product.price)}</p>
                </div>
                <CartControls itemId={item.id} quantity={item.quantity} />
                <p className="w-24 text-left text-xs font-black text-forest">{toman(item.product.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <aside className="kid-card h-fit space-y-3 p-5 lg:sticky lg:top-28">
            <h2 className="text-sm font-black text-forest">خلاصهٔ سفارش</h2>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-500"><span>تعداد اقلام</span><span>{faNum(items.length)}</span></div>
              <div className="flex justify-between text-slate-500"><span>جمع محصولات</span><span>{toman(total)}</span></div>
              <div className="flex justify-between text-slate-500"><span>هزینهٔ ارسال</span><span>محاسبه در مرحلهٔ بعد</span></div>
            </div>
            <div className="flex justify-between border-t border-dashed border-emerald-900/10 pt-2 text-sm font-black">
              <span className="text-forest">مبلغ قابل پرداخت</span>
              <span className="text-emerald-700">{toman(total)}</span>
            </div>
            {checkoutOn ? (
              <Link href="/checkout" className="kid-btn kid-btn-primary w-full text-sm">
                ادامهٔ خرید <ArrowLeft size={15} />
              </Link>
            ) : (
              <p className="rounded-xl bg-slate-50 p-2.5 text-center text-[11px] text-slate-500">درگاه پرداخت در حال حاضر خاموش است.</p>
            )}
            <p className="flex items-start gap-1.5 rounded-xl bg-emerald-50 p-2.5 text-[10px] leading-5 text-emerald-800">
              <Wallet size={13} className="mt-0.5 shrink-0" /> برای خریداران زیر ۱۳ سال، تأیید والدین در مرحلهٔ پرداخت الزامی است.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
