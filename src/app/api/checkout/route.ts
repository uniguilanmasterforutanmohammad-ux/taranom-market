import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";
import { ageFrom } from "@/lib/age";
import { logAudit, notify } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  try {
    await assertModule("cart", user);
    await assertModule("checkout", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "پرداخت در دسترس نیست.", 403);
  }

  const body = await readJson<{ address?: string; note?: string; parentConfirmed?: boolean }>(request);
  if (!body) return jsonError("دادهٔ نامعتبر.");
  const address = (body.address ?? "").trim();
  if (address.length < 10) return jsonError("نشانی تحویل را کامل‌تر وارد کن.");

  const isMinor = ageFrom(user.birthDate) < 13;
  if (isMinor && !body.parentConfirmed) return jsonError("برای خرید، تأیید والدین لازم است.", 403);

  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
  if (items.length === 0) return jsonError("سبد خرید خالی است.");
  if (items.some((item) => item.product.status !== "APPROVED")) {
    return jsonError("یکی از محصولات دیگر در دسترس نیست. سبد را به‌روزرسانی کن.");
  }

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const fee = Math.round(total * 0.07);
  const code = `JB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        code,
        buyerId: user.id,
        total,
        fee,
        sellerEarning: total - fee,
        status: "PAID",
        address,
        note: body.note?.trim() || (isMinor ? "خرید با تأیید والدین ثبت شد." : null),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            sellerId: item.product.sellerId,
            title: item.product.title,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
    });
    for (const item of items) {
      if (item.product.stock != null) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
    }
    await tx.cartItem.deleteMany({ where: { userId: user.id } });
    return created;
  });

  const sellerIds = [...new Set(items.map((item) => item.product.sellerId))];
  await Promise.all([
    ...sellerIds.map((sellerId) =>
      notify({
        userId: sellerId,
        title: "فروش جدید! 🎉",
        body: `سفارش ${code} پرداخت شد. برای آماده‌سازی به پنل سفارش‌ها برو.`,
        href: "/dashboard/orders",
      }),
    ),
    notify({
      userId: user.id,
      title: "پرداخت با موفقیت انجام شد",
      body: `سفارش ${code} ثبت شد. وضعیت را از پنل سفارش‌ها پیگیری کن.`,
      href: `/orders/${order.id}`,
    }),
    logAudit({ actorId: user.id, action: "order.create", entity: "Order", entityId: order.id, detail: `مبلغ ${total}` }),
  ]);

  return Response.json({ ok: true, orderId: order.id, code });
}
