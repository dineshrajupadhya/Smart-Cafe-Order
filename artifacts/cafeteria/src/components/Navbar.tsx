import { Link, useLocation } from "wouter";
import { ShoppingCart, User, LogOut, ChefHat, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMe } from "@workspace/api-client-react";
import { useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { data: user } = useGetMe({ query: { enabled: isAuthenticated } as any });
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated } as any });
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const cartCount = cart?.itemCount ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <ChefHat className="h-6 w-6" />
            <span>CafeteriaHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              Menu
            </Link>
            {isAuthenticated && (
              <Link href="/orders" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/orders") ? "text-primary" : "text-muted-foreground"}`}>
                My Orders
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/admin") ? "text-primary" : "text-muted-foreground"}`}>
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link href="/register"><Button size="sm">Sign Up</Button></Link>
              </div>
            )}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border space-y-2">
            <Link href="/" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Menu</Link>
            {isAuthenticated && (
              <Link href="/orders" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>My Orders</Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            {isAuthenticated ? (
              <button className="flex items-center gap-2 py-2 text-sm font-medium text-destructive" onClick={() => { logout(); setMobileOpen(false); }}>
                <LogOut className="h-4 w-4" /> Logout
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}><Button variant="outline" size="sm">Login</Button></Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}><Button size="sm">Sign Up</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
