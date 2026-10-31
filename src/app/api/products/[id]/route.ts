import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";
import { invalidateProductCache } from "@/lib/products";
import { logAudit, notify } from "@/lib/audit";
import { requireChildAccess, requiresGuardianApproval } from "@/lib/children";
import { guardianAccountsOf } from "@/lib/approval";

type Body = {
  title?: string;
  description?: string;
  type?: string;
  price?: number;
  categoryId?: string;
  tags?: string[];
  stock?: number | null;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  const product = await db.product.findUnique({
    where: { id },
    include: { seller: { select: { birthDate: true, managedByGuardian: true } } },
  });
  if (!product) return jsonError("محصول پیدا نشد.", 404);

  const isOwner = product.sellerId === user.id;
  const managedChild = !isOwner && user.role !== "ADMIN" ? await requireChildAccess(user, product.sellerId) : null;
  if (!isOwner && user.role !== "ADMIN" && !managedChild) return jsonError("دسترسی ندارید.", 403);

  try {
    await assertModule("productUpload", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ماژول غیرفعال است.", 403);
  }

  const body = await readJson<Body>(request);
  if (!body) return jsonError("دادهٔ نامعتبر.");

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const price = Number(body.price);
  if (title.length < 3) return jsonError("عنوان محصول خیلی کوتاه است.");
  if (description.length < 15) return jsonError("توضیحات محصول خیلی کوتاه است.");
  if (!Number.isFinite(price) || price < 0) return jsonError("قیمت نامعتبر است.");

  const category = body.categoryId ? await db.category.findUnique({ where: { id: body.categoryId } }) : null;
  if (body.categoryId && !category) return jsonError("دسته‌بندی نامعتبر است.");

  const parentFirst = user.role !== "ADMIN" && !managedChild && requiresGuardianApproval(product.seller);
  const nextStatus = user.role === "ADMIN" ? product.status : parentFirst ? "AWAITING_PARENT" : "PENDING";
  const nextParentApprovedAt = user.role === "ADMIN"
    ? product.parentApprovedAt
    : managedChild
      ? new Date()
      : parentFirst
        ? null
        : product.parentApprovedAt;

  const updated = await db.product.update({
    where: { id },
    data: {
      title,
      description,
      type: (["PHYSICAL", "SERVICE", "DIGITAL"].includes(body.type ?? "") ? body.type : product.type) as "PHYSICAL" | "SERVICE" | "DIGITAL",
      price: Math.round(price),
      categoryId: body.categoryId ?? product.categoryId,
      tags: (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 6),
      stock: body.stock != null ? Math.max(0, Number(body.stock)) : product.stock,
      viaGuardian: managedChild ? true : product.viaGuardian,
      submittedById: managedChild ? user.id : product.submittedById,
      parentApprovedAt: nextParentApprovedAt,
      status: nextStatus,
      rejectionReason: user.role === "ADMIN" ? product.rejectionReason : null,
    },
  });

  if (parentFirst) {
    const guardians = await guardianAccountsOf(product.sellerId);
    for (const guardian of guardians) {
      await notify({
        userId: guardian.id,
        title: "محصول ویرایش‌شده منتظر تأیید شماست",
        body: `«${title}» ویرایش شد و دوباره منتظر تأیید والدین است.`,
        href: "/parent",
      });
    }
  }

  await Promise.all([
    logAudit({
      actorId: user.id,
      action: managedChild ? "product.update.viaGuardian" : "product.update",
      entity: "Product",
      entityId: id,
      detail: managedChild ? `${title} · سازنده: ${managedChild.name}` : title,
    }),
    invalidateProductCache(),
  ]);
  return Response.json({ product: { id: updated.id, status: updated.status } });
}
