import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";
import { PLANS, type PlanTier } from "@/lib/modules";
import { logAudit, notify } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  try {
    await assertModule("subscriptions", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ماژول اشتراک غیرفعال است.", 403);
  }

  const body = await readJson<{ plan?: string }>(request);
  const plan = body?.plan as PlanTier | undefined;
  if (!plan || !PLANS[plan]) return jsonError("پلن نامعتبر است.");

  const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { plan } }),
    db.subscription.create({
      data: { userId: user.id, plan, price: PLANS[plan].price, renewsAt, status: "ACTIVE" },
    }),
  ]);

  await Promise.all([
    logAudit({ actorId: user.id, action: "subscription.change", entity: "Subscription", entityId: user.id, detail: plan }),
    notify({
      userId: user.id,
      title: `پلن ${PLANS[plan].title} فعال شد 🎉`,
      body: `سقف آپلود شما به ${PLANS[plan].productLimit} محصول افزایش یافت.`,
      href: "/dashboard",
    }),
  ]);

  return Response.json({ ok: true, plan, renewsAt });
}
