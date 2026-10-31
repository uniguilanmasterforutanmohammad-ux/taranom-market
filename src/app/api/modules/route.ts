import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { getGlobalSettings, getModuleStates, setGlobalModule, setUserModule } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { logAudit } from "@/lib/audit";
import { isGuardianOf } from "@/lib/approval";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  const [states, global] = await Promise.all([getModuleStates(user), getGlobalSettings()]);
  return Response.json({
    global,
    modules: states.map((state) => ({
      key: state.module.key,
      enabled: state.enabled,
      reason: state.reason ?? null,
      source: state.source,
    })),
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  const body = await readJson<{ scope?: string; moduleKey?: string; enabled?: boolean; userId?: string }>(request);
  if (!body?.moduleKey || typeof body.enabled !== "boolean") return jsonError("درخواست نامعتبر.");
  const module = MODULE_MAP[body.moduleKey];
  if (!module) return jsonError("ماژول ناشناخته.", 404);

  try {
    if (body.scope === "global") {
      if (user.role !== "ADMIN") return jsonError("فقط مدیر می‌تواند وضعیت کلی ماژول را تغییر دهد.", 403);
      await setGlobalModule(module.key, body.enabled);
      await logAudit({
        actorId: user.id,
        action: body.enabled ? "module.global.enable" : "module.global.disable",
        entity: "Module",
        entityId: module.key,
      });
      return Response.json({ ok: true, scope: "global", moduleKey: module.key, enabled: body.enabled });
    }

    let targetId = user.id;
    if (body.userId && body.userId !== user.id) {
      const target = await db.user.findUnique({ where: { id: body.userId } });
      if (!target) return jsonError("کاربر پیدا نشد.", 404);
      const isGuardian =
        user.role === "ADMIN" ||
        (user.role === "PARENT" && (target.parentId === user.id || (await isGuardianOf(user, target.id))));
      if (!isGuardian) return jsonError("فقط والدین یا مدیر می‌توانند ماژول این کاربر را تغییر دهند.", 403);
      targetId = target.id;
    }

    if (module.parentApproval && user.role === "CHILD" && targetId === user.id) {
      return jsonError("این کلید فقط با تأیید والدین تغییر می‌کند.", 403);
    }

    await setUserModule(targetId, module.key, body.enabled);
    await logAudit({
      actorId: user.id,
      action: body.enabled ? "module.user.enable" : "module.user.disable",
      entity: "UserModule",
      entityId: `${targetId}:${module.key}`,
    });
    return Response.json({ ok: true, scope: "user", moduleKey: module.key, enabled: body.enabled });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "تغییر وضعیت ناموفق بود.", 400);
  }
}
