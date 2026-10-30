import { db } from "@/lib/db";
import { CategoryForm } from "@/components/category-form";
import { faNum } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "دسته‌بندی‌ها" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sort: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-forest">دسته‌بندی‌ها</h1>
        <p className="text-[11px] text-slate-500">{faNum(categories.length)} دسته فعال؛ دسته‌های تازه بلافاصله در فرم محصول ظاهر می‌شوند.</p>
      </div>

      <div className="kid-card p-4"><CategoryForm /></div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {categories.map((category) => (
          <div key={category.id} className="kid-card flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: category.tint }}>{category.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-forest">{category.title}</p>
              <p className="text-[10px] text-slate-400">{faNum(category._count.products)} محصول · {category.slug}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
