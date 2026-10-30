const faNumber = new Intl.NumberFormat("fa-IR");
const faDate = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function faNum(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return faNumber.format(num);
}

export function toman(value: number): string {
  if (value === 0) return "رایگان";
  return `${faNum(value)} تومان`;
}

export function faDateLabel(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return faDate.format(date);
}

export function priceShort(value: number): string {
  if (value >= 1_000_000) return `${faNum(Math.round(value / 100_000) / 10)} میلیون`;
  if (value >= 1_000) return `${faNum(Math.round(value / 1_000))} هزار`;
  return faNum(value);
}

export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  PHYSICAL: "فیزیکی",
  SERVICE: "خدماتی",
  DIGITAL: "مجازی",
};

export const PRODUCT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  PENDING: "در انتظار تأیید",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PREPARING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغوشده",
};

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
