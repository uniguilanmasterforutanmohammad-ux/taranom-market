import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/products";
import { getModuleStates, getQuota, consentBlocked } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { ProductForm } from "@/components/product-form";
import { Alert } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ثبت محصول" };

export default async function NewProductPage() {
  const user = await requireUser();
  const states = await getModuleStates(user);
  const uploadState = states.find((state) => state.module.key === "productUpload");

  if (!uploadState?.enabled) return <ModuleOff module={MODULE_MAP.productUpload} />;

  const [categories, quota] = await Promise.all([getCategories(), getQuota(user)]);
  const blocked = consentBlocked(user);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-forest">ثبت ساختهٔ جدید</h1>
        <p className="text-[11px] text-slate-500">فرم کوتاه است؛ فقط چیزهایی را پر کن که برای معرفی لازم است.</p>
      </div>

      {blocked ? (
        <Alert
          tone="berry"
          title="اول تأیید والدین"
          action={<Link href="/parent" className="kid-btn kid-btn-ghost !py-1.5 text-[11px]">پنل والدین</Link>}
        >
          تا زمانی که والدین رضایتشان را تأیید نکنند، ثبت محصول ممکن نیست. این محدودیت در سرور هم اعمال می‌شود.
        </Alert>
      ) : null}

      <ProductForm categories={categories.map((category) => ({ id: category.id, title: category.title, emoji: category.emoji }))} quotaRemaining={quota.remaining} />
    </div>
  );
}
