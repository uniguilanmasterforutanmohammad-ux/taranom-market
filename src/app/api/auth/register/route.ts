import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { clientIp, jsonError, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { ageFrom } from "@/lib/age";
import { logAudit, notify } from "@/lib/audit";

type Body = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  birthDate?: string;
  parentEmail?: string;
  parentName?: string;
  parentPhone?: string;
};

export async function POST(request: Request) {
  const limit = await rateLimit(`register:${clientIp(request)}`, 10, 60);
  if (!limit.ok) return jsonError("درخواست‌های زیادی فرستاده شد. کمی بعد تلاش کن.", 429);

  const body = await readJson<Body>(request);
  if (!body) return jsonError("دادهٔ نامعتبر.");

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role === "PARENT" ? "PARENT" : "CHILD";

  if (name.length < 2) return jsonError("نام را کامل وارد کن.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("ایمیل معتبر نیست.");
  if (password.length < 8) return jsonError("رمز عبور باید حداقل ۸ کاراکتر باشد.");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return jsonError("این ایمیل قبلاً ثبت شده است.", 409);

  let birthDate: Date | null = null;
  let parentEmail = "";
  let parentName = "";
  let parentPhone = "";

  if (role === "CHILD") {
    if (!body.birthDate) return jsonError("تاریخ تولد برای ساخت حساب کودک لازم است.");
    birthDate = new Date(body.birthDate);
    if (Number.isNaN(birthDate.getTime())) return jsonError("تاریخ تولد معتبر نیست.");
    if (ageFrom(birthDate) > 100) return jsonError("تاریخ تولد معتبر نیست.");
    if (ageFrom(birthDate) < 13) {
      parentEmail = (body.parentEmail ?? "").trim().toLowerCase();
      parentName = (body.parentName ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
        return jsonError("برای کاربران زیر ۱۳ سال، ایمیل والدین لازم است.");
      }
      if (parentName.length < 2) return jsonError("نام والدین را وارد کنید.");
      parentPhone = (body.parentPhone ?? "").trim().slice(0, 20);
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      birthDate,
      plan: "FREE",
      avatarColor: role === "PARENT" ? "#c2410c" : "#16a34a",
    },
  });

  if (role === "CHILD" && birthDate) {
    const needsConsent = ageFrom(birthDate) < 13;
    const parent = needsConsent ? await db.user.findUnique({ where: { email: parentEmail } }) : null;
    await db.consent.create({
      data: {
        childId: user.id,
        parentName: needsConsent ? parentName : "",
        parentEmail: needsConsent ? parentEmail : "",
        parentPhone: needsConsent ? parentPhone || null : null,
        status: needsConsent ? "PENDING" : "NOT_REQUIRED",
        method: needsConsent ? "email" : "self",
      },
    });
    if (needsConsent && parent) {
      await db.user.update({ where: { id: user.id }, data: { parentId: parent.id } });
      await notify({
        userId: parent.id,
        title: "درخواست رضایت جدید",
        body: `برای حساب ${name} رضایت والدین لازم است. از پنل والدین تأیید کنید.`,
        href: "/parent",
      });
    }
    if (!needsConsent) {
      await db.user.update({ where: { id: user.id }, data: { parentId: null } });
    }
  }

  if (role === "PARENT") {
    const pending = await db.consent.findMany({ where: { parentEmail: email, status: "PENDING" } });
    for (const consent of pending) {
      await db.user.update({ where: { id: consent.childId }, data: { parentId: user.id } });
      await db.consent.update({ where: { id: consent.id }, data: { parentName: name, status: "APPROVED", approvedAt: new Date() } });
      await notify({
        userId: consent.childId,
        title: "رضایت والدین تأیید شد ✅",
        body: "حساب شما حالا می‌تواند محصول ثبت کند.",
        href: "/dashboard/products/new",
      });
    }
  }

  await logAudit({ actorId: user.id, action: "user.register", entity: "User", entityId: user.id, detail: `نقش: ${role}` });
  await createSession(user);

  return Response.json({
    user: { id: user.id, name: user.name, role: user.role },
    redirectTo: role === "PARENT" ? "/parent" : "/dashboard",
  });
}
