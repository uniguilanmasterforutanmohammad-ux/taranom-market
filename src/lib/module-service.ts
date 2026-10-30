import { db } from "./db";
import {
  MODULES,
  MODULE_MAP,
  PLANS,
  evaluateModule,
  type ModuleState,
  type PlanTier,
  type Role,
} from "./modules";
import { ageFrom } from "./age";

export type ModuleUser = { id: string; role: Role; plan: PlanTier; birthDate?: Date | null } | null;

export class ModuleDisabledError extends Error {
  status = 403;
  code = "MODULE_DISABLED";
  constructor(public moduleKey: string) {
    super(`ماژول «${MODULE_MAP[moduleKey]?.title ?? moduleKey}» برای شما فعال نیست.`);
  }
}

export class ConsentRequiredError extends Error {
  status = 403;
  code = "CONSENT_REQUIRED";
  constructor() {
    super("برای این کار ابتدا باید رضایت والدین تأیید شود.");
  }
}

export class QuotaError extends Error {
  status = 403;
  code = "QUOTA_EXCEEDED";
  constructor(public limit: number) {
    super(`سقف پلن فعلی شما ${limit} محصول است. برای افزودن محصول بیشتر، اشتراک را ارتقا دهید.`);
  }
}

export async function getGlobalSettings(): Promise<Record<string, boolean>> {
  const rows = await db.moduleSetting.findMany();
  const map: Record<string, boolean> = {};
  for (const module of MODULES) map[module.key] = module.defaultEnabled;
  for (const row of rows) {
    if (MODULE_MAP[row.key]) map[row.key] = row.enabled;
  }
  return map;
}

export async function getModuleStates(user: ModuleUser): Promise<ModuleState[]> {
  const globalSettings = await getGlobalSettings();
  const prefs = user
    ? await db.userModulePreference.findMany({ where: { userId: user.id } })
    : [];
  const prefMap = new Map(prefs.map((pref) => [pref.moduleKey, pref.enabled]));

  return MODULES.map((module) =>
    evaluateModule(module, {
      role: user?.role,
      plan: user?.plan,
      globalEnabled: globalSettings[module.key] ?? module.defaultEnabled,
      userEnabled: prefMap.has(module.key) ? prefMap.get(module.key)! : null,
    }),
  );
}

export async function getEnabledModuleKeys(user: ModuleUser): Promise<Set<string>> {
  const states = await getModuleStates(user);
  return new Set(states.filter((state) => state.enabled).map((state) => state.module.key));
}

export async function isModuleEnabled(key: string, user: ModuleUser): Promise<boolean> {
  const states = await getModuleStates(user);
  return Boolean(states.find((state) => state.module.key === key)?.enabled);
}

export async function assertModule(key: string, user: ModuleUser): Promise<void> {
  if (!(await isModuleEnabled(key, user))) throw new ModuleDisabledError(key);
}

export async function setGlobalModule(key: string, enabled: boolean) {
  const module = MODULE_MAP[key];
  if (!module) throw new Error("ماژول ناشناخته است.");
  if (module.locked) throw new Error("ماژول‌های هسته قابل خاموش‌کردن نیستند.");
  return db.moduleSetting.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  });
}

export async function setUserModule(userId: string, key: string, enabled: boolean) {
  const module = MODULE_MAP[key];
  if (!module) throw new Error("ماژول ناشناخته است.");
  if (module.locked || module.adminOnly) throw new Error("این ماژول توسط کاربر قابل تغییر نیست.");
  return db.userModulePreference.upsert({
    where: { userId_moduleKey: { userId, moduleKey: key } },
    update: { enabled },
    create: { userId, moduleKey: key, enabled },
  });
}

export async function getQuota(user: { id: string; plan: PlanTier }) {
  const limit = PLANS[user.plan].productLimit;
  const used = await db.product.count({ where: { sellerId: user.id, status: { not: "DRAFT" } } });
  return { limit, used, remaining: Math.max(0, limit - used) };
}

export async function assertCanCreateProduct(user: {
  id: string;
  plan: PlanTier;
  birthDate?: Date | null;
  consent?: { status: string } | null;
}) {
  if (ageFrom(user.birthDate) < 13 && user.consent?.status !== "APPROVED") {
    throw new ConsentRequiredError();
  }
  const quota = await getQuota(user);
  if (quota.remaining <= 0) throw new QuotaError(quota.limit);
  return quota;
}

export function consentBlocked(user: {
  birthDate?: Date | null;
  consent?: { status: string } | null;
}): boolean {
  return ageFrom(user.birthDate) < 13 && user.consent?.status !== "APPROVED";
}
