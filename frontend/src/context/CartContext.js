import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], discount: 0, couponCode: null });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.cart);
    } catch (err) {
      console.error('Cart fetch error:', err);
    }
  };

  const addToCart = async (productId, quantity = 1, specialInstructions = '') => {
    try {
      setLoading(true);
      const res = await api.post('/cart/add', { productId, quantity, specialInstructions });
      setCart(res.data.cart);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/item/${itemId}`, { quantity });
      setCart(res.data.cart);
    } catch (err) {
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/cart/item/${itemId}`);
      setCart(res.data.cart);
      toast.success('Removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCart({ items: [], discount: 0, couponCode: null });
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  };

  const applyCoupon = async (couponCode) => {
    try {
      const res = await api.post('/cart/coupon', { couponCode });
      setCart(res.data.cart);
      toast.success(`Coupon applied! You saved ₹${res.data.discount}`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      return false;
    }
  };

  const getCartTotal = () => {
    return cart.items.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart, loading, addToCart, updateCartItem, removeFromCart,
      clearCart, applyCoupon, getCartTotal, getCartCount, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
