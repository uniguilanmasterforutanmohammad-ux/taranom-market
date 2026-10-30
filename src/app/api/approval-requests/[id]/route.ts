import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { setUserModule } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { logAudit, notify } from "@/lib/audit";
import { isGuardianOf, isParentApprovalModule } from "@/lib/approval";

/** تأیید یا رد درخواست کودک توسط والدین؛ نتیجه بلافاصله روی کلید ماژول فرزند اعمال می‌شود. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  if (user.role === "CHILD") return jsonError("فقط والدین می‌توانند به این درخواست پاسخ بدهند.", 403);

  const { id } = await context.params;
  const body = await readJson<{ status?: string; enabled?: boolean; note?: string }>(request);
  const approve =
    body?.status === "APPROVED" ? true : body?.status === "DENIED" ? false : typeof body?.enabled === "boolean" ? body.enabled : null;
  if (approve === null) return jsonError("وضعیت درخواست مشخص نیست.");

  const approval = await db.approvalRequest.findUnique({
    where: { id },
    select: { id: true, childId: true, moduleKey: true, status: true, child: { select: { name: true } } },
  });
  if (!approval) return jsonError("درخواست پیدا نشد.", 404);
  if (!isParentApprovalModule(approval.moduleKey)) return jsonError("این ماژول با تأیید والدین تغییر نمی‌کند.", 400);

  if (user.role !== "ADMIN" && !(await isGuardianOf(user, approval.childId))) {
    return jsonError("شما والد این کاربر نیستید.", 403);
  }
  if (approval.status !== "PENDING") {
    return jsonError("این درخواست قبلاً پاسخ داده شده است.", 409);
  }

  await setUserModule(approval.childId, approval.moduleKey, approve);
  const updated = await db.approvalRequest.update({
    where: { id },
    data: {
      status: approve ? "APPROVED" : "DENIED",
      respondedAt: new Date(),
      guardianId: user.role === "ADMIN" ? undefined : user.id,
    },
    select: { id: true, status: true },
  });

  const moduleTitle = MODULE_MAP[approval.moduleKey]?.title ?? approval.moduleKey;
  await notify({
    userId: approval.childId,
    title: approve ? "اجازه گرفتی! 🎉" : "درخواستت فعلاً تأیید نشد",
    body: approve
      ? `«${moduleTitle}» با تأیید والدین برایت روشن شد.`
      : `«${moduleTitle}» تأیید نشد. می‌توانی با والدینت صحبت کنی.`,
    href: "/dashboard/messages",
  });

  await logAudit({
    actorId: user.id,
    action: approve ? "approval.approve" : "approval.deny",
    entity: "ApprovalRequest",
    entityId: updated.id,
    detail: `${approval.moduleKey} برای ${approval.child.name}`,
  });

  return Response.json({ ok: true, status: updated.status, moduleKey: approval.moduleKey, enabled: approve });
}
