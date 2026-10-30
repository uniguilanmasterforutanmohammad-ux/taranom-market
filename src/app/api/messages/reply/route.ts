import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, notify } from "@/lib/audit";
import { guardiansOf, isMinor, maskEmail, senderContactInfo } from "@/lib/contact";
import { isGuardianOf } from "@/lib/approval";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("برای پاسخ‌دادن ابتدا وارد شو.", 401);

  try {
    await assertModule("sellerContact", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "این بخش خاموش است.", 403);
  }

  const body = await readJson<{ messageId?: string; body?: string; contactEmail?: string; contactPhone?: string }>(request);
  if (!body?.messageId) return jsonError("پیام مرجع مشخص نیست.");

  const text = (body.body ?? "").trim();
  if (text.length < 2) return jsonError("متن پاسخ خیلی کوتاه است.");
  if (text.length > 800) return jsonError("متن پاسخ بیش از حد بلند است.");

  const original = await db.message.findUnique({
    where: { id: body.messageId },
    select: { id: true, senderId: true, recipientId: true, productId: true, body: true },
  });
  if (!original) return jsonError("پیام پیدا نشد.", 404);

  /** سه حالت: پاسخ خودِ طرف گفت‌وگو، یا پاسخ والد به‌جای فرزندش. */
  const isSender = user.id === original.senderId;
  const isRecipient = user.id === original.recipientId;
  let actorId = user.id;
  let counterpartId: string;
  let viaGuardian = false;

  if (isSender || isRecipient) {
    counterpartId = isSender ? original.recipientId : original.senderId;
  } else {
    let childId: string | null = null;
    for (const candidate of [original.senderId, original.recipientId]) {
      if (await isGuardianOf(user, candidate)) {
        childId = candidate;
        break;
      }
    }
    if (!childId) return jsonError("شما طرف این گفت‌وگو نیستید.", 403);
    actorId = childId;
    counterpartId = childId === original.senderId ? original.recipientId : original.senderId;
    viaGuardian = true;
  }

  /** فرزند بدون تأیید والدین نمی‌تواند پاسخ بدهد؛ والدین آزادند. */
  if (!viaGuardian && user.role === "CHILD") {
    try {
      await assertModule("messageReply", user);
    } catch {
      return jsonError("پاسخ‌دادن به پیام برای تو فعال نیست. از والدینت بخواه این اجازه را از پنل والدین روشن کند.", 403);
    }
  }

  const limit = await rateLimit(`message-reply:${user.id}`, 10, 3600);
  if (!limit.ok) return jsonError("سقف پاسخ در این ساعت پر شده است. کمی بعد تلاش کن.", 429);

  const actor = actorId === user.id ? user : await db.user.findUnique({ where: { id: actorId } });
  if (!actor) return jsonError("کاربر پیدا نشد.", 404);

  const actorGuardians = isMinor(actor.birthDate) ? await guardiansOf(actor.id) : [];
  const contactInfo = await senderContactInfo(actor, { email: body.contactEmail, phone: body.contactPhone });
  const counterpartGuardians = isMinor((await db.user.findUnique({ where: { id: counterpartId }, select: { birthDate: true } }))?.birthDate)
    ? await guardiansOf(counterpartId)
    : [];

  const parentCopies = [...new Set([...actorGuardians, ...counterpartGuardians].map((person) => person.email))];

  const counterpart = await db.user.findUnique({ where: { id: counterpartId }, select: { id: true, name: true } });
  if (!counterpart) return jsonError("مخاطب پیدا نشد.", 404);

  const reply = await db.message.create({
    data: {
      senderId: actor.id,
      recipientId: counterpartId,
      productId: original.productId,
      replyToId: original.id,
      body: text,
      channel: "IN_APP",
      contactEmail: contactInfo.email,
      contactPhone: contactInfo.phone,
      viaGuardian,
      parentCopies,
    },
  });

  await db.message.update({ where: { id: original.id }, data: { read: true } });

  await notify({
    userId: counterpartId,
    title: viaGuardian ? "پاسخ جدید (با نظارت والدین)" : "پاسخ جدید در پیام‌ها",
    body: `${actor.name} پاسخ داد: ${text.slice(0, 120)}`,
    href: "/dashboard/messages",
  });

  for (const guardian of [...actorGuardians, ...counterpartGuardians]) {
    const guardianUser = await db.user.findUnique({ where: { email: guardian.email.toLowerCase() }, select: { id: true } });
    if (guardianUser) {
      await notify({
        userId: guardianUser.id,
        title: "پاسخ در گفت‌وگوی کودک تحت نظارت شما",
        body: `${actor.name} پاسخ داد: ${text.slice(0, 120)}`,
        href: "/parent",
      });
    }
  }

  await logAudit({
    actorId: user.id,
    action: viaGuardian ? "message.reply.guardian" : "message.reply",
    entity: "Message",
    entityId: reply.id,
    detail: `پاسخ به ${counterpart.name}${parentCopies.length ? ` · نسخه برای ${parentCopies.length} والد` : ""}`,
  });

  return Response.json(
    {
      ok: true,
      viaGuardian,
      contact: { email: contactInfo.email, phone: contactInfo.phone },
      copies: parentCopies.map((email) => ({ email, masked: maskEmail(email) })),
    },
    { status: 201 },
  );
}
