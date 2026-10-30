import { db } from "./db";

export async function logAudit(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch {
    /* auditing must never break the main flow */
  }
}

export async function notify(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    });
  } catch {
    /* notifications are best-effort */
  }
}
