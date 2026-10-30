import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  try {
    await assertModule("reviews", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "بخش نظرها خاموش است.", 403);
  }

  const body = await readJson<{ productId?: string; rating?: number; comment?: string }>(request);
  const rating = Number(body?.rating);
  const comment = (body?.comment ?? "").trim();
  if (!body?.productId || !Number.isInteger(rating) || rating < 1 || rating > 5) return jsonError("امتیاز نامعتبر است.");
  if (comment.length < 3) return jsonError("متن نظر خیلی کوتاه است.");

  const product = await db.product.findUnique({ where: { id: body.productId } });
  if (!product || product.status !== "APPROVED") return jsonError("محصول در دسترس نیست.", 404);
  if (product.sellerId === user.id) return jsonError("نمی‌توانی برای محصول خودت نظر بدهی.", 400);

  await db.review.upsert({
    where: { productId_authorId: { productId: product.id, authorId: user.id } },
    update: { rating, comment, status: "PENDING" },
    create: { productId: product.id, authorId: user.id, rating, comment, status: "PENDING" },
  });
  await logAudit({ actorId: user.id, action: "review.create", entity: "Review", entityId: product.id, detail: `امتیاز ${rating}` });
  return Response.json({ ok: true }, { status: 201 });
}
