import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp, FiClock } from 'react-icons/fi';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-blue-500', link: '/admin/users' },
    { label: 'Products', value: stats.activeProducts, icon: FiPackage, color: 'bg-green-500', link: '/admin/products' },
    { label: 'Total Orders', value: stats.totalOrders, icon: FiShoppingBag, color: 'bg-purple-500', link: '/admin/orders' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, icon: FiDollarSign, color: 'bg-yellow-500' },
    { label: "Today's Orders", value: stats.todayOrders, icon: FiTrendingUp, color: 'bg-pink-500' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: FiClock, color: 'bg-orange-500', link: '/admin/orders' }
  ];

  const revenueChartData = {
    labels: stats.last7Days?.map(d => d._id?.slice(5) || '') || [],
    datasets: [{
      label: 'Revenue',
      data: stats.last7Days?.map(d => d.revenue) || [],
      backgroundColor: 'rgba(221, 138, 43, 0.8)',
      borderColor: 'rgba(221, 138, 43, 1)',
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  const ordersChartData = {
    labels: stats.ordersByStatus?.map(s => s._id) || [],
    datasets: [{
      data: stats.ordersByStatus?.map(s => s.count) || [],
      backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#22c55e', '#14b8a6', '#64748b', '#ef4444']
    }]
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-dark-800">Dashboard</h1>
        <span className="text-dark-500">Welcome back, Admin!</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link || '#'} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-dark-500 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-dark-800">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue (Last 7 Days)</h3>
          <Bar data={revenueChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={ordersChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {stats.topProducts && stats.topProducts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-dark-500 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-dark-500 font-medium">Sold</th>
                  <th className="text-left py-3 px-4 text-dark-500 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={index} className="border-b hover:bg-dark-50">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">{product.totalSold}</td>
                    <td className="py-3 px-4">₹{product.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
