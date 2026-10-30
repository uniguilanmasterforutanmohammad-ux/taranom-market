"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

export function CategoryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, emoji }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "افزودن دسته ناموفق بود.");
      return;
    }
    setTitle("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="flex-1">
        <span className="kid-label">نام دستهٔ جدید</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="kid-field" placeholder="مثلاً موسیقی و صدا" required />
      </label>
      <label className="w-24">
        <span className="kid-label">ایموجی</span>
        <input value={emoji} onChange={(event) => setEmoji(event.target.value)} className="kid-field text-center" maxLength={4} />
      </label>
      <button type="submit" disabled={loading} className="kid-btn kid-btn-primary !py-2.5 text-xs disabled:opacity-60">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} افزودن
      </button>
      {error ? <p className="w-full text-[10px] font-bold text-pink-600">{error}</p> : null}
    </form>
  );
}
