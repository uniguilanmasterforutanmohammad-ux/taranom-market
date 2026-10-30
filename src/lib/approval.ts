import { db } from "./db";
import { MODULE_MAP, type ModuleDefinition } from "./modules";

export type ApprovalStatusValue = "PENDING" | "APPROVED" | "DENIED";

export type ApprovalRequestView = {
  id: string;
  childId: string;
  childName: string;
  childColor: string;
  moduleKey: string;
  moduleTitle: string;
  module: ModuleDefinition | undefined;
  note: string | null;
  status: ApprovalStatusValue;
  createdAt: Date;
  respondedAt: Date | null;
};

/** آیا این حساب والد، ولیِ این کودک است؟ (رابطهٔ parentId یا ایمیل ثبت‌شده در رکورد رضایت) */
export async function isGuardianOf(parent: { id: string; email: string }, childId: string): Promise<boolean> {
  const child = await db.user.findUnique({ where: { id: childId }, select: { parentId: true, role: true } });
  if (!child || child.role !== "CHILD") return false;
  if (child.parentId === parent.id) return true;
  return Boolean(
    await db.consent.findFirst({
      where: { childId, parentEmail: parent.email.toLowerCase(), status: { not: "REVOKED" } },
    }),
  );
}

/** حساب‌های کاربری والدین یک کودک برای اعلان درون‌برنامه‌ای (ایمیل رضایت ممکن است حساب نداشته باشد). */
export async function guardianAccountsOf(
  childId: string,
): Promise<{ id: string; name: string; email: string; phone: string | null }[]> {
  const consent = await db.consent.findUnique({
    where: { childId },
    include: { child: { select: { parent: { select: { id: true, name: true, email: true, phone: true } } } } },
  });
  const accounts: { id: string; name: string; email: string; phone: string | null }[] = [];
  const linked = consent?.child.parent;
  if (linked) accounts.push(linked);
  const email = consent?.parentEmail?.toLowerCase();
  if (email && !accounts.some((account) => account.email.toLowerCase() === email)) {
    const account = await db.user.findFirst({
      where: { email, role: { in: ["PARENT", "ADMIN"] } },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (account) accounts.push(account);
  }
  return accounts;
}

/** آیا این ماژول مخصوص تأیید والدین است؟ */
export function isParentApprovalModule(moduleKey: string): boolean {
  return Boolean(MODULE_MAP[moduleKey]?.parentApproval);
}

function decorate(request: {
  id: string;
  childId: string;
  moduleKey: string;
  note: string | null;
  status: ApprovalStatusValue;
  createdAt: Date;
  respondedAt: Date | null;
  child: { name: string; avatarColor: string };
}): ApprovalRequestView {
  return {
    id: request.id,
    childId: request.childId,
    childName: request.child.name,
    childColor: request.child.avatarColor,
    moduleKey: request.moduleKey,
    moduleTitle: MODULE_MAP[request.moduleKey]?.title ?? request.moduleKey,
    module: MODULE_MAP[request.moduleKey],
    note: request.note,
    status: request.status,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt,
  };
}

const SELECT = {
  id: true,
  childId: true,
  moduleKey: true,
  note: true,
  status: true,
  createdAt: true,
  respondedAt: true,
  child: { select: { name: true, avatarColor: true } },
} as const;

/** آخرین وضعیت هر ماژول نیازمند تأیید برای یک کودک؛ برای نمایش در پنل کودک. */
export async function approvalStatusByModule(
  childId: string,
): Promise<Record<string, { status: ApprovalStatusValue; createdAt: Date; id: string }>> {
  const rows = await db.approvalRequest.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    select: { id: true, moduleKey: true, status: true, createdAt: true },
  });
  const map: Record<string, { status: ApprovalStatusValue; createdAt: Date; id: string }> = {};
  for (const row of rows) {
    if (!map[row.moduleKey]) map[row.moduleKey] = { status: row.status, createdAt: row.createdAt, id: row.id };
  }
  return map;
}

export async function listApprovalRequests(
  childIds: string[],
  options?: { status?: ApprovalStatusValue; take?: number },
): Promise<ApprovalRequestView[]> {
  if (childIds.length === 0) return [];
  const rows = await db.approvalRequest.findMany({
    where: { childId: { in: childIds }, ...(options?.status ? { status: options.status } : {}) },
    orderBy: { createdAt: "desc" },
    take: options?.take ?? 50,
    select: SELECT,
  });
  return rows.map(decorate);
}
