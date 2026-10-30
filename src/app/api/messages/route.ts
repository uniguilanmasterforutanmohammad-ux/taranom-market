import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, notify } from "@/lib/audit";
import { guardiansOf, isMinor, maskEmail, senderContactInfo } from "@/lib/contact";

const CHANNELS = ["IN_APP", "CALLBACK", "EMAIL"] as const;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("برای ارسال پیام ابتدا وارد شو.", 401);

  try {
    await assertModule("sellerContact", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "این بخش خاموش است.", 403);
  }

  const limit = await rateLimit(`message:${user.id}`, 5, 3600);
  if (!limit.ok) return jsonError("سقف پیام در این ساعت پر شده است. کمی بعد تلاش کن.", 429);

  const body = await readJson<{
    sellerId?: string;
    productId?: string;
    body?: string;
    channel?: string;
    contactEmail?: string;
    contactPhone?: string;
  }>(request);
  if (!body?.sellerId) return jsonError("سازنده مشخص نیست.");

  const text = (body.body ?? "").trim();
  if (text.length < 5) return jsonError("متن پیام را کامل‌تر بنویس (حداقل ۵ حرف).");
  if (text.length > 800) return jsonError("متن پیام بیش از حد بلند است.");
  const channel = CHANNELS.includes((body.channel ?? "") as (typeof CHANNELS)[number])
    ? (body.channel as (typeof CHANNELS)[number])
    : "IN_APP";

  const seller = await db.user.findUnique({ where: { id: body.sellerId }, select: { id: true, name: true } });
  if (!seller) return jsonError("سازنده پیدا نشد.", 404);
  if (seller.id === user.id) return jsonError("نمی‌توانی به خودت پیام بدهی.", 400);

  let product: { id: string; title: string } | null = null;
  if (body.productId) {
    const found = await db.product.findUnique({ where: { id: body.productId }, select: { id: true, title: true, sellerId: true } });
    if (!found || found.sellerId !== seller.id) return jsonError("محصول نامعتبر است.", 404);
    product = { id: found.id, title: found.title };
  }

  /** اطلاعات شخصی فقط از بزرگسالان گرفته می‌شود؛ برای کودکان راه تماس والدین ثبت می‌شود. */
  const senderIsMinor = isMinor(user.birthDate);
  const contactInfo = await senderContactInfo(user, {
    email: body.contactEmail,
    phone: body.contactPhone,
  });

  const senderGuardians = senderIsMinor ? await guardiansOf(user.id) : [];
  const sellerGuardians = (await db.consent.findUnique({ where: { childId: seller.id }, select: { parentEmail: true, parentName: true, status: true } }))
    ? await guardiansOf(seller.id)
    : [];

  const parentCopies = [...new Set([...senderGuardians, ...sellerGuardians].map((person) => person.email))];

  const message = await db.message.create({
    data: {
      senderId: user.id,
      recipientId: seller.id,
      productId: product?.id ?? null,
      body: text,
      channel,
      contactEmail: contactInfo.email,
      contactPhone: contactInfo.phone,
      parentCopies,
    },
  });

  const target = product ? `«${product.title}»` : "پروفایل شما";
  await notify({
    userId: seller.id,
    title: senderIsMinor ? "پیام جدید از یک عضو زیر ۱۳ سال" : "پیام جدید از یک عضو بازارچه",
    body: `${user.name} دربارهٔ ${target} نوشت: ${text.slice(0, 120)}`,
    href: "/dashboard/messages",
  });

  for (const [index, guardian] of [...senderGuardians, ...sellerGuardians].entries()) {
    const guardianUser = await db.user.findUnique({ where: { email: guardian.email.toLowerCase() }, select: { id: true } });
    if (guardianUser) {
      await notify({
        userId: guardianUser.id,
        title: `پیام کودک تحت نظارت شما (${index < senderGuardians.length ? "فرزند شما فرستاده" : "برای فرزند شما"})`,
        body: `${user.name} دربارهٔ ${target}: ${text.slice(0, 120)}`,
        href: "/parent",
      });
    }
  }

  await logAudit({
    actorId: user.id,
    action: "message.send",
    entity: "Message",
    entityId: message.id,
    detail: `${channel} → ${seller.name}${parentCopies.length ? ` · نسخه برای ${parentCopies.length} والد` : ""}`,
  });

  return Response.json(
    {
      ok: true,
      channel,
      contact: { email: contactInfo.email, phone: contactInfo.phone },
      copies: parentCopies.map((email) => ({ email, masked: maskEmail(email) })),
      senderParentsInformed: senderGuardians.length > 0,
      sellerParentsInformed: sellerGuardians.length > 0,
    },
    { status: 201 },
  );
}
