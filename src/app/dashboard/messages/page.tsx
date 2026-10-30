import Link from "next/link";
import { Mail, MessageCircle, Phone, ShieldCheck, Lock, Reply } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModuleStates } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { canSeeContactInfo, isMinor, maskEmail } from "@/lib/contact";
import { approvalStatusByModule } from "@/lib/approval";
import { ModuleOff } from "@/components/module-off";
import { ModuleIcon } from "@/components/module-icon";
import { MessageReply } from "@/components/message-reply";
import { ApprovalRequestButton } from "@/components/approval-request-button";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { faDateLabel, faNum } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "پیام‌ها" };

const CHANNEL_LABEL: Record<string, string> = {
  IN_APP: "پیام درون بازارچه",
  CALLBACK: "درخواست تماس تلفنی",
  EMAIL: "درخواست هماهنگی ایمیلی",
};

export default async function MessagesPage() {
  const user = await requireUser();
  const states = await getModuleStates(user);
  if (!states.find((state) => state.module.key === "sellerContact")?.enabled) {
    return <ModuleOff module={MODULE_MAP.sellerContact} />;
  }
  const replyEnabled = Boolean(states.find((state) => state.module.key === "messageReply")?.enabled);
  const contactVisible = await canSeeContactInfo(user);
  const permissionStates = user.role === "CHILD" ? states.filter(({ module }) => module.parentApproval) : [];
  const approvalMap = user.role === "CHILD" ? await approvalStatusByModule(user.id) : {};

  const [received, sent] = await Promise.all([
    db.message.findMany({
      where: { recipientId: user.id },
      include: {
        sender: { select: { name: true, avatarColor: true, birthDate: true } },
        product: { select: { id: true, title: true } },
        replyTo: { select: { body: true, viaGuardian: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.message.findMany({
      where: { senderId: user.id },
      include: {
        recipient: { select: { name: true, avatarColor: true } },
        product: { select: { id: true, title: true } },
        replyTo: { select: { body: true, viaGuardian: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-1.5 text-xl font-black text-forest"><MessageCircle size={19} /> پیام‌ها</h1>
          <p className="text-[11px] text-slate-500">
            {faNum(received.length)} پیام دریافتی · {faNum(sent.length)} پیام ارسالی — پیام‌های کاربران زیر ۱۳ سال برای والدین هم ثبت می‌شود.
          </p>
        </div>
        <Badge tone="mint"><ShieldCheck size={12} /> ارتباط امن</Badge>
      </div>

      {permissionStates.length > 0 ? (
        <section id="permissions" className="kid-card scroll-mt-20 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-black text-forest">
            <ShieldCheck size={15} className="text-emerald-600" /> اجازه‌های والدین
          </h2>
          <p className="mt-1 text-[11px] leading-6 text-slate-500">
            این دو قابلیت برای تو با تأیید والدین روشن می‌شود. با یک کلیک درخواستت را برای والدینت می‌فرستیم و
            نتیجه را همین‌جا می‌بینی.
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {permissionStates.map(({ module, enabled }) => (
              <div key={module.key} className="rounded-2xl border-2 border-emerald-900/10 bg-white p-3">
                <div className="flex items-start gap-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    <ModuleIcon name={module.icon} size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-forest">{module.title}</p>
                    <p className="mt-0.5 text-[10px] leading-5 text-slate-500">{module.short}</p>
                  </div>
                </div>
                <ApprovalRequestButton
                  moduleKey={module.key}
                  title={module.title}
                  granted={enabled}
                  initialStatus={approvalMap[module.key]?.status ?? null}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!replyEnabled ? (
        <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-3 text-[11px] leading-6 text-sky-900">
          پاسخ‌دادن به پیام‌ها با تأیید والدین فعال می‌شود؛ در کارت «اجازه‌های والدین» بالا درخواستت را بفرست.
        </div>
      ) : null}

      <section className="space-y-2.5">
        <h2 className="text-sm font-black text-forest">پیام‌های دریافتی</h2>
        {received.length === 0 ? (
          <EmptyState emoji="📭" title="پیامی نداری" body="وقتی کسی دربارهٔ ساخته‌هایت پیام بفرستد، همین‌جا می‌بینی." />
        ) : (
          received.map((message) => (
            <article key={message.id} className="kid-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Avatar name={message.sender.name} color={message.sender.avatarColor} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-forest">
                    {message.sender.name}
                    {isMinor(message.sender.birthDate) ? (
                      <span className="mr-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800">زیر ۱۳ سال</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      {message.channel === "CALLBACK" ? <Phone size={10} /> : message.channel === "EMAIL" ? <Mail size={10} /> : <MessageCircle size={10} />}
                      {CHANNEL_LABEL[message.channel]}
                    </span>
                    <span>{faDateLabel(message.createdAt)}</span>
                    {message.product ? (
                      <Link href={`/product/${message.product.id}`} className="text-emerald-700">دربارهٔ «{message.product.title}»</Link>
                    ) : null}
                  </p>
                </div>
              </div>
              {message.replyTo ? (
                <p className="mt-1.5 rounded-xl border-r-2 border-emerald-300 bg-slate-50 p-2 text-[10px] leading-5 text-slate-500">
                  <Reply size={10} className="ml-1 inline" /> در پاسخ به: {message.replyTo.body.slice(0, 90)}
                  {message.replyTo.body.length > 90 ? "…" : ""}
                </p>
              ) : null}
              <p className="mt-2 rounded-xl bg-emerald-50/60 p-3 text-[11px] leading-6 text-slate-700">{message.body}</p>
              {message.viaGuardian ? <Badge tone="sky">با نظارت والدین ارسال شد</Badge> : null}
              {message.contactEmail || message.contactPhone ? (
                contactVisible ? (
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    راه تماس پیام‌دهنده:
                    {message.contactEmail ? <span dir="ltr" className="font-bold text-slate-700">{message.contactEmail}</span> : null}
                    {message.contactPhone ? <span dir="ltr" className="font-bold text-slate-700">{message.contactPhone}</span> : null}
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-2 text-[10px] leading-5 text-sky-900">
                    <Lock size={11} /> راه تماس پیام‌دهنده با تأیید والدین نمایش داده می‌شود. والدینت می‌توانند از پنل والدین
                    این اجازه را روشن کنند —{" "}
                    <Link href="/dashboard/messages#permissions" className="font-black text-sky-800 underline">
                      درخواست اجازه از والدین
                    </Link>
                  </p>
                )
              ) : null}
              {message.parentCopies.length > 0 ? (
                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-700">
                  <ShieldCheck size={11} /> نسخهٔ این پیام برای {faNum(message.parentCopies.length)} والد ارسال شده است.
                </p>
              ) : null}
              <MessageReply
                messageId={message.id}
                counterpartName={message.sender.name}
                allowed={replyEnabled}
                lockedHint="پاسخ‌دادن به پیام‌ها برای تو فعال نیست؛ از والدینت بخواه از پنل والدین روشن کند."
              />
            </article>
          ))
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-black text-forest">پیام‌های ارسالی من</h2>
        {sent.length === 0 ? (
          <p className="kid-card p-5 text-center text-xs text-slate-500">هنوز پیامی نفرستاده‌ای.</p>
        ) : (
          sent.map((message) => (
            <article key={message.id} className="kid-card flex flex-wrap items-start gap-3 p-4">
              <Avatar name={message.recipient.name} color={message.recipient.avatarColor} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-forest">به {message.recipient.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{CHANNEL_LABEL[message.channel]} · {faDateLabel(message.createdAt)}</p>
                {message.replyTo ? (
                  <p className="mt-1.5 rounded-xl border-r-2 border-emerald-300 bg-slate-50 p-2 text-[10px] leading-5 text-slate-500">
                    <Reply size={10} className="ml-1 inline" /> در پاسخ به: {message.replyTo.body.slice(0, 90)}
                    {message.replyTo.body.length > 90 ? "…" : ""}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[11px] leading-6 text-slate-600">{message.body}</p>
                {message.viaGuardian ? <Badge tone="sky">با نظارت والدین ارسال شد</Badge> : null}
                {message.parentCopies.length > 0 ? (
                  <p className="mt-1 text-[10px] text-emerald-700">نسخه برای والدین: {message.parentCopies.join("، ")}</p>
                ) : null}
                <MessageReply
                  messageId={message.id}
                  counterpartName={message.recipient.name}
                  allowed={replyEnabled}
                  lockedHint="پاسخ‌دادن به پیام‌ها برای تو فعال نیست؛ از والدینت بخواه از پنل والدین روشن کند."
                  label="ادامهٔ گفت‌وگو"
                />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
