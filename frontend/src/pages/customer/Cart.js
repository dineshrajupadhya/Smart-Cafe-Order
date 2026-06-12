import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiTag, FiInfo } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, clearCart, applyCoupon, getCartTotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons/active');
      setAvailableCoupons(res.data.coupons);
    } catch (err) {
      console.error(err);
    }
  };

  const subtotal = getCartTotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax - (cart.discount || 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(couponCode);
    setApplyingCoupon(false);
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiShoppingBag size={64} className="mx-auto text-dark-300 mb-4" />
        <h2 className="text-2xl font-bold text-dark-800 mb-2">Your cart is empty</h2>
        <p className="text-dark-500 mb-6">Add some delicious items from our menu!</p>
        <Link to="/menu" className="btn-primary inline-block">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark-800 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item._id} className="card p-4 flex gap-4">
              <div className="w-20 h-20 bg-dark-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                {item.product?.image && item.product.image !== 'default-product.png' ? (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-3xl">🍽️</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-dark-800">{item.product?.name}</h3>
                  <button onClick={() => removeFromCart(item._id)} className="text-red-400 hover:text-red-600">
                    <FiTrash2 size={18} />
                  </button>
                </div>
                <p className="text-primary-500 font-medium">₹{item.product?.price}</p>
                {item.specialInstructions && (
                  <p className="text-xs text-dark-400 mt-1">Note: {item.specialInstructions}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => updateCartItem(item._id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-dark-50"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateCartItem(item._id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-dark-50"
                  >
                    <FiPlus size={14} />
                  </button>
                  <span className="text-dark-500 ml-auto">₹{(item.product?.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-red-500 hover:text-red-600 text-sm font-medium">
            Clear Cart
          </button>

          {availableCoupons.length > 0 ? (
            <div className="card p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <FiTag className="text-primary-500" size={18} />
                <h3 className="font-semibold text-dark-800">Available Coupon</h3>
              </div>
              {availableCoupons.map(coupon => (
                <div
                  key={coupon._id}
                  className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-dashed border-primary-300 cursor-pointer hover:bg-primary-100 transition-colors"
                  onClick={() => {
                    setCouponCode(coupon.code);
                    toast.success(`Coupon "${coupon.code}" selected — click Apply`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {coupon.code}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-800">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`}
                        {coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}
                      </p>
                      {coupon.description && (
                        <p className="text-xs text-dark-500">{coupon.description}</p>
                      )}
                      <p className="text-xs text-dark-400">
                        {coupon.minOrderAmount > 0 ? `Min order: ₹${coupon.minOrderAmount}` : 'No minimum order'}
                        {coupon.endDate ? ` • Expires: ${new Date(coupon.endDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <FiInfo className="text-primary-400" size={16} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-4 mt-4 text-center">
              <p className="text-sm text-dark-400">No coupons available right now. Check back next week!</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-dark-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-dark-600">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{cart.discount.toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-bold text-dark-800 text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input-field pl-10 text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                  className="btn-outline text-sm"
                >
                  {applyingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full btn-primary py-3 text-lg"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
