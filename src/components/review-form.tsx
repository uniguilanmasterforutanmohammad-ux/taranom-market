"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send, Star } from "lucide-react";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (comment.trim().length < 3) {
      setState("error");
      setMessage("کمی بیشتر بنویس (حداقل ۳ حرف).");
      return;
    }
    setState("loading");
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, comment }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "ثبت نظر ناموفق بود.");
      return;
    }
    setState("done");
    setMessage("نظرت ثبت شد و پس از تأیید منتشر می‌شود.");
    setComment("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-3">
      <p className="text-xs font-black text-forest">نظرت را بنویس</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} ستاره`}>
            <Star size={18} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        placeholder="چه چیزی را دوست داشتی؟"
        className="kid-field mt-2 !py-2 text-xs"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        {message ? <p className={`text-[11px] font-bold ${state === "error" ? "text-pink-600" : "text-emerald-700"}`}>{message}</p> : <span />}
        <button type="submit" disabled={state === "loading"} className="kid-btn kid-btn-primary !px-3 !py-1.5 text-[11px] disabled:opacity-60">
          {state === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} ثبت نظر
        </button>
      </div>
    </form>
  );
}
