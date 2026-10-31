import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { invalidateProductCache } from "@/lib/products";
import { logAudit, notify } from "@/lib/audit";

type Edits = {
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
  if (!user || user.role !== "ADMIN") return jsonError("دسترسی ندارید.", 403);

  const body = await readJson<{ productId?: string; action?: string; reason?: string; edits?: Edits }>(request);
  if (!body?.productId || !["approve", "reject"].includes(body.action ?? "")) return jsonError("درخواست نامعتبر.");

  const product = await db.product.findUnique({ where: { id: body.productId }, include: { seller: true } });
  if (!product) return jsonError("محصول پیدا نشد.", 404);
  if (product.status === "AWAITING_PARENT") {
    return jsonError("این محصول ابتدا باید تأیید والدین بگیرد و بعد به صف بازبینی می‌آید.", 409);
  }

  /** ادمین هنگام تأیید یا رد می‌تواند متن/قیمت/دسته را هم اصلاح کند. */
  let editData: Record<string, unknown> = {};
  if (body.edits) {
    const title = (body.edits.title ?? "").trim();
    const description = (body.edits.description ?? "").trim();
    const price = Number(body.edits.price);
    if (title.length < 3) return jsonError("عنوان محصول خیلی کوتاه است.");
    if (description.length < 15) return jsonError("توضیحات محصول خیلی کوتاه است.");
    if (!Number.isFinite(price) || price < 0) return jsonError("قیمت نامعتبر است.");

    let categoryId = product.categoryId;
    if (body.edits.categoryId) {
      const category = await db.category.findUnique({ where: { id: body.edits.categoryId } });
      if (!category) return jsonError("دسته‌بندی نامعتبر است.");
      categoryId = category.id;
    }

    editData = {
      title,
      description,
      price: Math.round(price),
      categoryId,
      type: (["PHYSICAL", "SERVICE", "DIGITAL"].includes(body.edits.type ?? "")
        ? body.edits.type
        : product.type) as "PHYSICAL" | "SERVICE" | "DIGITAL",
      tags: (body.edits.tags ?? product.tags).map((tag) => tag.trim()).filter(Boolean).slice(0, 6),
      stock: body.edits.stock != null ? Math.max(0, Number(body.edits.stock)) : product.stock,
    };
  }

  if (body.action === "approve") {
    const finalTitle = (editData.title as string | undefined) ?? product.title;
    await db.product.update({
      where: { id: product.id },
      data: { ...editData, status: "APPROVED", rejectionReason: null },
    });
    await Promise.all([
      notify({
        userId: product.sellerId,
        title: "محصولت تأیید شد 🎉",
        body: `«${finalTitle}» حالا در ویترین بازارچه دیده می‌شود.`,
        href: `/product/${product.id}`,
      }),
      logAudit({
        actorId: user.id,
        action: "product.approve",
        entity: "Product",
        entityId: product.id,
        detail: body.edits ? `${finalTitle} · با ویرایش ادمین` : finalTitle,
      }),
      invalidateProductCache(),
    ]);
    return Response.json({ ok: true, status: "APPROVED" });
  }

  const reason = (body.reason ?? "").trim();
  if (reason.length < 5) return jsonError("برای رد محصول، دلیل روشن بنویس.");
  await db.product.update({
    where: { id: product.id },
    data: { ...editData, status: "REJECTED", rejectionReason: reason },
  });
  await Promise.all([
    notify({
      userId: product.sellerId,
      title: "محصولت نیاز به اصلاح دارد",
      body: `دلیل: ${reason}`,
      href: `/dashboard/products/${product.id}/edit`,
    }),
    logAudit({ actorId: user.id, action: "product.reject", entity: "Product", entityId: product.id, detail: reason }),
    invalidateProductCache(),
  ]);
  return Response.json({ ok: true, status: "REJECTED" });
}
