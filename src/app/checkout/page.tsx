import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModuleStates } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { ageFrom } from "@/lib/age";
import { ModuleOff } from "@/components/module-off";
import { CheckoutForm } from "@/components/checkout-form";
import { toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "پرداخت" };

export default async function CheckoutPage() {
  const user = await requireUser();
  const states = await getModuleStates(user);
  const checkoutState = states.find((state) => state.module.key === "checkout");
  if (!checkoutState?.enabled) return <div className="mx-auto max-w-2xl px-4 py-10"><ModuleOff module={MODULE_MAP.checkout} /></div>;

  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true } } },
  });
  if (items.length === 0) redirect("/cart");

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isMinor = ageFrom(user.birthDate) < 13;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/cart" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><ArrowRight size={13} /> بازگشت به سبد</Link>
      <h1 className="text-2xl font-black text-forest">تأیید و پرداخت</h1>
      <p className="mt-1 text-[11px] text-slate-500">یک قدم تا رسیدن ساختهٔ مورد علاقه‌ات به خانه.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div className="kid-card p-5">
            <h2 className="text-sm font-black text-forest">اطلاعات تحویل</h2>
            <div className="mt-3">
              <CheckoutForm isMinor={isMinor} totalLabel={toman(total)} />
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-[11px] leading-6 text-emerald-900">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            برای کودکان زیر ۱۳ سال، تأیید والدین الزامی است و در سرور بررسی می‌شود. بازگشت وجه تا ۷ روز پس از تحویل ممکن است.
          </div>
        </div>

        <aside className="kid-card h-fit p-5 lg:sticky lg:top-28">
          <h2 className="text-sm font-black text-forest">سفارش شما</h2>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-slate-600">{item.product.title} × {item.quantity}</span>
                <span className="shrink-0 font-bold text-forest">{toman(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-dashed border-emerald-900/10 pt-2 text-sm font-black">
            <span className="text-forest">مجموع</span>
            <span className="text-emerald-700">{toman(total)}</span>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-slate-400">این مبلغ شامل کارمزد پلتفرم نیست؛ کارمزد از سهم فروشنده کسر می‌شود.</p>
        </aside>
      </div>
    </div>
  );
}
