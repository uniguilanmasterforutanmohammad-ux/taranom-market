import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { clientIp, jsonError, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const limit = await rateLimit(`login:${clientIp(request)}`, 20, 60);
  if (!limit.ok) return jsonError("تلاش‌های ورود زیاد بود. یک دقیقه صبر کن.", 429);

  const body = await readJson<{ email?: string; password?: string }>(request);
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";
  if (!email || !password) return jsonError("ایمیل و رمز عبور را وارد کن.");

  const user = await db.user.findUnique({ where: { email } });
  // پروفایل‌های تحت مدیریت والدین رمز قابل‌استفاده ندارند و ورودشان مسدود است.
  if (!user || user.managedByGuardian || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("ایمیل یا رمز عبور درست نیست.", 401);
  }

  await createSession(user);
  await logAudit({ actorId: user.id, action: "user.login", entity: "User", entityId: user.id });

  return Response.json({
    user: { id: user.id, name: user.name, role: user.role },
    redirectTo: user.role === "ADMIN" ? "/admin" : user.role === "PARENT" ? "/parent" : "/dashboard",
  });
}
