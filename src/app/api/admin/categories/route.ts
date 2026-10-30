import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return jsonError("دسترسی ندارید.", 403);

  const body = await readJson<{ title?: string; emoji?: string; tint?: string }>(request);
  const title = (body?.title ?? "").trim();
  if (title.length < 2) return jsonError("عنوان دسته را وارد کن.");

  const emoji = (body?.emoji ?? "🎁").trim().slice(0, 4) || "🎁";
  const tint = /^#[0-9a-fA-F]{6}$/.test(body?.tint ?? "") ? body!.tint! : "#e2e8f0";
  const slug = `cat-${Date.now().toString(36)}`;
  const max = await db.category.aggregate({ _max: { sort: true } });
  const category = await db.category.create({
    data: { title, emoji, tint, slug, sort: (max._max.sort ?? 0) + 1 },
  });
  await logAudit({ actorId: user.id, action: "category.create", entity: "Category", entityId: category.id, detail: title });
  return Response.json({ category }, { status: 201 });
}
