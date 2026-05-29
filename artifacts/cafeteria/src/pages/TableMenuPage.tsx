import { useRoute } from "wouter";
import { QrCode } from "lucide-react";
import { useGetTableMenu } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TableMenuPage() {
  const [, params] = useRoute("/menu/table/:tableNumber");
  const tableNumber = params?.tableNumber ?? "";
  const { data, isLoading } = useGetTableMenu(tableNumber, { query: { enabled: !!tableNumber } as any });
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const products = (data?.products ?? []).filter(p =>
    selectedCategory === null ? true : p.categoryId === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <QrCode className="h-8 w-8 opacity-80" />
          <div>
            <h1 className="text-2xl font-bold">Table {tableNumber}</h1>
            <p className="text-primary-foreground/80 text-sm">Scan to order directly from your table</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              <button onClick={() => setSelectedCategory(null)} className={cn("whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-colors", selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>All</button>
              {data?.categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={cn("whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-colors", selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{cat.name}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
