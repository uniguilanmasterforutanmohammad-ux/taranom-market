import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/products";
import { PRODUCT_STATUS_LABEL, PRODUCT_TYPE_LABEL, faDateLabel, toman } from "@/lib/format";
import { ProductForm } from "@/components/product-form";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ویرایش و بازبینی محصول" };

export default async function ModerationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("ADMIN");

  const product = await db.product.findUnique({ where: { id }, include: { seller: true, category: true } });
  if (!product) notFound();
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/moderation" className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900">
        <ArrowRight size={13} /> بازگشت به صف بازبینی
      </Link>

      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-black text-forest">
          <ShieldCheck size={19} /> ویرایش و بازبینی «{product.title}»
        </h1>
        <p className="text-[11px] text-slate-500">
          فروشنده: {product.seller.name} · {product.category.title} · {toman(product.price)} · {faDateLabel(product.createdAt)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={product.status === "APPROVED" ? "mint" : product.status === "REJECTED" ? "berry" : product.status === "AWAITING_PARENT" ? "sky" : "sun"}>
            {PRODUCT_STATUS_LABEL[product.status]}
          </Badge>
          <Badge tone="sky">{PRODUCT_TYPE_LABEL[product.type]}</Badge>
          {product.parentApprovedAt ? (
            <Badge tone="mint"><UserCheck size={10} /> تأیید والدین</Badge>
          ) : (
            <Badge tone="slate">بدون تأیید والدین</Badge>
          )}
          {product.viaGuardian ? <Badge tone="clay">ثبت‌شده توسط والدین</Badge> : null}
        </div>
        {product.rejectionReason ? (
          <p className="mt-2 rounded-xl bg-pink-50 p-2.5 text-[10px] leading-5 text-pink-800">دلیل رد قبلی: {product.rejectionReason}</p>
        ) : null}
      </div>

      <ProductForm
        categories={categories.map((category) => ({ id: category.id, title: category.title, emoji: category.emoji }))}
        quotaRemaining={1}
        reviewMode
        product={{
          id: product.id,
          title: product.title,
          description: product.description,
          type: product.type,
          price: product.price,
          categoryId: product.categoryId,
          tags: product.tags,
          stock: product.stock,
        }}
      />
    </div>
  );
}
