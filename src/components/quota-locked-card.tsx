import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { PLANS, type PlanTier } from "@/lib/modules";
import { faNum } from "@/lib/format";

/** وقتی سقف پلن پر است، به‌جای فرم ثبت محصول این کارت نشان داده می‌شود. */
export function QuotaLockedCard({
  plan,
  ownerLabel,
  children,
}: {
  plan: PlanTier;
  ownerLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="kid-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <LockKeyhole size={28} />
      </span>
      <div>
        <p className="text-base font-black text-forest">
          سقف ثبت محصول {ownerLabel ? `برای ${ownerLabel} ` : ""}پر شده است
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-slate-500">
          پلن «{PLANS[plan].title}» تا {faNum(PLANS[plan].productLimit)} محصول اجازه می‌دهد و همهٔ ظرفیت آن پر شده است.
          تا ارتقای پلن، امکان ثبت محصول جدید وجود ندارد.
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-2">{children}</div>
    </div>
  );
}
