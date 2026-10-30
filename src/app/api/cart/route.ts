import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  try {
    await assertModule("cart", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "سبد خرید خاموش است.", 403);
  }

  const body = await readJson<{ productId?: string }>(request);
  if (!body?.productId) return jsonError("محصول نامعتبر است.");

  const product = await db.product.findUnique({ where: { id: body.productId } });
  if (!product || product.status !== "APPROVED") return jsonError("این محصول در دسترس نیست.", 404);
  if (product.sellerId === user.id) return jsonError("نمی‌توانی محصول خودت را بخری.", 400);

  await db.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    update: { quantity: { increment: 1 } },
    create: { userId: user.id, productId: product.id, quantity: 1 },
  });
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  const body = await readJson<{ itemId?: string; quantity?: number }>(request);
  if (!body?.itemId || typeof body.quantity !== "number") return jsonError("درخواست نامعتبر.");

  const item = await db.cartItem.findUnique({ where: { id: body.itemId } });
  if (!item || item.userId !== user.id) return jsonError("آیتم پیدا نشد.", 404);

  if (body.quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    await db.cartItem.update({ where: { id: item.id }, data: { quantity: Math.min(20, Math.floor(body.quantity)) } });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  const body = await readJson<{ itemId?: string }>(request);
  if (!body?.itemId) return jsonError("درخواست نامعتبر.");
  await db.cartItem.deleteMany({ where: { id: body.itemId, userId: user.id } });
  return Response.json({ ok: true });
}
