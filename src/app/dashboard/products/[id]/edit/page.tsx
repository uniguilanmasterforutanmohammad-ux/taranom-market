import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/products";
import { getQuota } from "@/lib/module-service";
import { ProductForm } from "@/components/product-form";
import { Badge } from "@/components/ui";
import { PRODUCT_STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "ویرایش محصول" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [product, categories, quota] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    getCategories(),
    getQuota(user),
  ]);
  if (!product) notFound();
  if (product.sellerId !== user.id && user.role !== "ADMIN") redirect("/dashboard/products");

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black text-forest">ویرایش محصول</h1>
          <Badge tone={product.status === "APPROVED" ? "mint" : product.status === "PENDING" ? "sun" : "berry"}>
            {PRODUCT_STATUS_LABEL[product.status]}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">با هر تغییر در محتوا، محصول دوباره برای بازبینی ارسال می‌شود.</p>
      </div>

      <ProductForm
        categories={categories.map((category) => ({ id: category.id, title: category.title, emoji: category.emoji }))}
        quotaRemaining={quota.remaining}
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
