import { Link } from "wouter";
import { ClipboardList, ChevronRight } from "lucide-react";
import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const { data: orders = [], isLoading } = useListOrders(undefined, { query: { enabled: isAuthenticated, refetchInterval: 10000 } as any });

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto p-8 text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Sign in to view orders</h2>
        <Link href="/login"><Button>Sign in</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Place your first order from our menu.</p>
            <Link href="/"><Button>Browse Menu</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {[...orders].reverse().map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-sm">Order #{order.id}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} · ₹{order.total.toFixed(2)}
                      {order.tableNumber && ` · Table ${order.tableNumber}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
