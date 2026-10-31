import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule } from "@/lib/module-service";
import { PLANS, type PlanTier } from "@/lib/modules";
import { requireChildAccess } from "@/lib/children";
import { activateSubscription } from "@/lib/subscription";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  try {
    await assertModule("subscriptions", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ماژول اشتراک غیرفعال است.", 403);
  }

  const body = await readJson<{ plan?: string; childId?: string }>(request);
  const plan = body?.plan as PlanTier | undefined;
  if (!plan || !PLANS[plan]) return jsonError("پلن نامعتبر است.");

  // والد/سرپرست می‌تواند پلن فرزندش را هم ارتقا بدهد (پرداخت نمایشی با حساب والد).
  let targetId = user.id;
  const childId = (body?.childId ?? "").trim();
  if (childId && childId !== user.id) {
    const child = await requireChildAccess(user, childId);
    if (!child) return jsonError("فقط والد یا سرپرست این کودک می‌تواند پلن او را ارتقا بدهد.", 403);
    targetId = child.id;
  }

  const result = await activateSubscription(targetId, plan, { actorId: user.id });
  return Response.json({ ok: true, plan: result.plan, renewsAt: result.renewsAt, userId: targetId });
}
