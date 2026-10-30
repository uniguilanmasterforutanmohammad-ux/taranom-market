import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { invalidateProductCache } from "@/lib/products";
import { logAudit, notify } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return jsonError("دسترسی ندارید.", 403);

  const body = await readJson<{ productId?: string; action?: string; reason?: string }>(request);
  if (!body?.productId || !["approve", "reject"].includes(body.action ?? "")) return jsonError("درخواست نامعتبر.");

  const product = await db.product.findUnique({ where: { id: body.productId }, include: { seller: true } });
  if (!product) return jsonError("محصول پیدا نشد.", 404);

  if (body.action === "approve") {
    await db.product.update({
      where: { id: product.id },
      data: { status: "APPROVED", rejectionReason: null },
    });
    await Promise.all([
      notify({
        userId: product.sellerId,
        title: "محصولت تأیید شد 🎉",
        body: `«${product.title}» حالا در ویترین بازارچه دیده می‌شود.`,
        href: `/product/${product.id}`,
      }),
      logAudit({ actorId: user.id, action: "product.approve", entity: "Product", entityId: product.id, detail: product.title }),
      invalidateProductCache(),
    ]);
    return Response.json({ ok: true, status: "APPROVED" });
  }

  const reason = (body.reason ?? "").trim();
  if (reason.length < 5) return jsonError("برای رد محصول، دلیل روشن بنویس.");
  await db.product.update({
    where: { id: product.id },
    data: { status: "REJECTED", rejectionReason: reason },
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
