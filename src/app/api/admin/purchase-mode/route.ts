import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { getGlobalSettings, setGlobalModule } from "@/lib/module-service";
import { PURCHASE_MODULE_KEYS } from "@/lib/modules";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return jsonError("دسترسی ندارید.", 403);

  const body = await readJson<{ enabled?: boolean }>(request);
  if (typeof body?.enabled !== "boolean") return jsonError("درخواست نامعتبر.");

  for (const key of PURCHASE_MODULE_KEYS) {
    await setGlobalModule(key, body.enabled);
  }

  const settings = await getGlobalSettings();
  await logAudit({
    actorId: user.id,
    action: body.enabled ? "purchase.enable" : "purchase.disable",
    entity: "Module",
    entityId: PURCHASE_MODULE_KEYS.join(","),
    detail: body.enabled ? "فعال‌سازی خرید آنلاین" : "غیرفعال‌سازی خرید آنلاین (حالت معرفی سازنده)",
  });

  return Response.json({
    ok: true,
    enabled: body.enabled,
    modules: PURCHASE_MODULE_KEYS.map((key) => ({ key, enabled: settings[key] })),
  });
}
