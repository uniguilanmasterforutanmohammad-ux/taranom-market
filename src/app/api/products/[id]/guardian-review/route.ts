import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { logAudit, notify } from "@/lib/audit";
import { invalidateProductCache } from "@/lib/products";
import { requireChildAccess } from "@/lib/children";

/**
 * تأیید یا رد محصول کودک زیر ۱۳ سال توسط والدین.
 * تا این تأیید نگیرد، محصول به صف بازبینی ادمین نمی‌رود و هیچ‌جا منتشر نمی‌شود.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  if (user.role === "CHILD") return jsonError("این تصمیم فقط از پنل والدین گرفته می‌شود.", 403);

  const body = await readJson<{ action?: string; reason?: string }>(request);
  if (!body || !["approve", "reject"].includes(body.action ?? "")) return jsonError("درخواست نامعتبر.");

  const product = await db.product.findUnique({ where: { id }, include: { seller: true } });
  if (!product) return jsonError("محصول پیدا نشد.", 404);
  if (product.status !== "AWAITING_PARENT") return jsonError("این محصول در انتظار تأیید والدین نیست.", 409);

  const child = await requireChildAccess(user, product.sellerId);
  if (!child) return jsonError("شما والد یا سرپرست این کاربر نیستید.", 403);

  if (body.action === "approve") {
    await db.$transaction([
      db.product.update({
        where: { id },
        data: { status: "PENDING", parentApprovedAt: new Date(), rejectionReason: null },
      }),
      db.consent.updateMany({
        where: { childId: product.sellerId, status: { not: "APPROVED" } },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          revokedAt: null,
          parentName: user.name,
          parentPhone: user.phone ?? undefined,
        },
      }),
      db.user.update({ where: { id: product.sellerId }, data: { parentId: user.id } }),
    ]);

    if (!product.seller.managedByGuardian) {
      await notify({
        userId: product.sellerId,
        title: "محصولت تأیید والدین گرفت ✅",
        body: `«${product.title}» تأیید شد و حالا برای بازبینی ادمین می‌رود.`,
        href: "/dashboard/products",
      });
    }
    await Promise.all([
      logAudit({
        actorId: user.id,
        action: "product.parentApprove",
        entity: "Product",
        entityId: product.id,
        detail: `${product.title} · سازنده: ${child.name}`,
      }),
      invalidateProductCache(),
    ]);
    return Response.json({ ok: true, status: "PENDING" });
  }

  const reason = (body.reason ?? "").trim();
  if (reason.length < 5) return jsonError("دلیل رد را روشن بنویس (حداقل ۵ حرف).");

  await db.product.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: `رد والدین: ${reason}`, parentApprovedAt: null },
  });
  if (!product.seller.managedByGuardian) {
    await notify({
      userId: product.sellerId,
      title: "محصولت را والدینت تأیید نکردند",
      body: `دلیل: ${reason}`,
      href: `/dashboard/products/${product.id}/edit`,
    });
  }
  await Promise.all([
    logAudit({
      actorId: user.id,
      action: "product.parentReject",
      entity: "Product",
      entityId: product.id,
      detail: reason,
    }),
    invalidateProductCache(),
  ]);
  return Response.json({ ok: true, status: "REJECTED" });
}
