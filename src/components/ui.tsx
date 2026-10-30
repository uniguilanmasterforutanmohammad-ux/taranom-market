import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";

const TONES = {
  mint: "bg-emerald-50 text-emerald-800 border-emerald-200",
  sun: "bg-amber-50 text-amber-800 border-amber-200",
  berry: "bg-pink-50 text-pink-700 border-pink-200",
  sky: "bg-sky-50 text-sky-800 border-sky-200",
  clay: "bg-orange-50 text-orange-800 border-orange-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
};

export function Badge({
  children,
  tone = "mint",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  color = "#16a34a",
  size = 40,
  className,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-black text-white ring-2 ring-white", className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
      aria-hidden
    >
      {name.trim().charAt(0)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "mint",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="kid-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        {icon ? <span className={cx("rounded-xl border p-1.5", TONES[tone])}>{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-black text-forest">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  action,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: string;
  action?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-4", center && "flex-col items-center text-center")}>
      <div className={cx("max-w-2xl", center && "mx-auto")}>
        {eyebrow ? (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-2xl font-black tracking-tight text-forest sm:text-3xl">{title}</h2>
        {body ? <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  emoji = "🪹",
  title,
  body,
  action,
}: {
  emoji?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="kid-card flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-base font-black text-forest">{title}</p>
      {body ? <p className="max-w-md text-sm leading-6 text-slate-500">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, max, tone = "bg-emerald-500" }: { value: number; max: number; tone?: string }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-950/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all", tone)} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function Alert({
  tone = "sun",
  title,
  children,
  action,
}: {
  tone?: "sun" | "berry" | "mint" | "sky";
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const styles = {
    sun: "border-amber-300 bg-amber-50 text-amber-950",
    berry: "border-pink-300 bg-pink-50 text-pink-950",
    mint: "border-emerald-300 bg-emerald-50 text-emerald-950",
    sky: "border-sky-300 bg-sky-50 text-sky-950",
  };
  return (
    <div className={cx("flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 p-4 text-sm", styles[tone])}>
      <div>
        {title ? <p className="font-black">{title}</p> : null}
        <div className="leading-6">{children}</div>
      </div>
      {action}
    </div>
  );
}

export function CTAButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "sun" | "ghost";
  className?: string;
}) {
  return (
    <Link href={href} className={cx("kid-btn", `kid-btn-${variant}`, className)}>
      {children}
    </Link>
  );
}
