import { useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { useGetLowStockProducts, useUpdateStock, getListProductsQueryKey, getGetLowStockProductsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminStock() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useGetLowStockProducts({ query: { refetchInterval: 30000 } as any });
  const updateStock = useUpdateStock();
  const [stockValues, setStockValues] = useState<Record<number, string>>({});

  const handleUpdate = (id: number) => {
    const stock = parseInt(stockValues[id] ?? "0");
    if (isNaN(stock) || stock < 0) return;
    updateStock.mutate({ id, data: { stock } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setStockValues(v => { const n = { ...v }; delete n[id]; return n; });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Stock Alerts
            </h1>
            <p className="text-muted-foreground text-sm">Products with fewer than 10 units in stock</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-lg font-semibold">All stocked up!</p>
            <p className="text-muted-foreground text-sm mt-1">No products are running low on stock.</p>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alert Level</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-sm font-bold">{p.name.charAt(0)}</div>}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">₹{p.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-2xl font-bold ${p.stock === 0 ? "text-destructive" : p.stock < 5 ? "text-red-500" : "text-yellow-600"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.stock === 0 ? "bg-red-100 text-red-700" : p.stock < 5 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                        {p.stock === 0 ? "Out of Stock" : p.stock < 5 ? "Critical" : "Low"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          className="w-24 h-8"
                          placeholder={p.stock.toString()}
                          value={stockValues[p.id] ?? ""}
                          onChange={e => setStockValues(v => ({ ...v, [p.id]: e.target.value }))}
                        />
                        <Button size="sm" className="h-8 gap-1" onClick={() => handleUpdate(p.id)} disabled={!stockValues[p.id] || updateStock.isPending}>
                          <Save className="h-3 w-3" /> Update
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
