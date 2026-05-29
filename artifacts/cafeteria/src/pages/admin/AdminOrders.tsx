import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, RefreshCw } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed", confirmed: "preparing", preparing: "ready", ready: "completed"
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
  const { data: orders = [], isLoading, refetch } = useListOrders(
    filterStatus ? { status: filterStatus } : undefined,
    { query: { refetchInterval: 8000 } as any }
  );
  const updateStatus = useUpdateOrderStatus();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });

  const handleStatusChange = (id: number, status: OrderStatus) => {
    updateStatus.mutate({ id, data: { status } }, { onSuccess: invalidate });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-muted-foreground text-sm">Manage all customer orders</p></div>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => refetch()}><RefreshCw className="h-4 w-4" />Refresh</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterStatus("")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>All</button>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...orders].reverse().map(order => {
                  const nextStatus = NEXT_STATUS[order.status as OrderStatus];
                  return (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">#{order.id}{order.tableNumber && <span className="text-xs text-muted-foreground ml-1">T-{order.tableNumber}</span>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.userName ?? "Customer"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.items.length} items</td>
                      <td className="px-4 py-3 font-medium">₹{order.total.toFixed(2)}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{order.paymentMethod}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {nextStatus && (
                            <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleStatusChange(order.id, nextStatus)} disabled={updateStatus.isPending}>
                              Mark {nextStatus}
                            </Button>
                          )}
                          {order.status !== "cancelled" && order.status !== "completed" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-destructive hover:text-destructive" onClick={() => handleStatusChange(order.id, "cancelled")} disabled={updateStatus.isPending}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
