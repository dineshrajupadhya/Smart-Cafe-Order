import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiPackage, FiStar, FiX } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      params.append('limit', '50');
      const res = await api.get(`/orders/my-orders?${params.toString()}`);
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      'out-for-delivery': 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Order Placed',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready to Serve',
      served: 'Served',
      delivered: 'Delivered',
      'out-for-delivery': 'On the Way',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const openRatingModal = (order) => {
    setRatingModal(order);
    setRatingValue(order.rating || 0);
    setReviewText(order.review || '');
    setRatingHover(0);
  };

  const submitRating = async () => {
    if (ratingValue === 0) {
      toast.error('Please select a rating');
      return;
    }
    try {
      setSubmitting(true);
      await api.put(`/orders/${ratingModal._id}/rate`, {
        rating: ratingValue,
        review: reviewText
      });
      toast.success('Rating submitted!');
      setOrders(prev => prev.map(o =>
        o._id === ratingModal._id ? { ...o, rating: ratingValue, review: reviewText } : o
      ));
      setRatingModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold text-dark-800 mb-2">My Orders</h1>
        <p className="text-dark-500 mb-6">Track and manage your orders</p>
      </motion.div>

      <motion.div
        className="flex gap-2 mb-6 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { value: '', label: 'All Orders' },
          { value: 'pending', label: 'Pending' },
          { value: 'preparing', label: 'Preparing' },
          { value: 'ready', label: 'Ready' },
          { value: 'served', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ].map(item => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-dark-600 hover:bg-dark-50 border'
            }`}
          >
            {item.label}
          </button>
        ))}
      </motion.div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage size={64} className="mx-auto text-dark-300 mb-4" />
          <h2 className="text-xl font-semibold text-dark-700 mb-2">No orders found</h2>
          <p className="text-dark-500 mb-6">You haven't placed any orders yet.</p>
          <Link to="/menu" className="btn-primary inline-block">
            Order Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <motion.div
              key={order._id}
              className="card overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-dark-800">#{order.orderNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-dark-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-dark-800">₹{order.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-dark-400 capitalize">{order.orderType} • {order.paymentMethod}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-dark-50 px-3 py-1.5 rounded-lg">
                      <div className="w-8 h-8 bg-dark-100 rounded overflow-hidden flex-shrink-0">
                        {item.product?.image ? (
                          <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm flex items-center justify-center h-full">🍽️</span>
                        )}
                      </div>
                      <span className="text-sm text-dark-700">{item.name}</span>
                      <span className="text-xs text-dark-400">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.rating ? (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FiStar
                          key={star}
                          size={14}
                          className={star <= order.rating ? 'text-yellow-400 fill-current' : 'text-dark-300'}
                        />
                      ))}
                      <span className="text-xs text-dark-500 ml-1">Your rating</span>
                    </div>
                    {order.review && <p className="text-sm text-dark-600">{order.review}</p>}
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-dark-500">
                    {order.tableNumber && <span>Table {order.tableNumber} • </span>}
                    {order.paymentStatus === 'completed' ? (
                      <span className="text-green-600">Paid</span>
                    ) : (
                      <span className="text-yellow-600">Payment Pending</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(order.status === 'served' || order.status === 'delivered') && !order.rating && (
                      <motion.button
                        onClick={() => openRatingModal(order)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-sm bg-yellow-50 text-yellow-600 border border-yellow-200 font-medium py-1.5 px-3 rounded-lg flex items-center gap-1 hover:bg-yellow-100 transition-colors"
                      >
                        <FiStar size={14} /> Rate Order
                      </motion.button>
                    )}
                    <Link
                      to={`/track/${order.orderNumber}`}
                      className="btn-outline text-sm flex items-center gap-1 py-1.5 px-3"
                    >
                      <FiEye size={14} /> Track Order
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {ratingModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRatingModal(null)}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-md p-6"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-dark-800">Rate Your Order</h2>
                  <p className="text-sm text-dark-500">#{ratingModal.orderNumber}</p>
                </div>
                <button onClick={() => setRatingModal(null)} className="text-dark-400 hover:text-dark-600">
                  <FiX size={24} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <motion.button
                      key={star}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setRatingValue(star)}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                    >
                      <FiStar
                        size={36}
                        className={`transition-colors ${
                          star <= (ratingHover || ratingValue)
                            ? 'text-yellow-400 fill-current'
                            : 'text-dark-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                <p className="text-sm text-dark-500">
                  {ratingValue === 0 && 'Tap a star to rate'}
                  {ratingValue === 1 && 'Poor'}
                  {ratingValue === 2 && 'Fair'}
                  {ratingValue === 3 && 'Good'}
                  {ratingValue === 4 && 'Very Good'}
                  {ratingValue === 5 && 'Excellent'}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-2">Write a review (optional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="input-field h-24 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-dark-400 mt-1 text-right">{reviewText.length}/500</p>
              </div>

              <motion.button
                onClick={submitRating}
                disabled={submitting || ratingValue === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrders;
