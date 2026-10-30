import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { notify } from "@/lib/audit";
import { ORDER_STATUS_LABEL } from "@/lib/format";

const ALLOWED = ["PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type Status = (typeof ALLOWED)[number];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  const body = await readJson<{ status?: string }>(request);
  const status = body?.status as Status | undefined;
  if (!status || !ALLOWED.includes(status)) return jsonError("وضعیت نامعتبر است.");

  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return jsonError("سفارش پیدا نشد.", 404);

  const isSeller = order.items.some((item) => item.sellerId === user.id);
  const isBuyer = order.buyerId === user.id;
  if (!isSeller && !isBuyer && user.role !== "ADMIN") return jsonError("دسترسی ندارید.", 403);
  if (isBuyer && !isSeller && user.role !== "ADMIN" && status !== "CANCELLED") {
    return jsonError("خریدار فقط می‌تواند سفارش در انتظار پرداخت را لغو کند.", 403);
  }
  if (status === "CANCELLED" && order.status !== "PENDING_PAYMENT") {
    return jsonError("این سفارش قابل لغو نیست.", 400);
  }

  await db.order.update({ where: { id }, data: { status } });
  await notify({
    userId: order.buyerId,
    title: "وضعیت سفارش تغییر کرد",
    body: `سفارش ${order.code} اکنون «${ORDER_STATUS_LABEL[status]}» است.`,
    href: "/dashboard/orders",
  });

  return Response.json({ ok: true, status });
}
