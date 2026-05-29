import { Plus, Minus, Leaf, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAddCartItem, useUpdateCartItem, useRemoveCartItem, useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  stock: number;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  preparationTime?: number | null;
  calories?: number | null;
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated } as any });
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const addItem = useAddCartItem();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const cartItem = cart?.items.find(i => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

  const handleAdd = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    addItem.mutate({ data: { productId: product.id, quantity: 1 } }, { onSuccess: invalidate });
  };

  const handleIncrease = () => {
    updateItem.mutate({ productId: product.id, data: { quantity: qty + 1 } }, { onSuccess: invalidate });
  };

  const handleDecrease = () => {
    if (qty <= 1) {
      removeItem.mutate({ productId: product.id }, { onSuccess: invalidate });
    } else {
      updateItem.mutate({ productId: product.id, data: { quantity: qty - 1 } }, { onSuccess: invalidate });
    }
  };

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-muted">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/30 font-bold">
            {product.name.charAt(0)}
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {product.isVegetarian && (
            <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Leaf className="h-3 w-3" /> Veg
            </span>
          )}
          {product.isSpicy && (
            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Flame className="h-3 w-3" /> Spicy
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {product.preparationTime && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{product.preparationTime}m</span>
          )}
          {product.calories && <span>{product.calories} cal</span>}
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-foreground">₹{product.price.toFixed(2)}</span>
          {product.isAvailable ? (
            qty > 0 ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={handleDecrease} disabled={updateItem.isPending || removeItem.isPending}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-semibold w-4 text-center">{qty}</span>
                <Button size="sm" className="h-7 w-7 p-0" onClick={handleIncrease} disabled={updateItem.isPending}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={handleAdd} disabled={addItem.isPending} className="h-8">
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            )
          ) : (
            <span className="text-xs text-muted-foreground">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}
