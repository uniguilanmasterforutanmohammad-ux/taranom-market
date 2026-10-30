"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { cx } from "@/lib/format";

export function LogoutButton({
  variant = "pill",
  className,
  onDone,
}: {
  variant?: "pill" | "row";
  className?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      onDone?.();
      router.push("/");
      router.refresh();
      setBusy(false);
    }
  }

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className={cx("flex w-full items-center gap-2.5 border-t-2 border-emerald-900/10 px-5 py-3 text-xs font-bold text-pink-700 hover:bg-pink-50 disabled:opacity-60", className)}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />} خروج از حساب
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={cx("kid-btn kid-btn-ghost !border-pink-200 !px-3 !py-2 text-[11px] !text-pink-700 disabled:opacity-60", className)}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />} خروج از حساب
    </button>
  );
}
