import { db } from "@/lib/db";
import { ageLabel } from "@/lib/age";
import { PLANS } from "@/lib/modules";
import { faDateLabel, faNum } from "@/lib/format";
import { Avatar, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "کاربران" };

const CONSENT: Record<string, { label: string; tone: "mint" | "sun" | "berry" | "slate" }> = {
  APPROVED: { label: "رضایت تأییدشده", tone: "mint" },
  PENDING: { label: "رضایت در انتظار", tone: "sun" },
  REVOKED: { label: "رضایت لغوشده", tone: "berry" },
  NOT_REQUIRED: { label: "بدون نیاز", tone: "slate" },
};

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    include: { consent: true, _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-forest">کاربران</h1>
        <p className="text-[11px] text-slate-500">{faNum(users.length)} حساب ثبت‌شده؛ وضعیت رضایت والدین هر کودک مشخص است.</p>
      </div>

      <div className="kid-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-right text-[11px]">
          <thead className="bg-emerald-50/70 text-[10px] text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-bold">کاربر</th>
              <th className="px-3 py-2.5 font-bold">نقش</th>
              <th className="px-3 py-2.5 font-bold">سن</th>
              <th className="px-3 py-2.5 font-bold">پلن</th>
              <th className="px-3 py-2.5 font-bold">رضایت والدین</th>
              <th className="px-3 py-2.5 font-bold">محصول</th>
              <th className="px-3 py-2.5 font-bold">عضویت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/5">
            {users.map((user) => {
              const consent = CONSENT[user.consent?.status ?? "NOT_REQUIRED"];
              return (
                <tr key={user.id} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={user.name} color={user.avatarColor} size={28} />
                      <div className="min-w-0">
                        <p className="truncate font-black text-forest">{user.name}</p>
                        {user.managedByGuardian ? (
                          <p className="truncate text-[10px] text-slate-400">بدون ایمیل · پروفایل تحت مدیریت والدین</p>
                        ) : (
                          <p dir="ltr" className="truncate text-right text-[10px] text-slate-400">{user.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={user.role === "ADMIN" ? "clay" : user.role === "PARENT" ? "sky" : "mint"}>
                      {user.role === "ADMIN" ? "ادمین" : user.role === "PARENT" ? "والدین" : "کودک"}
                    </Badge>
                    {user.managedByGuardian ? <Badge tone="sky" className="mt-1">تحت مدیریت والدین</Badge> : null}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{user.role === "CHILD" ? ageLabel(user.birthDate) : "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{PLANS[user.plan].emoji} {PLANS[user.plan].title}</td>
                  <td className="px-3 py-2.5"><Badge tone={consent.tone}>{consent.label}</Badge></td>
                  <td className="px-3 py-2.5 text-slate-600">{faNum(user._count.products)}</td>
                  <td className="px-3 py-2.5 text-slate-400">{faDateLabel(user.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
