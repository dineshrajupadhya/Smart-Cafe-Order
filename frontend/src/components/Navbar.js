import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">SC</span>
            </div>
            <span className="text-xl font-bold text-dark-800 hidden sm:block">Smart Cafe</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-dark-600 hover:text-primary-500 transition-colors">Home</Link>
            <Link to="/menu" className="text-dark-600 hover:text-primary-500 transition-colors">Menu</Link>
            <Link to="/orders" className="text-dark-600 hover:text-primary-500 transition-colors">My Orders</Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-dark-600 hover:text-primary-500 transition-colors">
              <FiSearch size={20} />
            </button>

            <Link to="/cart" className="relative p-2 text-dark-600 hover:text-primary-500 transition-colors">
              <FiShoppingCart size={20} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            <div className="relative">
              <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-dark-600 hover:text-primary-500 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser size={16} className="text-primary-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.name?.split(' ')[0]}</span>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-dark-600 hover:bg-dark-50" onClick={() => setIsOpen(false)}>
                    <FiUser size={16} /> Profile
                  </Link>
                  <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-dark-600 hover:bg-dark-50" onClick={() => setIsOpen(false)}>
                    <FiPackage size={16} /> My Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-dark-600 hover:bg-dark-50" onClick={() => setIsOpen(false)}>
                      <FiSettings size={16} /> Admin Dashboard
                    </Link>
                  )}
                  <hr className="my-2" />
                  <button onClick={() => { logout(); setIsOpen(false); }} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 w-full">
                    <FiLogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-dark-600">
              {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t bg-dark-50">
          <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 py-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Search for food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}

      {isOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-2 space-y-2">
            <Link to="/" className="block py-2 text-dark-600" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/menu" className="block py-2 text-dark-600" onClick={() => setIsOpen(false)}>Menu</Link>
            <Link to="/orders" className="block py-2 text-dark-600" onClick={() => setIsOpen(false)}>My Orders</Link>
            <Link to="/profile" className="block py-2 text-dark-600" onClick={() => setIsOpen(false)}>Profile</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="block py-2 text-primary-500 font-medium" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
