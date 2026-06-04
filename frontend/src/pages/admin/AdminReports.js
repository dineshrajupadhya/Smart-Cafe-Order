import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const AdminReports = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [customerReport, setCustomerReport] = useState(null);
  const [paymentReport, setPaymentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const [sales, inventory, customer, payment] = await Promise.all([
        api.get(`/reports/sales?${params.toString()}`),
        api.get('/reports/inventory'),
        api.get('/reports/customers'),
        api.get(`/reports/payments?${params.toString()}`)
      ]);

      setSalesReport(sales.data.report);
      setInventoryReport(inventory.data.report);
      setCustomerReport(customer.data.report);
      setPaymentReport(payment.data.report);
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

  const tabs = [
    { id: 'sales', label: 'Sales' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'customers', label: 'Customers' },
    { id: 'payments', label: 'Payments' }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Reports</h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className="input-field text-sm"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-white text-dark-600 hover:bg-dark-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && salesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Revenue</h3>
              <Bar
                data={{
                  labels: salesReport.sales?.map(s => s._id?.slice(5) || '') || [],
                  datasets: [{
                    label: 'Revenue',
                    data: salesReport.sales?.map(s => s.totalRevenue) || [],
                    backgroundColor: 'rgba(221, 138, 43, 0.8)',
                    borderRadius: 6
                  }]
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Category Sales</h3>
              <Pie
                data={{
                  labels: salesReport.categorySales?.map(c => c._id) || [],
                  datasets: [{
                    data: salesReport.categorySales?.map(c => c.totalRevenue) || [],
                    backgroundColor: ['#dd8a2b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316']
                  }]
                }}
                options={{ responsive: true }}
              />
            </div>
          </div>

          {salesReport.topProducts?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Top Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-dark-500">Product</th>
                      <th className="text-left py-3 px-4 text-dark-500">Sold</th>
                      <th className="text-left py-3 px-4 text-dark-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.topProducts.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4 font-medium">{p.name}</td>
                        <td className="py-3 px-4">{p.totalSold}</td>
                        <td className="py-3 px-4">₹{p.totalRevenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && inventoryReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-dark-800">{inventoryReport.totalProducts}</p>
              <p className="text-dark-500">Total Products</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-green-500">{inventoryReport.totalProducts - inventoryReport.outOfStock - inventoryReport.lowStock}</p>
              <p className="text-dark-500">In Stock</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-yellow-500">{inventoryReport.lowStock}</p>
              <p className="text-dark-500">Low Stock</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-red-500">{inventoryReport.outOfStock}</p>
              <p className="text-dark-500">Out of Stock</p>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Stock Value: ₹{inventoryReport.totalStockValue.toFixed(2)}</h3>
          </div>
        </div>
      )}

      {activeTab === 'customers' && customerReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-dark-800">{customerReport.totalUsers}</p>
              <p className="text-dark-500">Total Customers</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-primary-500">{customerReport.newUsersThisMonth}</p>
              <p className="text-dark-500">New This Month</p>
            </div>
          </div>

          {customerReport.topCustomers?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-dark-500">Customer</th>
                      <th className="text-left py-3 px-4 text-dark-500">Orders</th>
                      <th className="text-left py-3 px-4 text-dark-500">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReport.topCustomers.map((c, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-dark-400">{c.email}</p>
                        </td>
                        <td className="py-3 px-4">{c.totalOrders}</td>
                        <td className="py-3 px-4">₹{c.totalSpent.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && paymentReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-dark-800">{paymentReport.totalTransactions}</p>
              <p className="text-dark-500">Total Transactions</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-green-500">{paymentReport.successRate}%</p>
              <p className="text-dark-500">Success Rate</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-3xl font-bold text-red-500">{paymentReport.failedPayments}</p>
              <p className="text-dark-500">Failed</p>
            </div>
          </div>

          {paymentReport.paymentsByMethod?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Payments by Method</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {paymentReport.paymentsByMethod.map((method, i) => (
                  <div key={i} className="p-4 bg-dark-50 rounded-lg text-center">
                    <p className="text-lg font-bold capitalize">{method._id}</p>
                    <p className="text-dark-500">{method.count} transactions</p>
                    <p className="text-primary-500 font-medium">₹{method.totalAmount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
