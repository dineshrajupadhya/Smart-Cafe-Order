import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, MapPin, CreditCard, CheckCircle2 } from "lucide-react";
import { useGetOrder, useGetPaymentByOrder } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";

const statusSteps = ["pending", "confirmed", "preparing", "ready", "completed"] as const;

export default function OrderDetailPage() {
  const [, params] = useRoute("/orders/:id");
  const orderId = parseInt(params?.id ?? "0", 10);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, refetchInterval: 5000 } as any
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto p-8 animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto p-8 text-center py-20">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/orders"><Button variant="ghost" className="mt-4">Back to Orders</Button></Link>
      </div>
    </div>
  );

  const currentStepIndex = order.status === "cancelled"
    ? -1
    : statusSteps.indexOf(order.status as any);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="mb-6 gap-1 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Button>
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {order.status !== "cancelled" && order.status !== "completed" && (
          <div className="bg-card border border-card-border rounded-xl p-5 mb-5">
            <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Order Progress</h2>
            <div className="flex items-center gap-1">
              {statusSteps.filter(s => s !== "completed").map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`flex flex-col items-center flex-1 ${i < statusSteps.length - 2 ? "after:h-0.5 after:w-full after:mt-3 after:block" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                        {isActive && i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 capitalize text-center">{step}</span>
                    </div>
                    {i < statusSteps.filter(s => s !== "completed").length - 1 && (
                      <div className={`h-0.5 flex-1 mb-5 ${i < currentStepIndex ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {order.estimatedReadyTime && (
              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Estimated ready: {new Date(order.estimatedReadyTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}

        <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Items</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
                    {item.productName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity} · ₹{item.price.toFixed(2)} each</p>
                </div>
                <span className="text-sm font-semibold">₹{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Details</h2>
          {order.tableNumber && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Table:</span>
              <span className="font-medium">{order.tableNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Payment:</span>
            <span className="font-medium capitalize">{order.paymentMethod}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {order.paymentStatus}
            </span>
          </div>
          {order.notes && (
            <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
