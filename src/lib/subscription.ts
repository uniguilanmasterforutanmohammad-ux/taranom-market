import { db } from "./db";
import { PLANS, type PlanTier } from "./modules";
import { logAudit, notify } from "./audit";

/** فعال‌سازی پلن با پرداخت نمایشی؛ هم برای خود کاربر و هم برای فرزند (با تأیید والدین). */
export async function activateSubscription(
  userId: string,
  plan: PlanTier,
  options?: { actorId?: string | null },
) {
  const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { plan } }),
    db.subscription.create({
      data: { userId, plan, price: PLANS[plan].price, renewsAt, status: "ACTIVE" },
    }),
  ]);

  await Promise.all([
    logAudit({
      actorId: options?.actorId ?? userId,
      action: "subscription.change",
      entity: "Subscription",
      entityId: userId,
      detail: plan,
    }),
    notify({
      userId,
      title: `پلن ${PLANS[plan].title} فعال شد 🎉`,
      body: `سقف آپلود به ${PLANS[plan].productLimit} محصول افزایش یافت.`,
      href: "/dashboard",
    }),
  ]);

  return { plan, renewsAt };
}
