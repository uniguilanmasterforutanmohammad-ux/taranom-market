const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** رقم‌های فارسی/عربی و نویسه‌های اضافه را پاک می‌کند و فقط رقم لاتین می‌گذارد. */
export function normalizePhone(value: string | null | undefined): string {
  if (!value) return "";
  let out = "";
  for (const char of String(value)) {
    const fa = FA_DIGITS.indexOf(char);
    if (fa > -1) {
      out += String(fa);
      continue;
    }
    const ar = AR_DIGITS.indexOf(char);
    if (ar > -1) {
      out += String(ar);
      continue;
    }
    if (char >= "0" && char <= "9") out += char;
  }
  return out;
}

/** شمارهٔ موبایل را به شکل استاندارد `09xxxxxxxxx` برمی‌گرداند؛ نامعتبر → رشتهٔ خالی. */
export function canonicalPhone(value: string | null | undefined): string {
  const digits = normalizePhone(value);
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return /^09\d{9}$/.test(digits) ? digits : "";
}

export function isValidMobile(value: string | null | undefined): boolean {
  return canonicalPhone(value).length === 11;
}

export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const first = canonicalPhone(a);
  const second = canonicalPhone(b);
  return Boolean(first) && first === second;
}
