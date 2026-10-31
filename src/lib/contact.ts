import { db } from "./db";
import { CONSENT_AGE, ageFrom } from "./age";
import { isModuleEnabled, type ModuleUser } from "./module-service";
import { faNum } from "./format";

export type ContactPerson = { name: string; email: string; phone?: string | null };

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "•••";
  const [local, domain] = email.split("@");
  return `${local.charAt(0)}•••@${domain}`;
}

export function isMinor(birthDate: Date | string | null | undefined): boolean {
  return ageFrom(birthDate) < CONSENT_AGE;
}

export function isAdult(birthDate: Date | string | null | undefined): boolean {
  return ageFrom(birthDate) >= 18;
}

/** والدین یک کاربر کودک: از رابطهٔ parentId یا ایمیل ثبت‌شده در رکورد رضایت. */
export async function guardiansOf(userId: string): Promise<ContactPerson[]> {
  const consent = await db.consent.findUnique({
    where: { childId: userId },
    include: { child: { select: { parent: { select: { id: true, name: true, email: true, phone: true } } } } },
  });
  const people: ContactPerson[] = [];
  const parent = consent?.child.parent;
  if (parent) people.push({ name: parent.name, email: parent.email, phone: parent.phone });
  const consentEmail = consent?.parentEmail?.toLowerCase() ?? "";
  const alreadyListed = consentEmail
    ? people.some((person) => person.email.toLowerCase() === consentEmail)
    : false;
  // ایمیل والدین اختیاری است؛ اگر ایمیل نباشد، همان موبایل والدین راه تماس می‌شود.
  if (consent && (consent.parentEmail || consent.parentPhone) && !alreadyListed) {
    people.push({
      name: consent.parentName || "والد یا سرپرست",
      email: consent.parentEmail,
      phone: consent.parentPhone,
    });
  }
  return people;
}

export type SenderContact = { email: string | null; phone: string | null; guardians: ContactPerson[] };

/**
 * اطلاعات ارتباطی پیام‌دهنده: برای بزرگسال ایمیل/موبایل خودش و برای کودک، راه تماس والدین.
 * اطلاعات شخصی کودک هرگز به‌عنوان راه تماس استفاده نمی‌شود.
 */
export async function senderContactInfo(user: {
  id: string;
  email: string;
  phone?: string | null;
  birthDate?: Date | string | null;
}, override?: { email?: string; phone?: string }): Promise<SenderContact> {
  if (isMinor(user.birthDate)) {
    const guardians = await guardiansOf(user.id);
    return {
      email: guardians[0]?.email || null,
      phone: guardians[0]?.phone ?? null,
      guardians,
    };
  }
  return {
    email: override?.email?.trim() || user.email,
    phone: override?.phone?.trim() || user.phone?.trim() || null,
    guardians: [],
  };
}

/** آیا این کاربر مجاز است اطلاعات تماس را ببیند؟ بزرگسال‌ها آزاد، کودکان با تأیید والدین (ماژول messageContact). */
export async function canSeeContactInfo(user: ModuleUser): Promise<boolean> {
  if (!user) return false;
  if (user.role !== "CHILD") return true;
  return isModuleEnabled("messageContact", user);
}

/** راه‌های تماس قابل‌نمایش برای یک سازنده؛ اطلاعات شخصی فقط برای سازندگان بزرگسال. */
export async function sellerContactInfo(sellerId: string) {
  const seller = await db.user.findUnique({
    where: { id: sellerId },
    select: { id: true, name: true, email: true, phone: true, birthDate: true, consent: { select: { status: true } } },
  });
  if (!seller) return null;
  const minor = isMinor(seller.birthDate) || seller.consent?.status !== "NOT_REQUIRED";
  const adult = isAdult(seller.birthDate) && seller.consent?.status === "NOT_REQUIRED";
  const guardians = minor ? await guardiansOf(seller.id) : [];
  return {
    sellerId: seller.id,
    name: seller.name,
    minor,
    guardians,
    /** فقط برای سازندهٔ بزرگسال: ایمیل/تلفن به‌صورت نیمه‌پوشیده نمایش داده می‌شود. */
    direct: adult ? { email: seller.email, phone: seller.phone } : null,
  };
}

export function contactChannelLabel(channel: string): string {
  if (channel === "CALLBACK") return "درخواست تماس تلفنی";
  if (channel === "EMAIL") return "درخواست هماهنگی ایمیلی";
  return "پیام درون بازارچه";
}

export function guardianHint(guardians: ContactPerson[]): string {
  if (guardians.length === 0) return "";
  const first = guardians[0];
  const reach = first.email ? maskEmail(first.email) : first.phone ?? "راه تماس ثبت‌شده";
  return `نسخهٔ این پیام برای ${first.name} (${reach}) ارسال می‌شود`;
}

export function quotaHint(count: number): string {
  return `تا ${faNum(5 - count)} پیام دیگر در این ساعت می‌توانی بفرستی.`;
}
