import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { getGlobalSettings, isModuleEnabled } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, notify } from "@/lib/audit";
import { PLAN_UPGRADE_KEY, guardianAccountsOf, isParentApprovalModule } from "@/lib/approval";
import { PLAN_RANK, PLANS, type PlanTier } from "@/lib/modules";

/** ثبت درخواست کودک برای گرفتن اجازهٔ والدین روی یک ماژول نیازمند تأیید یا ارتقای پلن. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("برای ثبت درخواست ابتدا وارد شو.", 401);
  if (user.role !== "CHILD") return jsonError("این درخواست فقط از پنل کودک ثبت می‌شود.", 403);

  const body = await readJson<{ moduleKey?: string; note?: string }>(request);
  const moduleKey = (body?.moduleKey ?? "").trim();

  if (moduleKey === PLAN_UPGRADE_KEY) {
    const requestedPlan = (body?.note ?? "").trim() as PlanTier;
    if (!PLANS[requestedPlan]) return jsonError("پلن درخواستی معتبر نیست.");
    if (PLAN_RANK[requestedPlan] <= PLAN_RANK[user.plan]) {
      return jsonError("پلن درخواستی بالاتر از پلن فعلی نیست.");
    }

    const upgradeLimit = await rateLimit(`approval-request:${user.id}`, 5, 3600);
    if (!upgradeLimit.ok) return jsonError("تعداد درخواست‌هایت زیاد شده؛ کمی بعد دوباره تلاش کن.", 429);

    const pendingUpgrade = await db.approvalRequest.findFirst({
      where: { childId: user.id, moduleKey: PLAN_UPGRADE_KEY, status: "PENDING" },
      select: { id: true },
    });
    if (pendingUpgrade) return Response.json({ ok: true, status: "PENDING", requestId: pendingUpgrade.id, repeated: true });

    const guardians = await guardianAccountsOf(user.id);
    const created = await db.approvalRequest.create({
      data: { childId: user.id, moduleKey: PLAN_UPGRADE_KEY, note: requestedPlan, guardianId: guardians[0]?.id ?? null },
      select: { id: true },
    });
    for (const guardian of guardians) {
      await notify({
        userId: guardian.id,
        title: `درخواست ارتقای پلن از سوی ${user.name} 💳`,
        body: `${user.name} می‌خواهد پلنش به «${PLANS[requestedPlan].title}» ارتقا پیدا کند. از پنل والدین تأیید یا رد کن.`,
        href: "/parent",
      });
    }
    await logAudit({
      actorId: user.id,
      action: "plan.upgrade.request",
      entity: "ApprovalRequest",
      entityId: created.id,
      detail: `${requestedPlan}${guardians.length ? ` · اطلاع به ${guardians.length} والد` : ""}`,
    });
    return Response.json(
      { ok: true, status: "PENDING", requestId: created.id, guardiansInformed: guardians.length },
      { status: 201 },
    );
  }

  const module = MODULE_MAP[moduleKey];
  if (!module || !isParentApprovalModule(moduleKey)) {
    return jsonError("این ماژول با تأیید والدین تغییر نمی‌کند.", 400);
  }

  const global = await getGlobalSettings();
  if (!(global[moduleKey] ?? module.defaultEnabled)) {
    return jsonError("این بخش فعلاً توسط مدیر بازارچه خاموش شده است.", 403);
  }

  if (await isModuleEnabled(moduleKey, user)) {
    return Response.json({ ok: true, status: "APPROVED", already: true });
  }

  const limit = await rateLimit(`approval-request:${user.id}`, 5, 3600);
  if (!limit.ok) return jsonError("تعداد درخواست‌هایت زیاد شده؛ کمی بعد دوباره تلاش کن.", 429);

  const note = (body?.note ?? "").trim().slice(0, 200) || null;

  const pending = await db.approvalRequest.findFirst({
    where: { childId: user.id, moduleKey, status: "PENDING" },
    select: { id: true, createdAt: true },
  });
  if (pending) {
    return Response.json({ ok: true, status: "PENDING", requestId: pending.id, repeated: true });
  }

  const guardians = await guardianAccountsOf(user.id);
  const created = await db.approvalRequest.create({
    data: {
      childId: user.id,
      moduleKey,
      note,
      guardianId: guardians[0]?.id ?? null,
    },
    select: { id: true, createdAt: true },
  });

  for (const guardian of guardians) {
    await notify({
      userId: guardian.id,
      title: `درخواست اجازهٔ ${user.name} 🛡️`,
      body: `${user.name} می‌خواهد «${module.title}» برایش روشن شود. از پنل والدین تأیید یا رد کن.`,
      href: "/parent",
    });
  }

  await logAudit({
    actorId: user.id,
    action: "approval.request",
    entity: "ApprovalRequest",
    entityId: created.id,
    detail: `${moduleKey}${guardians.length ? ` · اطلاع به ${guardians.length} والد` : ""}`,
  });

  return Response.json(
    {
      ok: true,
      status: "PENDING",
      requestId: created.id,
      guardiansInformed: guardians.length,
      contactedGuardians: guardians.map((guardian) => guardian.name),
    },
    { status: 201 },
  );
}
