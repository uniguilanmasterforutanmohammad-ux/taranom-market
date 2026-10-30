export type Role = "CHILD" | "PARENT" | "ADMIN";
export type PlanTier = "FREE" | "STARTER" | "PRO";
export type ModulePhase = 1 | 2;
export type ModuleGroup = "core" | "trust" | "commerce" | "growth";

export type ModuleDefinition = {
  key: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  group: ModuleGroup;
  phase: ModulePhase;
  defaultEnabled: boolean;
  locked?: boolean;
  adminOnly?: boolean;
  /** برای کاربران کودک، روشن‌شدن نیازمند تأیید والدین در پنل والدین است. */
  parentApproval?: boolean;
  roles?: Role[];
  minPlan?: PlanTier;
  route?: string;
};

export const PLAN_RANK: Record<PlanTier, number> = { FREE: 0, STARTER: 1, PRO: 2 };

export const PLANS: Record<
  PlanTier,
  {
    title: string;
    price: number;
    productLimit: number;
    color: string;
    emoji: string;
    perks: string[];
  }
> = {
  FREE: {
    title: "جوانه",
    price: 0,
    productLimit: 2,
    color: "#0f766e",
    emoji: "🌱",
    perks: ["ساخت پروفایل فروشنده", "انتشار ۲ محصول", "بازبینی رایگان محتوا"],
  },
  STARTER: {
    title: "جوانه‌زن",
    price: 99000,
    productLimit: 10,
    color: "#16a34a",
    emoji: "🌿",
    perks: ["انتشار ۱۰ محصول", "آمار بازدید و فروش", "نشان فروشندهٔ فعال"],
  },
  PRO: {
    title: "درخت‌سایه‌دار",
    price: 249000,
    productLimit: 50,
    color: "#c2410c",
    emoji: "🌳",
    perks: ["انتشار ۵۰ محصول", "نمایش برجسته در صفحهٔ اول", "گزارش تحلیلی کامل"],
  },
};

export const MODULES: ModuleDefinition[] = [
  {
    key: "marketplace",
    title: "ویترین بازارچه",
    short: "نمایش و کشف محصولات تأییدشده",
    description: "صفحهٔ اصلی، جست‌وجو، دسته‌بندی و صفحهٔ محصول. ستون اصلی بازارچه است و همیشه روشن می‌ماند.",
    icon: "Store",
    group: "core",
    phase: 1,
    defaultEnabled: true,
    locked: true,
    route: "/explore",
  },
  {
    key: "productUpload",
    title: "آپلود محصول",
    short: "ثبت محصول در سه دستهٔ فیزیکی، خدماتی و مجازی",
    description: "فرم چندمرحله‌ای ثبت محصول با تصویر، قیمت نمایشی، برچسب و دسته‌بندی. سقف تعداد محصول به پلن اشتراک وابسته است.",
    icon: "PackagePlus",
    group: "core",
    phase: 1,
    defaultEnabled: true,
    route: "/dashboard/products/new",
  },
  {
    key: "moderation",
    title: "بازبینی و تأیید محتوا",
    short: "صف بررسی انسانی پیش از انتشار",
    description: "ادمین هر محصول را از نظر ایمنی، تناسب سنی و کیفیت بررسی و تأیید یا رد می‌کند. هیچ محصولی بدون تأیید منتشر نمی‌شود.",
    icon: "ShieldCheck",
    group: "trust",
    phase: 1,
    defaultEnabled: true,
    locked: true,
    adminOnly: true,
    route: "/admin/moderation",
  },
  {
    key: "parentalConsent",
    title: "رضایت والدین",
    short: "درگاه سنی و رضایت قابل‌راستی‌آزمایی",
    description: "برای کاربران زیر ۱۳ سال، ثبت‌نام بدون تأیید والدین کامل نمی‌شود و هرگونه انتشار محصول تا دریافت رضایت مسدود است.",
    icon: "HeartHandshake",
    group: "trust",
    phase: 1,
    defaultEnabled: true,
    locked: true,
  },
  {
    key: "parentPanel",
    title: "پنل والدین",
    short: "نظارت، تأیید و مدیریت حریم خصوصی",
    description: "والدین فعالیت فرزند، وضعیت رضایت، اشتراک و کلیدهای ماژول‌های فعال برای فرزند را مدیریت می‌کنند.",
    icon: "Users",
    group: "trust",
    phase: 1,
    defaultEnabled: true,
    roles: ["PARENT", "ADMIN"],
    route: "/parent",
  },
  {
    key: "subscriptions",
    title: "اشتراک ماهانه",
    short: "درآمد پایدار و سقف آپلود بیشتر",
    description: "خرید و تمدید پلن‌های جوانه، جوانه‌زن و درخت‌سایه‌دار با صورتحساب ماهانه و یادآور تمدید.",
    icon: "Crown",
    group: "growth",
    phase: 1,
    defaultEnabled: true,
    route: "/dashboard/subscription",
  },
  {
    key: "analytics",
    title: "گزارش و آمار",
    short: "بازدید، فروش و عملکرد محصولات",
    description: "داشبورد تحلیلی فروشنده و گزارش‌های مدیریتی برای تصمیم‌گیری بر اساس داده.",
    icon: "BarChart3",
    group: "growth",
    phase: 1,
    defaultEnabled: true,
    minPlan: "STARTER",
    route: "/dashboard/analytics",
  },
  {
    key: "reviews",
    title: "امتیاز و نظر",
    short: "اعتمادسازی با بازخورد خریداران",
    description: "ثبت امتیاز و نظر پس از تحویل، با بازبینی محتوا پیش از انتشار.",
    icon: "Star",
    group: "growth",
    phase: 1,
    defaultEnabled: true,
  },
  {
    key: "notifications",
    title: "اعلان‌ها",
    short: "اطلاع‌رسانی نتیجهٔ بررسی و سفارش",
    description: "اعلان درون‌برنامه‌ای برای نتیجهٔ تأیید محصول، تغییر وضعیت سفارش و تمدید اشتراک.",
    icon: "Bell",
    group: "core",
    phase: 1,
    defaultEnabled: true,
  },
  {
    key: "sellerContact",
    title: "ارتباط با سازنده",
    short: "پیام امن و راه‌های تماس با سازنده",
    description:
      "پس از خاموش‌شدن خرید آنلاین، کاربران می‌توانند از راه‌های امن با سازنده در ارتباط باشند. پیام فرستندهٔ زیر ۱۳ سال برای والدین او و (اگر سازنده کودک باشد) برای والدین سازنده هم ارسال می‌شود.",
    icon: "MessageCircle",
    group: "trust",
    phase: 1,
    defaultEnabled: true,
    route: "/dashboard/messages",
  },
  {
    key: "messageReply",
    title: "پاسخ به پیام",
    short: "جواب‌دادن به پیام‌های دریافتی",
    description:
      "کاربران می‌توانند به پیام دریافتی پاسخ بدهند و گفت‌وگو ادامه پیدا کند. برای کاربران زیر ۱۸ سال این قابلیت تا زمانی که والدین در پنل والدین روشن نکنند خاموش است.",
    icon: "Reply",
    group: "trust",
    phase: 1,
    defaultEnabled: true,
    parentApproval: true,
    route: "/dashboard/messages",
  },
  {
    key: "messageContact",
    title: "نمایش اطلاعات تماس به فرزند",
    short: "نمایش ایمیل و موبایل پیام‌دهنده برای فرزند",
    description:
      "ایمیل و موبایل پیام‌دهنده همیشه ثبت و برای والدین نمایش داده می‌شود؛ نمایش آن به خود فرزند تنها با تأیید والدین فعال می‌شود.",
    icon: "ContactRound",
    group: "trust",
    phase: 1,
    defaultEnabled: true,
    parentApproval: true,
    route: "/dashboard/messages",
  },
  {
    key: "cart",
    title: "سبد خرید",
    short: "افزودن محصول تأییدشده به سبد",
    description: "سبد خرید کودک‌محور با امکان حذف آسان و نمایش شفاف مبلغ. بخشی از فاز ۲ تجارت.",
    icon: "ShoppingCart",
    group: "commerce",
    phase: 2,
    defaultEnabled: true,
    route: "/cart",
  },
  {
    key: "checkout",
    title: "پرداخت و تأیید والدین",
    short: "درگاه پرداخت داخلی با قفل والد",
    description: "پرداخت ساده با تأیید والدین برای تراکنش، ثبت اتمیک سفارش و جلوگیری از پرداخت تکراری.",
    icon: "CreditCard",
    group: "commerce",
    phase: 2,
    defaultEnabled: true,
    route: "/checkout",
  },
  {
    key: "orders",
    title: "مدیریت سفارش",
    short: "وضعیت سفارش و تحویل",
    description: "پیگیری وضعیت سفارش‌های فیزیکی، خدماتی و مجازی همراه با اطلاع‌رسانی به خریدار و فروشنده.",
    icon: "PackageCheck",
    group: "commerce",
    phase: 2,
    defaultEnabled: true,
    route: "/dashboard/orders",
  },
  {
    key: "payouts",
    title: "تسویه فروشنده",
    short: "محاسبهٔ درآمد پس از کسر کارمزد",
    description: "محاسبهٔ مبلغ فروش منهای کارمزد پلتفرم و درخواست تسویهٔ دوره‌ای.",
    icon: "Wallet",
    group: "commerce",
    phase: 2,
    defaultEnabled: true,
  },
];

export const MODULE_MAP: Record<string, ModuleDefinition> = Object.fromEntries(
  MODULES.map((module) => [module.key, module]),
);

/** ماژول‌هایی که با هم «خرید آنلاین» را می‌سازند؛ کلید ادمین همه را هم‌زمان خاموش/روشن می‌کند. */
export const PURCHASE_MODULE_KEYS = ["cart", "checkout", "orders", "payouts"] as const;

export const MODULE_GROUPS: { key: ModuleGroup; title: string; emoji: string }[] = [
  { key: "core", title: "هستهٔ بازارچه", emoji: "🧩" },
  { key: "trust", title: "اعتماد و ایمنی", emoji: "🛡️" },
  { key: "growth", title: "رشد و درآمد", emoji: "🌱" },
  { key: "commerce", title: "تجارت (فاز ۲)", emoji: "🛒" },
];

export type ModuleStateReason = "global-off" | "user-off" | "approval" | "plan" | "role" | "off";

export type ModuleState = {
  module: ModuleDefinition;
  enabled: boolean;
  reason?: ModuleStateReason;
  source: "locked" | "global" | "user" | "default";
};

export function evaluateModule(
  module: ModuleDefinition,
  options: {
    role?: Role;
    plan?: PlanTier;
    globalEnabled: boolean;
    userEnabled?: boolean | null;
  },
): ModuleState {
  const { role, plan = "FREE", globalEnabled, userEnabled } = options;
  if (module.adminOnly && role !== "ADMIN") {
    return { module, enabled: false, reason: "role", source: "global" };
  }
  if (module.roles && (!role || !module.roles.includes(role))) {
    return { module, enabled: false, reason: "role", source: "global" };
  }
  if (module.locked) {
    return { module, enabled: true, source: "locked" };
  }
  if (!globalEnabled) {
    return { module, enabled: false, reason: "global-off", source: "global" };
  }
  if (module.minPlan && PLAN_RANK[plan] < PLAN_RANK[module.minPlan]) {
    return { module, enabled: false, reason: "plan", source: "global" };
  }
  if (userEnabled === false) {
    return { module, enabled: false, reason: "user-off", source: "user" };
  }
  if (userEnabled === true) {
    return { module, enabled: true, source: "user" };
  }
  if (module.parentApproval && role === "CHILD") {
    return { module, enabled: false, reason: "approval", source: "user" };
  }
  return { module, enabled: module.defaultEnabled, source: "default", reason: module.defaultEnabled ? undefined : "off" };
}
