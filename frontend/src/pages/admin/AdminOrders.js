import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiEye } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      params.append('limit', '100');
      const res = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      preparing: 'badge-info',
      ready: 'badge-success',
      served: 'badge-success',
      delivered: 'badge-success',
      'out-for-delivery': 'badge-info',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusOptions = (order) => {
    const base = ['pending', 'confirmed', 'preparing', 'ready'];
    if (order.orderType === 'delivery') {
      return [...base, 'out-for-delivery', 'delivered', 'cancelled'];
    }
    return [...base, 'served', 'cancelled'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Orders</h1>
        <button onClick={fetchOrders} className="btn-outline flex items-center gap-2">
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'served', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white text-dark-600 hover:bg-dark-50'
            }`}
          >
            {status ? (status === 'out-for-delivery' ? 'On the Way' : status) : 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-50">
              <tr>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Order</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Customer</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Items</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Total</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className="border-t hover:bg-dark-50">
                  <td className="py-3 px-4">
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-dark-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{order.user?.name}</p>
                    <p className="text-xs text-dark-400">{order.orderType}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-600">{order.items.length} items</td>
                  <td className="py-3 px-4 font-medium">₹{order.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedOrder(order)} className="p-2 text-dark-400 hover:text-primary-500">
                        <FiEye size={16} />
                      </button>
                      {order.status !== 'served' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <select
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                          value=""
                        >
                          <option value="" disabled>Update</option>
                          {getStatusOptions(order).filter(s => s !== order.status).map(s => (
                            <option key={s} value={s}>{s === 'out-for-delivery' ? 'On the Way' : s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-dark-400 hover:text-dark-600">&times;</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-dark-500">Customer</p>
                  <p className="font-medium">{selectedOrder.user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">Order Type</p>
                  <p className="font-medium capitalize">{selectedOrder.orderType}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">Payment</p>
                  <p className="font-medium capitalize">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">Payment Status</p>
                  <span className={`badge ${selectedOrder.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2 mb-4">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <h3 className="font-semibold mb-2">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {getStatusOptions(selectedOrder).filter(s => s !== selectedOrder.status && s !== 'cancelled').map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selectedOrder._id, s)}
                    className="btn-outline text-sm capitalize"
                  >
                    {s === 'out-for-delivery' ? 'On the Way' : s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
