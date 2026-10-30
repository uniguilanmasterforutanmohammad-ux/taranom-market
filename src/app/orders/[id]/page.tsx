import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, ReceiptText, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { ORDER_STATUS_LABEL, faDateLabel, faNum, toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "رسید سفارش" };

export default async function OrderReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, buyer: { select: { id: true, name: true } } },
  });
  if (!order) notFound();
  const isSeller = order.items.some((item) => item.sellerId === user.id);
  if (order.buyerId !== user.id && !isSeller && user.role !== "ADMIN") notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="kid-card overflow-hidden">
        <div className="flex flex-col items-center gap-2 border-b-2 border-emerald-900/10 bg-emerald-50 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white"><CheckCircle2 size={30} /></span>
          <h1 className="text-xl font-black text-forest">سفارش ثبت شد!</h1>
          <p className="text-[11px] text-slate-500">کد سفارش: <span className="font-black text-emerald-800">{order.code}</span></p>
          <Badge tone="mint">{ORDER_STATUS_LABEL[order.status]}</Badge>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500"><ReceiptText size={13} /> تاریخ ثبت</span>
            <span className="font-bold text-forest">{faDateLabel(order.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500"><Package size={13} /> خریدار</span>
            <span className="font-bold text-forest">{order.buyer.name}</span>
          </div>

          <div className="space-y-1.5 rounded-2xl bg-emerald-50/50 p-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-[11px]">
                <span className="text-slate-600">{item.title} × {faNum(item.quantity)}</span>
                <span className="font-bold text-forest">{toman(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-dashed border-emerald-900/10 pt-2 text-sm font-black">
            <span className="text-forest">مبلغ پرداخت‌شده</span>
            <span className="text-emerald-700">{toman(order.total)}</span>
          </div>
          {order.address ? <p className="text-[10px] leading-5 text-slate-400">نشانی: {order.address}</p> : null}
          <p className="flex items-center gap-1.5 text-[10px] text-emerald-800"><ShieldCheck size={12} /> پرداخت نمایشی با تأیید والدین ثبت شد.</p>

          <div className="flex gap-2 pt-1">
            <Link href="/dashboard/orders" className="kid-btn kid-btn-primary flex-1 text-xs">پیگیری سفارش</Link>
            <Link href="/explore" className="kid-btn kid-btn-ghost flex-1 text-xs">ادامهٔ خرید</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
