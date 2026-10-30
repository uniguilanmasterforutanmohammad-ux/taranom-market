import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCard as ProductCardType } from "@/lib/products";
import { PRODUCT_TYPE_LABEL, faNum, toman } from "@/lib/format";
import { Badge } from "./ui";

const TYPE_TONE = {
  PHYSICAL: "sky",
  SERVICE: "clay",
  DIGITAL: "mint",
} as const;

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <Link href={`/product/${product.id}`} className="kid-card kid-card-hover group flex flex-col overflow-hidden">
      <div
        className="relative flex h-40 items-center justify-center overflow-hidden"
        style={{ backgroundColor: product.category.tint }}
      >
        <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/40" />
        <span className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/30" />
        <span className="text-6xl transition-transform duration-300 group-hover:scale-110">{product.category.emoji}</span>
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1.5">
          {product.featured ? <Badge tone="sun" className="shadow-sm">⭐ پیشنهاد ویژه</Badge> : null}
          <Badge tone={TYPE_TONE[product.type]} className="bg-white/90">{PRODUCT_TYPE_LABEL[product.type]}</Badge>
        </div>
        <div className="absolute bottom-2 left-2 rounded-xl bg-white/95 px-2.5 py-1 text-xs font-black text-forest shadow-sm">
          {toman(product.price)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-black text-forest">{product.title}</h3>
          {product.rating > 0 ? (
            <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-amber-600">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {faNum(product.rating)}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{product.description}</p>
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-emerald-900/10 pt-2.5">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: product.seller.avatarColor }} />
            {product.seller.name}
          </span>
          <span className="text-[11px] font-bold text-emerald-700">{product.category.emoji} {product.category.title}</span>
        </div>
      </div>
    </Link>
  );
}
