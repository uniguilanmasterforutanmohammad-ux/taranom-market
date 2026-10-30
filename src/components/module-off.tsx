import Link from "next/link";
import { Power } from "lucide-react";
import type { ModuleDefinition } from "@/lib/modules";
import { ModuleIcon } from "./module-icon";

export function ModuleOff({ module }: { module: ModuleDefinition }) {
  return (
    <div className="kid-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ModuleIcon name={module.icon} size={30} />
      </span>
      <div>
        <p className="text-base font-black text-forest">ماژول «{module.title}» خاموش است</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-slate-500">
          این قابلیت برای حساب شما غیرفعال شده است. می‌توانی از صفحهٔ ماژول‌ها دوباره روشنش کنی.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/dashboard/modules" className="kid-btn kid-btn-primary text-xs">
          <Power size={14} /> مدیریت ماژول‌ها
        </Link>
        <Link href="/explore" className="kid-btn kid-btn-ghost text-xs">بازگشت به بازارچه</Link>
      </div>
    </div>
  );
}
