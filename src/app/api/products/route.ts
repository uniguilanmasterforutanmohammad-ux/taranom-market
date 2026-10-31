import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assertModule, assertProductQuota, QuotaError } from "@/lib/module-service";
import { invalidateProductCache } from "@/lib/products";
import { logAudit, notify } from "@/lib/audit";
import { initialProductStatus, requireChildAccess } from "@/lib/children";
import { guardianAccountsOf } from "@/lib/approval";

type Body = {
  title?: string;
  description?: string;
  type?: string;
  price?: number;
  categoryId?: string;
  tags?: string[];
  stock?: number | null;
  /** اگر والد برای فرزندش ثبت کند، شناسهٔ حساب فرزند اینجا می‌آید. */
  sellerId?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("ابتدا وارد شوید.", 401);

  try {
    await assertModule("productUpload", user);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ماژول غیرفعال است.", 403);
  }

  const body = await readJson<Body>(request);
  if (!body) return jsonError("دادهٔ نامعتبر.");

  const requestedSellerId = (body.sellerId ?? "").trim();
  const forChild = Boolean(requestedSellerId && requestedSellerId !== user.id);
  const child = forChild ? await requireChildAccess(user, requestedSellerId) : null;
  if (forChild && !child) {
    return jsonError("فقط والد یا سرپرستِ خودِ این کودک می‌تواند با حساب خودش برای او محصول ثبت کند.", 403);
  }

  try {
    // ماژول ثبت محصول هم برای والدِ ثبت‌کننده و هم برای حساب خودِ فرزند باید روشن باشد.
    if (child) await assertModule("productUpload", child);
    // کودک زیر ۱۳ سال اجازهٔ ثبت دارد؛ فقط محصولش اول منتظر تأیید والدین می‌ماند.
    await assertProductQuota(child ?? user);
  } catch (error) {
    if (child && error instanceof QuotaError) {
      return jsonError(
        `سقف پلن «${child.name}» ${error.limit} محصول است. برای ثبت بیشتر، اشتراک این فرزند را ارتقا بده.`,
        403,
      );
    }
    return jsonError(error instanceof Error ? error.message : "اجازهٔ ثبت ندارید.", 403);
  }

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const type = body.type;
  const price = Number(body.price);
  const categoryId = body.categoryId ?? "";

  if (title.length < 3) return jsonError("عنوان محصول خیلی کوتاه است.");
  if (description.length < 15) return jsonError("توضیحات محصول خیلی کوتاه است.");
  if (!type || !["PHYSICAL", "SERVICE", "DIGITAL"].includes(type)) return jsonError("نوع محصول نامعتبر است.");
  if (!Number.isFinite(price) || price < 0) return jsonError("قیمت نامعتبر است.");

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) return jsonError("دسته‌بندی نامعتبر است.");

  const owner = child ?? user;
  const status = initialProductStatus(owner, { viaGuardian: Boolean(child) });

  const product = await db.product.create({
    data: {
      title,
      description,
      type: type as "PHYSICAL" | "SERVICE" | "DIGITAL",
      price: Math.round(price),
      categoryId,
      sellerId: child?.id ?? user.id,
      viaGuardian: Boolean(child),
      submittedById: child ? user.id : null,
      parentApprovedAt: child ? new Date() : null,
      tags: (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 6),
      stock: type === "PHYSICAL" && body.stock != null ? Math.max(0, Number(body.stock)) : null,
      status,
    },
  });

  const awaitingParent = status === "AWAITING_PARENT";
  const ownerLabel = child ? ` برای «${child.name}»` : "";
  const notices = [
    awaitingParent
      ? notify({
          userId: owner.id,
          title: "محصولت ثبت شد ⏳",
          body: `«${title}» ثبت شد و منتظر تأیید والدین است؛ بعد از تأیید آن‌ها برای بازبینی ادمین می‌رود.`,
          href: "/dashboard/products",
        })
      : notify({
          userId: user.id,
          title: "محصول ثبت شد ✅",
          body: `«${title}»${ownerLabel} در صف بازبینی قرار گرفت.`,
          href: child ? `/parent/children/${child.id}` : "/dashboard/products",
        }),
  ];
  if (awaitingParent) {
    const guardians = await guardianAccountsOf(owner.id);
    for (const guardian of guardians) {
      notices.push(
        notify({
          userId: guardian.id,
          title: `محصول تازه‌ای برای تأیید شما (${owner.name})`,
          body: `«${title}» ثبت شده و تا تأیید شما برای بازبینی ادمین نمی‌رود.`,
          href: "/parent",
        }),
      );
    }
  }
  if (child && !child.managedByGuardian) {
    notices.push(
      notify({
        userId: child.id,
        title: "محصول تازه‌ای برایت ثبت شد ✅",
        body: `والدینت «${title}» را به نام تو ثبت کردند.`,
        href: "/dashboard/products",
      }),
    );
  }

  await Promise.all([
    logAudit({
      actorId: user.id,
      action: child ? "product.create.viaGuardian" : awaitingParent ? "product.create.awaitingParent" : "product.create",
      entity: "Product",
      entityId: product.id,
      detail: child ? `${title} · سازنده: ${child.name}` : title,
    }),
    ...notices,
    invalidateProductCache(),
  ]);

  return Response.json({ product: { id: product.id, status: product.status } }, { status: 201 });
}
