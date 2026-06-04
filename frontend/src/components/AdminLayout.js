import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLayout, FiPackage, FiShoppingBag, FiBox, FiUsers, FiTag, FiBarChart2, FiMenu, FiX, FiLogOut, FiChevronLeft, FiGrid } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/admin', icon: FiLayout, label: 'Dashboard' },
    { path: '/admin/products', icon: FiPackage, label: 'Products' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
    { path: '/admin/stock', icon: FiBox, label: 'Stock' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/coupons', icon: FiTag, label: 'Coupons' },
    { path: '/admin/qr', icon: FiGrid, label: 'QR Codes' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-dark-100">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SC</span>
            </div>
            <span className="font-bold text-dark-800">Admin Panel</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <FiX size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50">
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <FiMenu size={24} />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-dark-500 hover:text-primary-500">
              <FiChevronLeft size={20} />
              <span className="text-sm">Back to Store</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-600">Welcome,</span>
            <span className="font-medium text-dark-800">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default AdminLayout;
