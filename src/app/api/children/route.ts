import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { ageFrom } from "@/lib/age";
import { logAudit, notify } from "@/lib/audit";
import { createManagedChild, isManagedEmail } from "@/lib/children";

type Body = { name?: string; birthDate?: string; bio?: string };

/**
 * ساخت پروفایل کودک تحت مدیریت والدین.
 * برای خانواده‌هایی که نمی‌خواهند یا نمی‌توانند به کودک دسترسی اینترنت بدهند؛
 * همهٔ کارها (ثبت محصول، پیام، خرید) بعداً با همین حساب والد انجام می‌شود.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);
  if (user.role !== "PARENT") return jsonError("این کار فقط از حساب والدین انجام می‌شود.", 403);

  const limit = await rateLimit(`child-create:${user.id}`, 10, 3600);
  if (!limit.ok) return jsonError("تعداد ساخت پروفایل زیاد بود. کمی بعد تلاش کن.", 429);

  const body = await readJson<Body>(request);
  if (!body) return jsonError("دادهٔ نامعتبر.");

  const name = (body.name ?? "").trim();
  if (name.length < 2) return jsonError("نام فرزند را کامل وارد کن.");
  if (name.length > 60) return jsonError("نام فرزند خیلی بلند است.");

  const birthDate = body.birthDate ? new Date(body.birthDate) : null;
  if (!birthDate || Number.isNaN(birthDate.getTime())) return jsonError("تاریخ تولد فرزند لازم است.");
  const age = ageFrom(birthDate);
  if (age > 100) return jsonError("تاریخ تولد معتبر نیست.");
  if (age >= 18) return jsonError("پروفایل تحت مدیریت والدین فقط برای فرزندان زیر ۱۸ سال است.");

  const child = await createManagedChild(user, { name, birthDate, bio: body.bio ?? null });

  await Promise.all([
    logAudit({
      actorId: user.id,
      action: "child.managed.create",
      entity: "User",
      entityId: child.id,
      detail: `پروفایل تحت مدیریت والدین: ${name}`,
    }),
    notify({
      userId: user.id,
      title: "پروفایل فرزند ساخته شد 👶",
      body: `از این به بعد می‌توانی همهٔ کارهای «${name}» را با حساب خودت انجام بدهی؛ او نیازی به ورود به سایت ندارد.`,
      href: `/parent/children/${child.id}`,
    }),
  ]);

  return Response.json(
    {
      child: { id: child.id, name: child.name, managedByGuardian: true, emailIsSynthetic: isManagedEmail(child.email) },
      redirectTo: `/parent/children/${child.id}`,
    },
    { status: 201 },
  );
}
