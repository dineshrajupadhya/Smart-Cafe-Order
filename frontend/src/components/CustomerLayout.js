import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-dark-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">SC</span>
                </div>
                <span className="text-xl font-bold">Smart Cafe</span>
              </div>
              <p className="text-dark-300 text-sm">Order smart, eat fresh. Your favorite food delivered to your table.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-dark-300 text-sm">
                <li><a href="/menu" className="hover:text-primary-400">Menu</a></li>
                <li><a href="/orders" className="hover:text-primary-400">My Orders</a></li>
                <li><a href="/profile" className="hover:text-primary-400">Profile</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-dark-300 text-sm">
                <li>Phone: +91 1234567890</li>
                <li>Email: info@smartcafe.com</li>
                <li>Address: 123 Food Street, Cafe City</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-700 mt-8 pt-6 text-center text-dark-400 text-sm">
            © 2026 Smart Cafe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
