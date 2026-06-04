import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Home from './pages/customer/Home';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderTracking from './pages/customer/OrderTracking';
import MyOrders from './pages/customer/MyOrders';
import Profile from './pages/customer/Profile';
import QRScan from './pages/customer/QRScan';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminStock from './pages/admin/AdminStock';
import AdminReports from './pages/admin/AdminReports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminQR from './pages/admin/AdminQR';
import AdminLayout from './components/AdminLayout';
import CustomerLayout from './components/CustomerLayout';
import PageTransition from './components/PageTransition';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  return user && user.role === 'admin' ? children : <Navigate to="/login" />;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  return !user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
              <Route path="/scan" element={<QRScan />} />

              <Route path="/" element={<PrivateRoute><PageTransition><CustomerLayout /></PageTransition></PrivateRoute>}>
                <Route index element={<Home />} />
                <Route path="menu" element={<Menu />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<MyOrders />} />
                <Route path="track/:orderNumber" element={<OrderTracking />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="stock" element={<AdminStock />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="qr" element={<AdminQR />} />
                <Route path="reports" element={<AdminReports />} />
              </Route>
            </Routes>
          </Router>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
