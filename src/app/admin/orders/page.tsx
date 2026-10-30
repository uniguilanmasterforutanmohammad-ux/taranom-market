import { db } from "@/lib/db";
import { OrderStatusControl } from "@/components/order-status-control";
import { Badge, StatCard } from "@/components/ui";
import { ORDER_STATUS_LABEL, faDateLabel, faNum, toman } from "@/lib/format";
import { ReceiptText, TrendingUp, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "سفارش‌های پلتفرم" };

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: { buyer: { select: { name: true } }, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const paid = orders.filter((order) => order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED");
  const gmv = paid.reduce((sum, order) => sum + order.total, 0);
  const fees = paid.reduce((sum, order) => sum + order.fee, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-forest">سفارش‌های پلتفرم</h1>
        <p className="text-[11px] text-slate-500">پیگیری تراکنش‌ها و درآمد کارمزد.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="تعداد تراکنش" value={faNum(paid.length)} icon={<ReceiptText size={15} />} />
        <StatCard label="GMV" value={toman(gmv)} icon={<TrendingUp size={15} />} tone="sun" />
        <StatCard label="کارمزد پلتفرم" value={toman(fees)} icon={<Wallet size={15} />} tone="berry" />
      </div>

      <div className="space-y-2.5">
        {orders.map((order) => (
          <div key={order.id} className="kid-card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs font-black text-forest">{order.code}</p>
                <Badge tone={order.status === "DELIVERED" ? "mint" : order.status === "CANCELLED" ? "berry" : "sun"}>{ORDER_STATUS_LABEL[order.status]}</Badge>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {order.buyer.name} · {faNum(order.items.length)} قلم · {faDateLabel(order.createdAt)} · کارمزد {toman(order.fee)}
              </p>
            </div>
            <p className="text-xs font-black text-emerald-700">{toman(order.total)}</p>
            <OrderStatusControl orderId={order.id} status={order.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
