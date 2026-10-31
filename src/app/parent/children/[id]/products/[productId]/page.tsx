import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireChildAccess } from "@/lib/children";
import { getCategories } from "@/lib/products";
import { getModuleStates } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { ProductForm } from "@/components/product-form";
import { Alert } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ویرایش محصول فرزند" };

export default async function EditChildProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = await params;
  const user = await requireUser();
  if (user.role === "CHILD") redirect("/dashboard");

  const child = await requireChildAccess(user, id);
  if (!child) notFound();

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.sellerId !== child.id) notFound();

  const states = await getModuleStates(user);
  const uploadState = states.find((state) => state.module.key === "productUpload");
  if (!uploadState?.enabled) return <ModuleOff module={MODULE_MAP.productUpload} />;

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Link href={`/parent/children/${child.id}`} className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900">
        <ArrowRight size={13} /> بازگشت به محصولات {child.name}
      </Link>

      <div>
        <h1 className="text-xl font-black text-forest">ویرایش «{product.title}»</h1>
        <p className="text-[11px] text-slate-500">محصول به نام {child.name} می‌ماند؛ بعد از ذخیره دوباره به صف بازبینی می‌رود.</p>
      </div>

      {product.status === "REJECTED" && product.rejectionReason ? (
        <Alert tone="berry" title="دلیل رد قبلی">
          {product.rejectionReason}
        </Alert>
      ) : null}

      <ProductForm
        categories={categories.map((category) => ({ id: category.id, title: category.title, emoji: category.emoji }))}
        quotaRemaining={0}
        ownerId={child.id}
        ownerName={child.name}
        redirectTo={`/parent/children/${child.id}`}
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
