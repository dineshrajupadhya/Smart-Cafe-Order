import { useState } from "react";
import { useGetSalesReport, useGetTopProducts, useGetCategoryBreakdown } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444"];

export default function AdminReports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: sales } = useGetSalesReport(from || to ? { from: from || undefined, to: to || undefined } : undefined, { query: { refetchOnWindowFocus: false } as any });
  const { data: topProducts = [] } = useGetTopProducts();
  const { data: categoryBreakdown = [] } = useGetCategoryBreakdown();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">Sales analytics and insights</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From:</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">To:</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Revenue", value: sales ? `₹${sales.totalRevenue.toFixed(2)}` : "—" },
            { label: "Total Orders", value: sales?.totalOrders.toString() ?? "—" },
            { label: "Avg Order Value", value: sales ? `₹${sales.averageOrderValue.toFixed(2)}` : "—" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-card-border rounded-xl p-5 text-center">
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Daily Revenue</h2>
          {sales?.dailyData && sales.dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={sales.dailyData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={(v: number) => [`₹${v.toFixed(2)}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data for selected period</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Top Products</h2>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.slice(0, 8).map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-7 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.productName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1.5 rounded-full bg-muted flex-1">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(p.totalQuantity / topProducts[0].totalQuantity) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{p.totalQuantity} sold</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">₹{p.totalRevenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8 text-muted-foreground text-sm">No sales data yet</div>}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Revenue by Category</h2>
            {categoryBreakdown.filter(c => c.revenue > 0).length > 0 ? (
              <div className="space-y-3">
                {categoryBreakdown.filter(c => c.revenue > 0).map((cat, i) => (
                  <div key={cat.categoryId} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate">{cat.categoryName}</span>
                        <span className="text-muted-foreground ml-2">{cat.percentage}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">₹{cat.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8 text-muted-foreground text-sm">No revenue data yet</div>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
