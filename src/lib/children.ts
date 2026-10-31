import { db } from "./db";
import { hashPassword } from "./auth";
import { CONSENT_AGE, ageFrom } from "./age";
import { canonicalPhone, normalizePhone, phonesMatch } from "./phone";
import type { Role } from "./modules";

/** دامنهٔ داخلی ایمیل پروفایل‌های تحت مدیریت والدین؛ هیچ‌وقت به کاربر نمایش داده نمی‌شود. */
export const MANAGED_EMAIL_DOMAIN = "children.javaneh.local";

export function isManagedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${MANAGED_EMAIL_DOMAIN}`);
}

/** ایمیل نمادین و غیرقابل‌حدس برای پروفایل کودکی که خودش وارد سایت نمی‌شود. */
function managedChildEmail(): string {
  return `managed-${crypto.randomUUID()}@${MANAGED_EMAIL_DOMAIN}`;
}

type Guardian = { id: string; name: string; email: string; phone?: string | null };

export const MANAGED_CHILD_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6"];

/**
 * ساخت پروفایل کودک توسط والدین: بدون ایمیل/موبایل واقعی کودک، بدون رمز قابل‌استفاده
 * و با رضایت خودکار والد (چون خودِ والد صاحب حساب و سرپرست است).
 */
export async function createManagedChild(
  parent: Guardian,
  input: { name: string; birthDate: Date; bio?: string | null },
) {
  const email = managedChildEmail();
  const passwordHash = await hashPassword(crypto.randomUUID());
  const color = MANAGED_CHILD_COLORS[Math.floor(Math.random() * MANAGED_CHILD_COLORS.length)];

  return db.$transaction(async (tx) => {
    const child = await tx.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        role: "CHILD",
        birthDate: input.birthDate,
        bio: input.bio?.trim() ? input.bio.trim().slice(0, 300) : null,
        avatarColor: color,
        plan: "FREE",
        parentId: parent.id,
        managedByGuardian: true,
      },
    });
    await tx.consent.create({
      data: {
        childId: child.id,
        parentName: parent.name,
        parentEmail: parent.email.toLowerCase(),
        parentPhone: parent.phone ?? null,
        status: "APPROVED",
        method: "guardian",
        approvedAt: new Date(),
      },
    });
    return child;
  });
}

/** پیدا کردن حساب والدین از روی ایمیل یا موبایل (برای وصل‌کردن خودکار فرزند به والد). */
export async function findGuardianAccountBy(contact: { email?: string | null; phone?: string | null }) {
  const email = contact.email?.trim().toLowerCase() ?? "";
  if (email) {
    const byEmail = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (byEmail && (byEmail.role === "PARENT" || byEmail.role === "ADMIN")) return byEmail;
  }
  const phone = canonicalPhone(contact.phone);
  if (!phone) return null;
  const candidates = await db.user.findMany({
    where: { role: { in: ["PARENT", "ADMIN"] }, phone: { not: null } },
    select: { id: true, name: true, email: true, phone: true, role: true },
    take: 200,
  });
  return candidates.find((account) => phonesMatch(account.phone, phone)) ?? null;
}

/** شرط «فرزندان یک حساب والد» برای استفادهٔ دوباره در کوئری‌ها (ایمیل یا موبایل رکورد رضایت). */
export function childrenWhere(parent: { id: string; role: Role; email: string; phone?: string | null }) {
  if (parent.role === "ADMIN") return { role: "CHILD" as const };
  const phones = [...new Set([parent.phone ?? "", normalizePhone(parent.phone), canonicalPhone(parent.phone)])].filter(Boolean);
  const links: Record<string, unknown>[] = [
    { parentId: parent.id },
    { consent: { parentEmail: parent.email.toLowerCase() } },
  ];
  if (phones.length) links.push({ consent: { parentPhone: { in: phones } } });
  return {
    role: "CHILD" as const,
    OR: links,
  };
}

/**
 * دسترسی والد به یک کودک: یا رابطهٔ parentId، یا ایمیل/موبایل ثبت‌شده در رکورد رضایت.
 * رضایت لغوشده اجازهٔ کار جدید نمی‌دهد. مدیر همیشه دسترسی دارد.
 */
export async function requireChildAccess(
  guardian: { id: string; role: Role; email: string; phone?: string | null },
  childId: string,
) {
  const child = await db.user.findUnique({ where: { id: childId }, include: { consent: true } });
  if (!child || child.role !== "CHILD") return null;
  if (guardian.role === "ADMIN") return child;
  if (guardian.role !== "PARENT") return null;
  if (child.parentId === guardian.id) return child;
  const consents = await db.consent.findMany({
    where: { childId, status: { not: "REVOKED" } },
    select: { parentEmail: true, parentPhone: true },
  });
  const email = guardian.email.toLowerCase();
  const matched = consents.some(
    (consent) => consent.parentEmail.toLowerCase() === email || phonesMatch(consent.parentPhone, guardian.phone),
  );
  return matched ? child : null;
}

/** کودک زیر ۱۳ سال باید تأیید والدین بگیرد (هم برای رضایت، هم برای انتشار محصول). */
export function requiresGuardianApproval(user: { birthDate?: Date | null }): boolean {
  return ageFrom(user.birthDate) < CONSENT_AGE;
}

/**
 * وضعیت اولیهٔ محصول:
 * - ثبت با حساب والدین (به‌جای فرزند) مستقیم به صف بازبینی ادمین می‌رود.
 * - ثبت توسط خودِ کودک زیر ۱۳ سال اول منتظر تأیید والدین می‌ماند.
 */
export function initialProductStatus(
  owner: { birthDate?: Date | null },
  options: { viaGuardian: boolean },
): "PENDING" | "AWAITING_PARENT" {
  if (options.viaGuardian) return "PENDING";
  return requiresGuardianApproval(owner) ? "AWAITING_PARENT" : "PENDING";
}
