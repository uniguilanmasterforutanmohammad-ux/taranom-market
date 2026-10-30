"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save, Sparkles } from "lucide-react";
import { PRODUCT_TYPE_LABEL } from "@/lib/format";

type Category = { id: string; title: string; emoji: string };
type ProductInput = {
  id?: string;
  title: string;
  description: string;
  type: string;
  price: number;
  categoryId: string;
  tags: string[];
  stock: number | null;
};

const TYPES = [
  { key: "PHYSICAL", emoji: "📦", hint: "دست‌سازه یا کالای واقعی" },
  { key: "SERVICE", emoji: "🤝", hint: "آموزش یا خدمت حضوری/آنلاین" },
  { key: "DIGITAL", emoji: "💾", hint: "فایل، قصه یا محصول دانلودی" },
];

export function ProductForm({
  categories,
  product,
  quotaRemaining,
}: {
  categories: Category[];
  product?: ProductInput;
  quotaRemaining: number;
}) {
  const router = useRouter();
  const [type, setType] = useState(product?.type ?? "PHYSICAL");
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [tags, setTags] = useState((product?.tags ?? []).join("، "));
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (title.trim().length < 3) return setError("عنوان را کامل‌تر بنویس.");
    if (description.trim().length < 15) return setError("توضیحات باید حداقل ۱۵ حرف باشد.");
    if (!categoryId) return setError("یک دسته‌بندی انتخاب کن.");
    if (Number(price) < 0 || price === "") return setError("قیمت را درست وارد کن.");

    setLoading(true);
    const response = await fetch(product?.id ? `/api/products/${product.id}` : "/api/products", {
      method: product?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        type,
        price: Number(price),
        categoryId,
        tags: tags.split(/[،,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 6),
        stock: type === "PHYSICAL" && stock !== "" ? Number(stock) : null,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "ثبت محصول ناموفق بود.");
      return;
    }
    router.push("/dashboard/products");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!product?.id ? (
        <div className="rounded-2xl bg-emerald-50 p-3 text-[11px] font-bold text-emerald-800">
          ✨ {quotaRemaining > 0 ? `${quotaRemaining} جای خالی در پلن فعلی داری.` : "سقف پلن پر است؛ برای ثبت باید ارتقا بدهی."}
        </div>
      ) : null}

      <div className="kid-card p-5">
        <p className="mb-2 text-sm font-black text-forest">۱. این چه نوع ساخته‌ای است؟</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setType(item.key)}
              className={`rounded-2xl border-2 p-3 text-right transition ${
                type === item.key ? "border-emerald-600 bg-emerald-50" : "border-emerald-900/10 bg-white hover:bg-emerald-50/50"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <p className="mt-1 text-xs font-black text-forest">{PRODUCT_TYPE_LABEL[item.key]}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{item.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="kid-card space-y-3 p-5">
        <p className="text-sm font-black text-forest">۲. مشخصات اصلی</p>
        <label>
          <span className="kid-label">عنوان محصول</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="kid-field" placeholder="مثلاً دستبند بافتنی رنگین‌کمان" required />
        </label>
        <label>
          <span className="kid-label">توضیحات</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="kid-field resize-y"
            placeholder="چه چیزی ساخته‌ای؟ چه اندازه‌ای دارد؟ چطور استفاده می‌شود؟"
            required
          />
          <span className="mt-1 block text-[10px] text-slate-400">{description.length} حرف — هر چه روشن‌تر، تأیید سریع‌تر.</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="kid-label">دسته‌بندی</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="kid-field" required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.emoji} {category.title}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="kid-label">قیمت (تومان)</span>
            <input type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} className="kid-field" placeholder="85000" required />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="kid-label">برچسب‌ها (با ویرگول)</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} className="kid-field" placeholder="دست‌ساز، رنگین‌کمان" />
          </label>
          {type === "PHYSICAL" ? (
            <label>
              <span className="kid-label">موجودی</span>
              <input type="number" min={0} value={stock} onChange={(event) => setStock(event.target.value)} className="kid-field" placeholder="۵" />
            </label>
          ) : <span />}
        </div>
      </div>

      <div className="kid-card flex flex-wrap items-center gap-3 bg-amber-50/60 p-4 text-[11px] text-amber-900">
        <Sparkles size={16} className="text-amber-600" />
        محصول پس از ثبت با وضعیت «در انتظار تأیید» ذخیره می‌شود و پس از بازبینی ادمین در ویترین منتشر می‌شود.
      </div>

      {error ? <p className="rounded-xl bg-pink-50 p-3 text-xs font-bold text-pink-700">{error}</p> : null}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading || (!product?.id && quotaRemaining <= 0)} className="kid-btn kid-btn-primary text-sm disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {product?.id ? "ذخیره و ارسال برای بازبینی" : "ثبت محصول"}
        </button>
        <button type="button" onClick={() => router.back()} className="kid-btn kid-btn-ghost text-sm">انصراف</button>
      </div>
    </form>
  );
}
