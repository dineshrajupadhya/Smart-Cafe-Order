import { TrendingUp, ShoppingBag, Users, Package, DollarSign, Activity } from "lucide-react";
import { useGetAdminDashboard, useGetRecentOrders } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#f97316",
  ready: "#22c55e",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminDashboard({ query: { refetchInterval: 15000 } as any });
  const { data: recentOrders = [] } = useGetRecentOrders();

  const statCards = stats ? [
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toFixed(0)}`, sub: `₹${stats.revenueToday.toFixed(0)} today`, icon: DollarSign, color: "text-green-600" },
    { label: "Total Orders", value: stats.totalOrders.toString(), sub: `${stats.ordersToday} today`, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Active Orders", value: stats.activeOrders.toString(), sub: "In progress", icon: Activity, color: "text-orange-600" },
    { label: "Products", value: stats.totalProducts.toString(), sub: "In catalog", icon: Package, color: "text-purple-600" },
    { label: "Users", value: stats.totalUsers.toString(), sub: "Registered", icon: Users, color: "text-pink-600" },
  ] : [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your cafeteria operations</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map(card => (
              <div key={card.label} className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Revenue (Last 7 Days)</h2>
            {stats?.revenueByDay && stats.revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.revenueByDay}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(24 95% 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(24 95% 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toFixed(2)}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(24 95% 53%)" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No revenue data yet</div>
            )}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Orders by Status</h2>
            {stats?.ordersByStatus && stats.ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {stats.ordersByStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No order data yet</div>
            )}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.slice(0, 8).map(order => (
              <div key={order.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium text-muted-foreground w-16">#{order.id}</span>
                <span className="text-sm font-medium flex-1 truncate">{order.userName ?? "Customer"}</span>
                <span className="text-sm text-muted-foreground">₹{order.total.toFixed(2)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
