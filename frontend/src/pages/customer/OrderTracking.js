import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiClock, FiPackage, FiTruck, FiCheckCircle, FiArrowLeft, FiMapPin } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const { socket, joinOrderRoom } = useSocket();
  const orderIdRef = useRef(null);

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  useEffect(() => {
    if (!socket || !orderIdRef.current) return;

    const roomId = orderIdRef.current;
    joinOrderRoom(roomId);

    const handleOrderUpdate = (data) => {
      if (data.orderId === roomId) {
        setOrder(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
            statusHistory: [...prev.statusHistory, { status: data.status, timestamp: data.timestamp }]
          };
        });
      }
    };

    socket.on('order-update', handleOrderUpdate);
    return () => socket.off('order-update', handleOrderUpdate);
  }, [socket, orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/my-orders?limit=100`);
      const foundOrder = res.data.orders.find(o => o.orderNumber === orderNumber);
      if (foundOrder) {
        orderIdRef.current = foundOrder._id;
        setOrder(foundOrder);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsReceived = async () => {
    try {
      setReceiving(true);
      await api.put(`/orders/${order._id}/received`);
      setOrder(prev => ({
        ...prev,
        status: 'served',
        statusHistory: [...prev.statusHistory, { status: 'served', timestamp: new Date().toISOString() }]
      }));
      toast.success('Order marked as received!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as received');
    } finally {
      setReceiving(false);
    }
  };

  const getStatusSteps = () => {
    const isDelivery = order?.orderType === 'delivery';

    if (isDelivery) {
      return [
        { key: 'pending', label: 'Order Placed', icon: FiPackage, color: 'text-orange-500', bg: 'bg-orange-500', lightBg: 'bg-orange-50' },
        { key: 'confirmed', label: 'Confirmed', icon: FiCheck, color: 'text-blue-500', bg: 'bg-blue-500', lightBg: 'bg-blue-50' },
        { key: 'preparing', label: 'Preparing', icon: FiClock, color: 'text-purple-500', bg: 'bg-purple-500', lightBg: 'bg-purple-50' },
        { key: 'ready', label: 'Ready', icon: FiCheckCircle, color: 'text-yellow-500', bg: 'bg-yellow-500', lightBg: 'bg-yellow-50' },
        { key: 'out-for-delivery', label: 'On the Way', icon: FiTruck, color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50' },
        { key: 'delivered', label: 'Delivered', icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-600', lightBg: 'bg-green-50' },
      ];
    }

    return [
      { key: 'pending', label: 'Order Placed', icon: FiPackage, color: 'text-orange-500', bg: 'bg-orange-500', lightBg: 'bg-orange-50' },
      { key: 'confirmed', label: 'Confirmed', icon: FiCheck, color: 'text-blue-500', bg: 'bg-blue-500', lightBg: 'bg-blue-50' },
      { key: 'preparing', label: 'Preparing', icon: FiClock, color: 'text-purple-500', bg: 'bg-purple-500', lightBg: 'bg-purple-50' },
      { key: 'ready', label: 'Ready', icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-500', lightBg: 'bg-green-50' },
      { key: 'served', label: 'Received', icon: FiTruck, color: 'text-emerald-600', bg: 'bg-emerald-600', lightBg: 'bg-emerald-50' },
    ];
  };

  const getTimestampForStep = (stepKey) => {
    if (!order?.statusHistory) return null;
    const entry = order.statusHistory.find(h => h.status === stepKey);
    return entry ? entry.timestamp : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-dark-800 mb-4">Order not found</h2>
        <Link to="/orders" className="btn-primary">View My Orders</Link>
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivery = order.orderType === 'delivery';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link to="/orders" className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-500 mb-6 transition-colors">
          <FiArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Orders</span>
        </Link>
      </motion.div>

      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-dark-800">Track Order</h1>
        <p className="text-dark-500 mt-2">Order #{order.orderNumber}</p>
        <p className="text-sm text-dark-400 mt-1">
          {isDelivery ? 'Delivery Order' : order.orderType === 'dine-in' ? `Dine In — Table ${order.tableNumber}` : 'Takeaway Order'}
          {' • '}
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </motion.div>

      {isCancelled ? (
        <motion.div
          className="card p-8 mb-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Order Cancelled</h2>
          <p className="text-dark-500">This order has been cancelled.</p>
        </motion.div>
      ) : (
        <motion.div
          className="card p-8 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <div className="flex items-center justify-between relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const stepStatus = index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'current' : 'upcoming';
                const timestamp = getTimestampForStep(step.key);

                return (
                  <React.Fragment key={step.key}>
                    <motion.div
                      className="flex flex-col items-center relative z-10"
                      style={{ flex: '1' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                    >
                      <motion.div
                        className={`
                          w-14 h-14 rounded-full flex items-center justify-center
                          ${stepStatus === 'completed' ? `${step.bg} text-white shadow-lg` : ''}
                          ${stepStatus === 'current' ? `${step.bg} text-white ring-4 ring-offset-2 ${step.color.replace('text-', 'ring-')} shadow-lg` : ''}
                          ${stepStatus === 'upcoming' ? 'bg-dark-100 text-dark-400 border-2 border-dark-200' : ''}
                        `}
                        animate={stepStatus === 'current' ? { scale: [1, 1.1, 1] } : stepStatus === 'completed' ? { scale: 1 } : {}}
                        transition={stepStatus === 'current' ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                      >
                        <Icon size={22} />
                      </motion.div>
                      <span className={`
                        text-xs mt-2 font-medium text-center max-w-[70px]
                        ${stepStatus === 'completed' ? step.color : ''}
                        ${stepStatus === 'current' ? `${step.color} font-bold` : ''}
                        ${stepStatus === 'upcoming' ? 'text-dark-400' : ''}
                      `}>
                        {step.label}
                      </span>
                      {timestamp && (
                        <span className="text-[10px] text-dark-400 mt-1">
                          {new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {stepStatus === 'current' && (
                        <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full ${step.lightBg} ${step.color} font-semibold`}>
                          In Progress
                        </span>
                      )}
                      {stepStatus === 'completed' && (
                        <span className="text-[10px] mt-1 text-dark-400">Done</span>
                      )}
                    </motion.div>
                    {index < statusSteps.length - 1 && (
                      <div className="flex-1 h-1 mx-1 relative -mt-6" style={{ minWidth: '20px' }}>
                        <div className="absolute inset-0 bg-dark-200 rounded-full" />
                        <div
                          className={`absolute inset-0 rounded-full transition-all duration-700 ${
                            index < currentStepIndex ? statusSteps[index + 1]?.bg || 'bg-primary-500' : 'bg-dark-200'
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {order.estimatedPreparationTime && !['ready', 'served', 'delivered', 'out-for-delivery', 'cancelled'].includes(order.status) && (
            <div className="text-center p-4 bg-primary-50 rounded-lg mt-8">
              <p className="text-dark-600 text-sm">Estimated preparation time</p>
              <p className="text-2xl font-bold text-primary-500">{order.estimatedPreparationTime} minutes</p>
            </div>
          )}

          {!isDelivery && order.status === 'ready' && (
            <div className="text-center p-6 bg-green-50 rounded-lg mt-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-green-600 font-semibold text-lg mb-2">Your order is ready!</p>
              <p className="text-green-500 text-sm mb-4">Please collect your order from the counter.</p>
              <button
                onClick={markAsReceived}
                disabled={receiving}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {receiving ? 'Marking...' : '✓ I Have Received My Order'}
              </button>
            </div>
          )}

          {isDelivery && order.status === 'ready' && (
            <div className="text-center p-6 bg-yellow-50 rounded-lg mt-8">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-yellow-600 font-semibold text-lg mb-2">Your order is ready!</p>
              <p className="text-yellow-500 text-sm">A delivery partner will pick it up shortly.</p>
            </div>
          )}

          {isDelivery && order.status === 'out-for-delivery' && (
            <div className="text-center p-6 bg-blue-50 rounded-lg mt-8">
              <div className="text-4xl mb-3">🛵</div>
              <p className="text-blue-600 font-semibold text-lg mb-2">Your order is on the way!</p>
              <p className="text-blue-500 text-sm">Delivery partner is heading to your location. Hang tight!</p>
            </div>
          )}

          {isDelivery && order.status === 'delivered' && (
            <div className="text-center p-6 bg-green-50 rounded-lg mt-8">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-green-600 font-semibold text-lg mb-2">Order Delivered!</p>
              <p className="text-green-500 text-sm">Your order has been delivered. Enjoy your meal!</p>
            </div>
          )}

          {!isDelivery && order.status === 'served' && (
            <div className="text-center p-6 bg-emerald-50 rounded-lg mt-8">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-emerald-600 font-semibold text-lg mb-2">Order Received!</p>
              <p className="text-emerald-500 text-sm">Enjoy your meal!</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-500">Order Type</span>
              <span className="font-medium capitalize flex items-center gap-1">
                {isDelivery && <FiTruck size={14} />}
                {!isDelivery && order.orderType === 'dine-in' && <FiMapPin size={14} />}
                {order.orderType}
              </span>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between">
                <span className="text-dark-500">Table</span>
                <span className="font-medium">{order.tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-dark-500">Payment</span>
              <span className="font-medium capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-500">Payment Status</span>
              <span className={`badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-500">Order Status</span>
              <span className={`badge ${
                order.status === 'delivered' || order.status === 'served' ? 'badge-success' :
                order.status === 'cancelled' ? 'badge-danger' :
                order.status === 'out-for-delivery' ? 'badge-info' :
                'badge-info'
              }`}>
                {order.status === 'served' ? 'Received' : order.status === 'out-for-delivery' ? 'On the Way' : order.status}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product?.image ? (
                    <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg flex items-center justify-center h-full">🍽️</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-dark-400">Qty: {item.quantity} × ₹{item.price}</p>
                </div>
                <span className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
          <div className="relative pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-dark-200" />
            {order.statusHistory.slice().reverse().map((entry, idx) => {
              const statusLabels = {
                'pending': 'Order Placed',
                'confirmed': 'Confirmed',
                'preparing': 'Preparing',
                'ready': 'Ready',
                'out-for-delivery': 'Out for Delivery',
                'delivered': 'Delivered',
                'served': 'Received',
                'cancelled': 'Cancelled'
              };
              return (
                <div key={idx} className="relative mb-4 last:mb-0">
                  <div className={`absolute -left-4 w-4 h-4 rounded-full border-2 border-white ${
                    idx === 0 ? 'bg-primary-500' : 'bg-dark-300'
                  }`} />
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${idx === 0 ? 'text-dark-800' : 'text-dark-500'}`}>
                        {statusLabels[entry.status] || entry.status}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-400">
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
