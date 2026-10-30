import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
import { getCategories, listApprovedProducts } from "@/lib/products";
import { PRODUCT_TYPE_LABEL, cx, faNum } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPES = ["PHYSICAL", "SERVICE", "DIGITAL"] as const;
const SORTS = [
  { key: "newest", label: "تازه‌ترین" },
  { key: "popular", label: "پربازدیدترین" },
  { key: "price-asc", label: "ارزان‌ترین" },
  { key: "price-desc", label: "گران‌ترین" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = one(params.q).trim();
  const category = one(params.category);
  const type = one(params.type);
  const sort = one(params.sort) || "newest";

  const [products, categories] = await Promise.all([
    listApprovedProducts({ q: q || undefined, category: category || undefined, type: type || undefined, sort }),
    getCategories(),
  ]);

  const activeCategory = categories.find((item) => item.slug === category);
  const buildHref = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (type) next.set("type", type);
    if (sort && sort !== "newest") next.set("sort", sort);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    return query ? `/explore?${query}` : "/explore";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-emerald-900/10 bg-gradient-to-l from-emerald-100 via-cream to-amber-50 p-6 sm:p-8">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="relative">
          <Badge tone="mint"><Sparkles size={12} /> ویترین بازارچه</Badge>
          <h1 className="mt-3 text-3xl font-black text-forest sm:text-4xl">
            {activeCategory ? `${activeCategory.emoji} ${activeCategory.title}` : "بگرد، کشف کن، تشویق کن"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            همهٔ محصولات این صفحه توسط تیم ایمنی بررسی و تأیید شده‌اند. با خرید یا تشویق، به سازندهٔ کوچک انگیزه بده.
          </p>
        </div>
      </div>

      <div className="kid-card mt-5 p-4">
        <form action="/explore" className="grid gap-3 md:grid-cols-[1fr_170px_170px_auto]">
          <label className="relative">
            <span className="sr-only">جست‌وجو</span>
            <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700" />
            <input name="q" defaultValue={q} placeholder="نام محصول یا برچسب…" className="kid-field !pr-9" />
          </label>
          <label>
            <span className="sr-only">نوع محصول</span>
            <select name="type" defaultValue={type} className="kid-field">
              <option value="">همهٔ انواع</option>
              {TYPES.map((item) => (
                <option key={item} value={item}>{PRODUCT_TYPE_LABEL[item]}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">ترتیب</span>
            <select name="sort" defaultValue={sort} className="kid-field">
              {SORTS.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </label>
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <button type="submit" className="kid-btn kid-btn-primary">
            <SlidersHorizontal size={16} /> اعمال
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link href={buildHref({ category: "" })} className={cx("rounded-full border px-3 py-1 text-[11px] font-bold transition", !category ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-900/10 bg-white text-emerald-800 hover:bg-emerald-50")}>
            همه
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={buildHref({ category: item.slug })}
              className={cx("rounded-full border px-3 py-1 text-[11px] font-bold transition", category === item.slug ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-900/10 bg-white text-emerald-800 hover:bg-emerald-50")}
            >
              {item.emoji} {item.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500">
          {faNum(products.length)} محصول تأییدشده
          {q ? <span> برای «{q}»</span> : null}
        </p>
        {(q || category || type) ? (
          <Link href="/explore" className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900">پاک کردن فیلترها</Link>
        ) : null}
      </div>

      {products.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            emoji="🔍"
            title="چیزی پیدا نشد"
            body="با عبارت دیگری جست‌وجو کن یا فیلترها را بردار. شاید هم هنوز کسی چنین ساخته‌ای ثبت نکرده باشد!"
            action={<Link href="/explore" className="kid-btn kid-btn-primary text-sm">دیدن همهٔ محصولات</Link>}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
