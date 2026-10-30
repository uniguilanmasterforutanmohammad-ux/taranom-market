import Link from "next/link";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { ModerationActions } from "@/components/moderation-actions";
import { Badge, EmptyState } from "@/components/ui";
import { PRODUCT_STATUS_LABEL, PRODUCT_TYPE_LABEL, faDateLabel, toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "صف بازبینی" };

export default async function ModerationPage() {
  const [pending, recent] = await Promise.all([
    db.product.findMany({ where: { status: "PENDING" }, include: { seller: true, category: true }, orderBy: { createdAt: "asc" } }),
    db.product.findMany({ where: { status: { in: ["APPROVED", "REJECTED"] } }, include: { seller: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-black text-forest"><ShieldAlert size={20} /> صف بازبینی محتوا</h1>
        <p className="text-[11px] text-slate-500">ایمنی، تناسب سنی و کیفیت را بررسی کن؛ هیچ محصولی بدون تأیید منتشر نمی‌شود.</p>
      </div>

      {pending.length === 0 ? (
        <EmptyState emoji="✅" title="صف بازبینی خالی است" body="همهٔ محصولات بررسی شده‌اند." />
      ) : (
        <div className="space-y-3">
          {pending.map((product) => (
            <div key={product.id} className="kid-card p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: product.category.tint }}>{product.category.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-black text-forest">{product.title}</p>
                    <Badge tone="sun"><Clock size={10} /> {PRODUCT_STATUS_LABEL[product.status]}</Badge>
                    <Badge tone="sky">{PRODUCT_TYPE_LABEL[product.type]}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-600">{product.description}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    فروشنده: {product.seller.name} · {product.category.title} · {toman(product.price)} · {faDateLabel(product.createdAt)}
                  </p>
                </div>
                <ModerationActions productId={product.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="kid-card p-5">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-forest"><CheckCircle2 size={15} /> تصمیم‌های اخیر</h2>
        <div className="mt-2 divide-y divide-emerald-900/5">
          {recent.length === 0 ? <p className="py-3 text-xs text-slate-500">تصمیمی ثبت نشده.</p> : recent.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[11px]">
              <span className="truncate font-bold text-slate-700">{product.title}</span>
              <span className="text-slate-400">{product.seller.name}</span>
              {product.status === "APPROVED" ? (
                <Link href={`/product/${product.id}`} className="text-emerald-700">تأییدشده</Link>
              ) : (
                <span className="text-pink-600" title={product.rejectionReason ?? ""}>ردشده</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
