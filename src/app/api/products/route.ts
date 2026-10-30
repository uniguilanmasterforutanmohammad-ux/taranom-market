import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertCanCreateProduct, assertModule } from "@/lib/module-service";
import { invalidateProductCache } from "@/lib/products";
import { logAudit, notify } from "@/lib/audit";

type Body = {
  title?: string;
  description?: string;
  type?: string;
  price?: number;
  categoryId?: string;
  tags?: string[];
  stock?: number | null;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  try {
    await assertModule("productUpload", user);
    await assertCanCreateProduct(user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "اجازهٔ ثبت ندارید.", 403);
  }

  const body = await readJson<Body>(request);
  if (!body) return jsonError("دادهٔ نامعتبر.");

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const type = body.type;
  const price = Number(body.price);
  const categoryId = body.categoryId ?? "";

  if (title.length < 3) return jsonError("عنوان محصول خیلی کوتاه است.");
  if (description.length < 15) return jsonError("توضیحات محصول خیلی کوتاه است.");
  if (!type || !["PHYSICAL", "SERVICE", "DIGITAL"].includes(type)) return jsonError("نوع محصول نامعتبر است.");
  if (!Number.isFinite(price) || price < 0) return jsonError("قیمت نامعتبر است.");

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) return jsonError("دسته‌بندی نامعتبر است.");

  const product = await db.product.create({
    data: {
      title,
      description,
      type: type as "PHYSICAL" | "SERVICE" | "DIGITAL",
      price: Math.round(price),
      categoryId,
      sellerId: user.id,
      tags: (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 6),
      stock: type === "PHYSICAL" && body.stock != null ? Math.max(0, Number(body.stock)) : null,
      status: "PENDING",
    },
  });

  await Promise.all([
    logAudit({ actorId: user.id, action: "product.create", entity: "Product", entityId: product.id, detail: title }),
    notify({ userId: user.id, title: "محصولت ثبت شد ✅", body: `«${title}» در صف بازبینی قرار گرفت.`, href: "/dashboard/products" }),
    invalidateProductCache(),
  ]);

  return Response.json({ product: { id: product.id, status: product.status } }, { status: 201 });
}
