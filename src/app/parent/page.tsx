import Link from "next/link";
import { redirect } from "next/navigation";
import { Baby, Clock3, MessageCircle, PackagePlus, Plus, ShieldCheck, ShieldQuestion, Trash2, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGlobalSettings, getModuleStates, getQuota } from "@/lib/module-service";
import { MODULE_GROUPS } from "@/lib/modules";
import { ageLabel } from "@/lib/age";
import { childrenWhere } from "@/lib/children";
import { ModuleIcon } from "@/components/module-icon";
import { ModuleToggle } from "@/components/module-toggle";
import { ConsentActions } from "@/components/consent-actions";
import { AddChildForm } from "@/components/add-child-form";
import { MessageReply } from "@/components/message-reply";
import { ApprovalActions } from "@/components/approval-actions";
import { PLAN_UPGRADE_KEY, listApprovalRequests } from "@/lib/approval";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, Badge, EmptyState, SectionHeading } from "@/components/ui";
import { GuardianProductReview } from "@/components/guardian-product-review";
import { PRODUCT_STATUS_LABEL, faDateLabel, faNum, productStatusTone, toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "پنل والدین" };

const CONSENT_LABEL: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأییدشده",
  REVOKED: "لغوشده",
  NOT_REQUIRED: "نیازی نیست",
};

export default async function ParentPage() {
  const user = await requireUser();
  if (user.role === "CHILD") redirect("/dashboard");

  const children = await db.user.findMany({
    where: childrenWhere(user),
    include: {
      consent: true,
      products: { select: { id: true, title: true, status: true, price: true }, orderBy: { createdAt: "desc" }, take: 6 },
      subscriptions: { where: { status: "ACTIVE" }, orderBy: { startedAt: "desc" }, take: 1 },
    },
    take: 8,
  });

  const [global, childStates, childQuotas] = await Promise.all([
    getGlobalSettings(),
    Promise.all(children.map((child) => getModuleStates(child))),
    Promise.all(children.map((child) => getQuota(child))),
  ]);
  const pendingCount = children.filter((child) => child.consent?.status === "PENDING").length;
  const childIds = children.map((child) => child.id);
  const approvalRequests = await listApprovalRequests(childIds, { take: 30 });
  const pendingApprovals = approvalRequests.filter((request) => request.status === "PENDING");
  const answeredApprovals = approvalRequests.filter((request) => request.status !== "PENDING").slice(0, 4);
  const childMessages = childIds.length
    ? await db.message.findMany({
        where: { OR: [{ senderId: { in: childIds } }, { recipientId: { in: childIds } }] },
        include: {
          sender: { select: { id: true, name: true, avatarColor: true } },
          recipient: { select: { id: true, name: true, avatarColor: true } },
          product: { select: { id: true, title: true } },
          replyTo: { select: { body: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  const awaitingParentProducts = childIds.length
    ? await db.product.findMany({
        where: { sellerId: { in: childIds }, status: "AWAITING_PARENT" },
        include: { category: true, seller: { select: { name: true, avatarColor: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-500">
          حساب شما: {user.name} · {user.email}
        </p>
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" ? (
            <Link href="/admin" className="kid-btn kid-btn-ghost !px-3 !py-2 text-[11px]">پنل مدیریت</Link>
          ) : null}
          <LogoutButton />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border-2 border-emerald-900/10 bg-gradient-to-l from-sky-100 via-cream to-emerald-50 p-6">
        <div className="absolute -left-4 -top-4 text-6xl opacity-20">👨‍👩‍👧</div>
        <Badge tone="sky"><ShieldCheck size={12} /> نظارت و حریم خصوصی</Badge>
        <h1 className="mt-2 text-2xl font-black text-forest sm:text-3xl">پنل والدین</h1>
        <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-600">
          رضایت فرزندان را تأیید یا لغو کنید، ماژول‌های حساب آن‌ها را مدیریت کنید و فعالیتشان را ببینید.
          این کنترل‌ها همان چیزی است که در سرور هم اعمال می‌شود.
        </p>
        {pendingCount > 0 ? (
          <p className="mt-3 inline-flex rounded-xl bg-amber-100 px-3 py-1.5 text-[11px] font-black text-amber-900">
            {faNum(pendingCount)} درخواست رضایت در انتظار تأیید شماست.
          </p>
        ) : null}
      </div>

      <section className="mt-5">
        <SectionHeading
          eyebrow="اجازه‌های درخواستی"
          title="درخواست‌های در انتظار تأیید"
          body="وقتی فرزندت برای روشن‌کردن قابلیتی (مثل پاسخ‌دادن به پیام یا دیدن راه تماس پیام‌دهنده) از تو اجازه می‌خواهد، اینجا می‌بینی. با تأیید، همان کلید برای فرزندت روشن می‌شود."
          action={
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black text-sky-800">
              {faNum(pendingApprovals.length)} درخواست باز
            </span>
          }
        />
        <div className="mt-3 space-y-2">
          {pendingApprovals.length === 0 ? (
            <p className="kid-card p-5 text-center text-xs text-slate-500">درخواست بازِ جدیدی نداری.</p>
          ) : (
            pendingApprovals.map((request) => (
              <article key={request.id} className="kid-card flex flex-wrap items-start gap-3 border-2 border-amber-200 p-4">
                <Avatar name={request.childName} color={request.childColor} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-black text-forest">
                    <ShieldQuestion size={13} className="text-amber-600" />
                    {request.childName} اجازهٔ «{request.moduleTitle}» را خواسته است.
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock3 size={10} /> {faDateLabel(request.createdAt)}
                    {request.note ? ` · یادداشت فرزند: ${request.note}` : ""}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-5 text-slate-500">
                    {request.moduleKey === PLAN_UPGRADE_KEY
                      ? "با تأیید شما پلن فرزندتان ارتقا می‌یابد (پرداخت نمایشی) و سقف ثبت محصولش بیشتر می‌شود."
                      : request.module?.parentApproval
                        ? "این قابلیت فقط با تأیید شما برای فرزندتان فعال می‌شود و هر گفت‌وگوی او هم برای شما ثبت می‌ماند."
                        : "این کلید برای فرزند شما با تأیید شما روشن می‌شود."}
                  </p>
                </div>
                <ApprovalActions requestId={request.id} childName={request.childName} moduleTitle={request.moduleTitle} />
              </article>
            ))
          )}
          {answeredApprovals.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {answeredApprovals.map((request) => (
                <span key={request.id} className="rounded-xl bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {request.childName} · {request.moduleTitle} ·{" "}
                  <span className={request.status === "APPROVED" ? "text-emerald-700" : "text-pink-600"}>
                    {request.status === "APPROVED" ? "تأییدشده" : "ردشده"}
                  </span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {awaitingParentProducts.length > 0 ? (
        <section className="mt-5">
          <SectionHeading
            eyebrow="تأیید والدین روی محصول‌ها"
            title="محصولات در انتظار تأیید شما"
            body="ساختهٔ فرزندان زیر ۱۳ سال اول به دست شما می‌رسد. تا تأیید شما، محصول برای بازبینی ادمین فرستاده نمی‌شود و در ویترین دیده نمی‌شود."
            action={
              <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black text-sky-800">
                {faNum(awaitingParentProducts.length)} محصول
              </span>
            }
          />
          <div className="mt-3 space-y-2">
            {awaitingParentProducts.map((product) => (
              <article key={product.id} className="kid-card flex flex-wrap items-start gap-3 p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: product.category.tint }}>
                  {product.category.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-black text-forest">{product.title}</p>
                    <Badge tone={productStatusTone(product.status)}>{PRODUCT_STATUS_LABEL[product.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {product.seller.name} · {toman(product.price)} · {faDateLabel(product.createdAt)} · {product.category.title}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-slate-600">{product.description}</p>
                </div>
                <GuardianProductReview productId={product.id} childName={product.seller.name} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <SectionHeading
          eyebrow="فرزندان"
          title="حساب‌های تحت نظارت"
          action={<Link href="/explore" className="text-[11px] font-black text-emerald-700 hover:text-emerald-900">دیدن بازارچه</Link>}
        />
      </div>

      {user.role === "PARENT" ? <AddChildForm /> : null}

      {children.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            emoji="👨‍👩‍👧"
            title="هنوز فرزندی به حساب شما وصل نیست"
            body="اگر فرزندت خودش ثبت‌نام کند، درخواست رضایتش همین‌جا می‌آید. اگر هم نمی‌خواهی کودک به اینترنت دسترسی داشته باشد، از دکمهٔ بالا برایش پروفایل تحت مدیریت خودت بساز."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {children.map((child, index) => {
            const allStates = childStates[index];
            const states = allStates.filter(({ module }) => {
              if (module.locked || module.adminOnly) return false;
              if (module.parentApproval) return false;
              if (module.roles && !module.roles.includes("CHILD")) return false;
              return true;
            });
            const permissions = allStates.filter(({ module }) => module.parentApproval);
            const managed = child.managedByGuardian;
            const quotaFull = childQuotas[index]?.remaining === 0;
            return (
              <section key={child.id} className="kid-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b-2 border-emerald-900/10 bg-emerald-50/50 p-4">
                  <Avatar name={child.name} color={child.avatarColor} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-black text-forest">{child.name}</p>
                      {managed ? <Badge tone="clay"><UserRound size={10} /> تحت مدیریت والدین</Badge> : null}
                      <Badge tone={child.consent?.status === "APPROVED" ? "mint" : child.consent?.status === "PENDING" ? "sun" : child.consent?.status === "REVOKED" ? "berry" : "slate"}>
                        {CONSENT_LABEL[child.consent?.status ?? "NOT_REQUIRED"]}
                      </Badge>
                      <Badge tone="sky"><Baby size={10} /> {ageLabel(child.birthDate)}</Badge>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {managed ? "بدون حساب مستقل · کودک نیازی به ورود به سایت ندارد" : child.email}
                      {" · "}{child.products.length} محصول ثبت‌شده
                      {child.subscriptions[0] ? ` · اشتراک فعال تا ${faDateLabel(child.subscriptions[0].renewsAt)}` : ""}
                    </p>
                  </div>
                  {child.consent ? <ConsentActions childId={child.id} status={child.consent.status} /> : null}
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1.2fr]">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-slate-600"><UserRound size={13} /> آخرین فعالیت</p>
                    <div className="space-y-1.5">
                      {child.products.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-2.5 text-[10px] text-slate-500">فعالیت محصولی ثبت نشده.</p>
                      ) : (
                        child.products.map((product) => (
                          <div key={product.id} className="flex items-center justify-between gap-2 rounded-xl border border-emerald-900/5 bg-white px-2.5 py-2 text-[10px]">
                            <span className="truncate font-bold text-slate-700">{product.title}</span>
                            <span className="shrink-0 text-slate-400">{toman(product.price)}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-slate-400">
                      برای حذف کامل داده‌های فرزند، رضایت را لغو کنید؛ محصولات از ویترین برداشته می‌شوند و سایر داده‌ها طبق سیاست نگهداری پاک خواهند شد.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {quotaFull ? (
                        <Link href={`/parent/children/${child.id}`} className="kid-btn kid-btn-ghost !border-amber-300 !py-1.5 text-[11px] !text-amber-900">
                          <PackagePlus size={13} /> سقف پلن پر است — ارتقای پلن
                        </Link>
                      ) : (
                        <Link href={`/parent/children/${child.id}/products/new`} className="kid-btn kid-btn-primary !py-1.5 text-[11px]">
                          <PackagePlus size={13} /> ثبت محصول برای این فرزند
                        </Link>
                      )}
                      <Link href={`/parent/children/${child.id}`} className="kid-btn kid-btn-ghost !py-1.5 text-[11px]">
                        <Plus size={13} /> مدیریت محصولات این فرزند
                      </Link>
                    </div>

                    {!managed ? (
                    <div className="mt-3 rounded-2xl border-2 border-emerald-900/10 bg-emerald-50/40 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-black text-slate-600">
                        <MessageCircle size={13} /> اجازه‌های ارتباطی
                      </p>
                      <p className="mb-2 text-[10px] leading-5 text-slate-500">
                        تا وقتی این کلیدها را روشن نکنی، فرزندت نمی‌تواند به پیام‌ها پاسخ بدهد و راه تماس پیام‌دهنده را
                        نمی‌بیند. ایمیل و موبایل پیام‌دهنده همیشه برای شما در بخش «پیام‌های فرزندان» نمایش داده می‌شود.
                      </p>
                      <div className="space-y-1.5">
                        {permissions.map(({ module, enabled }) => (
                          <div key={module.key} className="flex items-center gap-2 rounded-xl border border-emerald-900/5 bg-white px-2.5 py-1.5">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                              <ModuleIcon name={module.icon} size={12} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[10px] font-bold text-slate-700">{module.title}</span>
                              <span className="block text-[9px] leading-4 text-slate-400">{module.short}</span>
                            </span>
                            <ModuleToggle moduleKey={module.key} enabled={enabled} scope="user" userId={child.id} />
                          </div>
                        ))}
                      </div>
                    </div>
                    ) : null}
                  </div>

                  <div>
                    {managed ? (
                      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-black text-sky-900">
                          <UserRound size={13} /> همهٔ کارها با حساب شما
                        </p>
                        <p className="mt-1.5 text-[10px] leading-6 text-sky-950/80">
                          «{child.name}» حساب و رمز عبور ندارد و هرگز وارد بازارچه نمی‌شود. ثبت و ویرایش محصول، پاسخ به
                          پیام‌ها و پیگیری فروش با حساب خودت انجام می‌شود و محصول‌ها با برچسب «ثبت‌شده توسط والدین» به نام
                          فرزندت منتشر می‌شوند. کلیدهای ماژول اختصاصی کودک هم برای این پروفایل کاربرد ندارند.
                        </p>
                      </div>
                    ) : (
                    <>
                    <p className="mb-2 text-[11px] font-black text-slate-600">کلید ماژول‌های فرزند</p>
                    <div className="space-y-1.5">
                      {MODULE_GROUPS.map((group) => {
                        const items = states.filter(({ module }) => module.group === group.key);
                        if (items.length === 0) return null;
                        return (
                          <div key={group.key}>
                            <p className="mb-1 text-[10px] font-bold text-slate-400">{group.emoji} {group.title}</p>
                            {items.map(({ module, enabled }) => {
                              const globalOff = !(global[module.key] ?? module.defaultEnabled);
                              return (
                                <div key={module.key} className="mb-1 flex items-center gap-2 rounded-xl border border-emerald-900/5 bg-white px-2.5 py-1.5">
                                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                    <ModuleIcon name={module.icon} size={12} />
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-700">{module.title}</span>
                                  {globalOff ? <span className="text-[9px] text-pink-500">خاموش</span> : (
                                    <ModuleToggle moduleKey={module.key} enabled={enabled} scope="user" userId={child.id} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                    </>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-emerald-200 bg-white p-4">
        <p className="flex items-center gap-2 text-[11px] leading-6 text-slate-600">
          <Trash2 size={15} className="text-pink-500" />
          حق مشاهده، اصلاح، حذف و لغو رضایت همیشه برای والدین محفوظ است. درخواست حذف کامل حساب از پشتیبانی انجام می‌شود.
        </p>
        <a href="mailto:privacy@javaneh.ir" className="kid-btn kid-btn-ghost !py-1.5 text-[11px]">درخواست حذف داده</a>
      </div>

      <section className="mt-5">
        <SectionHeading
          eyebrow="پایش ارتباط‌ها"
          title="پیام‌های فرزندان"
          body="هر پیامی که فرزندتان می‌فرستد یا دریافت می‌کند (از جمله پیام‌های مربوط به ارتباط با سازنده در حالت خرید غیرفعال) اینجا برای شما ثبت می‌شود."
          action={
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black text-sky-800">
              ایمیل و موبایل پیام‌دهنده برای شما نمایش داده می‌شود
            </span>
          }
        />
        <div className="mt-3 space-y-2">
          {childMessages.length === 0 ? (
            <p className="kid-card p-5 text-center text-xs text-slate-500">هنوز پیامی بین فرزندان شما و اعضای بازارچه ردوبدل نشده است.</p>
          ) : (
            childMessages.map((message) => {
              const childIsSender = childIds.includes(message.senderId);
              return (
                <article key={message.id} className="kid-card flex flex-wrap items-start gap-3 p-4">
                  <Avatar name={message.sender.name} color={message.sender.avatarColor} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-black text-forest">
                      <MessageCircle size={12} className="text-emerald-600" />
                      {childIsSender ? `${message.sender.name} فرستاد به ${message.recipient.name}` : `${message.sender.name} فرستاد به ${message.recipient.name}`}
                      {childIsSender ? <Badge tone="mint">فرزند شما فرستاده</Badge> : <Badge tone="sun">برای فرزند شما</Badge>}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {faDateLabel(message.createdAt)}
                      {message.product ? ` · دربارهٔ «${message.product.title}»` : ""}
                    </p>
                    {message.replyTo ? (
                      <p className="mt-1.5 rounded-xl border-r-2 border-emerald-300 bg-slate-50 p-2 text-[10px] leading-5 text-slate-500">
                        در پاسخ به: {message.replyTo.body.slice(0, 90)}
                        {message.replyTo.body.length > 90 ? "…" : ""}
                      </p>
                    ) : null}
                    <p className="mt-1.5 rounded-xl bg-emerald-50/60 p-3 text-[11px] leading-6 text-slate-700">{message.body}</p>
                    {message.viaGuardian ? <Badge tone="sky">والدین به‌جای فرزند پاسخ داده‌اند</Badge> : null}
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                      راه تماس پیام‌دهنده:
                      {message.contactEmail ? <span dir="ltr" className="font-bold text-slate-700">{message.contactEmail}</span> : null}
                      {message.contactPhone ? <span dir="ltr" className="font-bold text-slate-700">{message.contactPhone}</span> : null}
                      {!message.contactEmail && !message.contactPhone ? <span>ثبت نشده</span> : null}
                    </p>
                    <MessageReply
                      messageId={message.id}
                      counterpartName={childIsSender ? message.recipient.name : message.sender.name}
                      allowed
                      lockedHint=""
                    />
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
