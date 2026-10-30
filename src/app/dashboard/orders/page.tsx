import { PackageCheck, ReceiptText, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModuleStates } from "@/lib/module-service";
import { MODULE_MAP } from "@/lib/modules";
import { ModuleOff } from "@/components/module-off";
import { OrderStatusControl } from "@/components/order-status-control";
import { Badge, StatCard } from "@/components/ui";
import { ORDER_STATUS_LABEL, faDateLabel, faNum, toman } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "سفارش‌ها" };

function statusTone(status: string) {
  if (status === "DELIVERED") return "mint" as const;
  if (status === "CANCELLED") return "berry" as const;
  if (status === "PAID" || status === "PREPARING" || status === "SHIPPED") return "sun" as const;
  return "slate" as const;
}

export default async function OrdersPage() {
  const user = await requireUser();
  const states = await getModuleStates(user);
  if (!states.find((state) => state.module.key === "orders")?.enabled) {
    return <ModuleOff module={MODULE_MAP.orders} />;
  }

  const [sellerItems, buyerOrders] = await Promise.all([
    db.orderItem.findMany({
      where: { sellerId: user.id },
      include: { order: { include: { buyer: { select: { name: true, avatarColor: true } } } } },
      orderBy: { order: { createdAt: "desc" } },
    }),
    db.order.findMany({ where: { buyerId: user.id }, include: { items: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const orderMap = new Map<string, { order: (typeof sellerItems)[number]["order"]; items: typeof sellerItems }>();
  for (const item of sellerItems) {
    const entry = orderMap.get(item.orderId) ?? { order: item.order, items: [] };
    entry.items.push(item);
    orderMap.set(item.orderId, entry);
  }
  const sellerOrders = [...orderMap.values()];
  const gross = sellerOrders
    .filter(({ order }) => ["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status))
    .reduce((sum, { items }) => sum + items.reduce((inner, item) => inner + item.unitPrice * item.quantity, 0), 0);
  const net = Math.round(gross * 0.93);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-forest">سفارش‌ها</h1>
        <p className="text-[11px] text-slate-500">وضعیت سفارش‌های فروش و خرید را اینجا پیگیری کن.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="سفارش‌های فروش" value={faNum(sellerOrders.length)} icon={<ReceiptText size={15} />} />
        <StatCard label="فروش ناخالص" value={toman(gross)} icon={<PackageCheck size={15} />} tone="sun" />
        <StatCard label="درآمد پس از کارمزد" value={toman(net)} hint="کارمزد پلتفرم ۷٪" icon={<Wallet size={15} />} tone="berry" />
      </div>

      <section className="space-y-2.5">
        <h2 className="text-sm font-black text-forest">فروش‌های من</h2>
        {sellerOrders.length === 0 ? (
          <p className="kid-card p-5 text-center text-xs text-slate-500">هنوز سفارشی برای محصولاتت ثبت نشده است.</p>
        ) : (
          sellerOrders.map(({ order, items }) => (
            <div key={order.id} className="kid-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-forest">{order.code}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{faDateLabel(order.createdAt)} · خریدار: {order.buyer.name}</p>
                </div>
                <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABEL[order.status]}</Badge>
              </div>
              <div className="mt-2 space-y-1 border-t border-dashed border-emerald-900/10 pt-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{item.title} × {faNum(item.quantity)}</span>
                    <span className="font-bold text-forest">{toman(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400">سهم شما پس از کارمزد: <span className="font-black text-emerald-700">{toman(Math.round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 0.93))}</span></p>
                <OrderStatusControl orderId={order.id} status={order.status} />
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-black text-forest">خریدهای من</h2>
        {buyerOrders.length === 0 ? (
          <p className="kid-card p-5 text-center text-xs text-slate-500">هنوز خریدی ثبت نکرده‌ای.</p>
        ) : (
          buyerOrders.map((order) => (
            <div key={order.id} className="kid-card flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="text-xs font-black text-forest">{order.code}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{faDateLabel(order.createdAt)} · {order.items.length} قلم · {toman(order.total)}</p>
              </div>
              <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
