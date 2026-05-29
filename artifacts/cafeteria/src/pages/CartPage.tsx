import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import {
  useGetCart, useUpdateCartItem, useRemoveCartItem, useClearCart,
  useCreateOrder, getGetCartQueryKey, getListOrdersQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { data: cart, isLoading } = useGetCart({ query: { enabled: isAuthenticated } as any });
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const createOrder = useCreateOrder();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto p-8 text-center py-20">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your cart</h2>
        <Link href="/login"><Button>Sign in</Button></Link>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto p-8 space-y-4 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
      </div>
    </div>
  );

  const items = cart?.items ?? [];

  if (items.length === 0) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto p-8 text-center py-20">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some delicious items to your cart first.</p>
        <Link href="/"><Button>Browse Menu</Button></Link>
      </div>
    </div>
  );

  const handlePlaceOrder = () => {
    setOrdering(true);
    setOrderError("");
    createOrder.mutate(
      { data: { tableNumber: tableNumber || undefined, notes: notes || undefined, paymentMethod } },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          navigate(`/orders/${order.id}`);
        },
        onError: (err: any) => {
          setOrderError(err?.data?.error ?? "Failed to place order");
          setOrdering(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => clearCart.mutate(undefined, { onSuccess: invalidate })}>
            Clear All
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productName} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                    {item.productName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-muted-foreground text-sm">₹{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => { if (item.quantity <= 1) { removeItem.mutate({ productId: item.productId }, { onSuccess: invalidate }); } else { updateItem.mutate({ productId: item.productId, data: { quantity: item.quantity - 1 } }, { onSuccess: invalidate }); } }}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button size="sm" className="h-8 w-8 p-0" onClick={() => updateItem.mutate({ productId: item.productId, data: { quantity: item.quantity + 1 } }, { onSuccess: invalidate })}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-semibold text-sm w-16 text-right">₹{item.subtotal.toFixed(2)}</span>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0" onClick={() => removeItem.mutate({ productId: item.productId }, { onSuccess: invalidate })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-base">Order Details</h2>
              <div className="space-y-2">
                <Label>Table Number (optional)</Label>
                <Input placeholder="e.g. T-12" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Special Notes (optional)</Label>
                <Input placeholder="Extra spicy, no onions..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "card", "upi"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${paymentMethod === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({cart?.itemCount} items)</span>
                <span>₹{cart?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (5%)</span>
                <span>₹{((cart?.total ?? 0) * 0.05).toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₹{((cart?.total ?? 0) * 1.05).toFixed(2)}</span>
              </div>
              {orderError && <p className="text-sm text-destructive">{orderError}</p>}
              <Button className="w-full gap-2" onClick={handlePlaceOrder} disabled={ordering || createOrder.isPending}>
                Place Order <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
