import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { logAudit, notify } from "@/lib/audit";
import { phonesMatch } from "@/lib/phone";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  if (user.role !== "PARENT" && user.role !== "ADMIN") return jsonError("دسترسی ندارید.", 403);

  const body = await readJson<{ childId?: string; action?: string }>(request);
  if (!body?.childId || !["approve", "revoke"].includes(body.action ?? "")) return jsonError("درخواست نامعتبر.");

  const consent = await db.consent.findUnique({ where: { childId: body.childId }, include: { child: true } });
  if (!consent) return jsonError("درخواست رضایت پیدا نشد.", 404);

  const ownsChild =
    user.role === "ADMIN" ||
    consent.child.parentId === user.id ||
    consent.parentEmail.toLowerCase() === user.email.toLowerCase() ||
    phonesMatch(consent.parentPhone, user.phone);
  if (!ownsChild) return jsonError("این درخواست مربوط به شما نیست.", 403);

  if (body.action === "approve") {
    await db.$transaction([
      db.consent.update({
        where: { id: consent.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          revokedAt: null,
          parentName: user.name,
          parentEmail: consent.parentEmail || user.email,
          parentPhone: consent.parentPhone ?? user.phone ?? null,
        },
      }),
      db.user.update({ where: { id: consent.childId }, data: { parentId: user.id } }),
    ]);
    await Promise.all([
      notify({
        userId: consent.childId,
        title: "رضایت والدین تأیید شد ✅",
        body: "حساب تو حالا می‌تواند محصول جدید ثبت کند.",
        href: "/dashboard/products/new",
      }),
      logAudit({ actorId: user.id, action: "consent.approve", entity: "Consent", entityId: consent.id }),
    ]);
    return Response.json({ ok: true, status: "APPROVED" });
  }

  await db.$transaction([
    db.consent.update({ where: { id: consent.id }, data: { status: "REVOKED", revokedAt: new Date() } }),
    db.product.updateMany({ where: { sellerId: consent.childId, status: { not: "DRAFT" } }, data: { status: "DRAFT" } }),
  ]);
  await Promise.all([
    notify({
      userId: consent.childId,
      title: "رضایت والدین لغو شد",
      body: "محصولات از ویترین برداشته شدند. برای ادامه با والدین صحبت کن.",
      href: "/dashboard",
    }),
    logAudit({ actorId: user.id, action: "consent.revoke", entity: "Consent", entityId: consent.id, detail: "لغو رضایت و برداشتن محصولات" }),
  ]);
  return Response.json({ ok: true, status: "REVOKED" });
}
