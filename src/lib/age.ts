export const CONSENT_AGE = 13;

export function ageFrom(birthDate: Date | string | null | undefined): number {
  if (!birthDate) return 18;
  const date = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(date.getTime())) return 18;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age -= 1;
  return Math.max(0, age);
}

export function needsParentalConsent(birthDate: Date | string | null | undefined): boolean {
  return ageFrom(birthDate) < CONSENT_AGE;
}

export function ageLabel(birthDate: Date | string | null | undefined): string {
  const age = ageFrom(birthDate);
  if (age < 6) return "نوپا";
  if (age < 13) return `${age} ساله`;
  if (age < 18) return `${age} ساله`;
  return "بزرگسال";
}
