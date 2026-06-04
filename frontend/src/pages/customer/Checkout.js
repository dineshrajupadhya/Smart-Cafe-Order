import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiDollarSign, FiSmartphone, FiCheck, FiLock, FiShield } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const scannedTable = localStorage.getItem('scannedTable') || '';
  const [formData, setFormData] = useState({
    orderType: scannedTable ? 'dine-in' : 'dine-in',
    tableNumber: scannedTable,
    paymentMethod: 'cash',
    specialInstructions: ''
  });
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: ''
  });
  const [upiData, setUpiData] = useState({
    upiId: ''
  });
  const [showCardFront, setShowCardFront] = useState(true);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax - (cart.discount || 0);

  const formatCardNumber = (value) => {
    const v = value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) {
      return v.substring(0, 2) + '/' + v.substring(2);
    }
    return v;
  };

  const getCardType = (number) => {
    const n = number.replace(/\D/g, '');
    if (n.startsWith('4')) return { type: 'VISA', color: 'from-blue-600 to-blue-800' };
    if (n.startsWith('5') || n.startsWith('2'))
      return { type: 'MASTERCARD', color: 'from-red-500 to-orange-500' };
    if (n.startsWith('6'))
      return { type: 'RUPAY', color: 'from-green-500 to-teal-500' };
    return { type: 'CARD', color: 'from-dark-600 to-dark-800' };
  };

  const validateCard = () => {
    const num = cardData.cardNumber.replace(/\D/g, '');
    if (num.length < 13 || num.length > 16) {
      toast.error('Invalid card number');
      return false;
    }
    if (!cardData.cardHolder.trim()) {
      toast.error('Enter cardholder name');
      return false;
    }
    const exp = cardData.expiry.replace(/\D/g, '');
    if (exp.length < 4) {
      toast.error('Invalid expiry date');
      return false;
    }
    const month = parseInt(exp.substring(0, 2));
    if (month < 1 || month > 12) {
      toast.error('Invalid expiry month');
      return false;
    }
    const year = parseInt('20' + exp.substring(2, 4));
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      toast.error('Card has expired');
      return false;
    }
    if (cardData.cvv.length < 3) {
      toast.error('Invalid CVV');
      return false;
    }
    return true;
  };

  const validateUpi = () => {
    const upi = upiData.upiId.trim();
    if (!upi || !upi.includes('@')) {
      toast.error('Enter a valid UPI ID (e.g., name@upi)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.orderType === 'dine-in' && !formData.tableNumber) {
      toast.error('Please enter table number');
      return;
    }
    if (!cart.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (formData.paymentMethod === 'card' && !validateCard()) return;
    if (formData.paymentMethod === 'upi' && !validateUpi()) return;

    try {
      setLoading(true);

      const orderRes = await api.post('/orders', {
        tableNumber: formData.tableNumber ? Number(formData.tableNumber) : undefined,
        orderType: formData.orderType,
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions
      });

      const paymentPayload = {
        orderId: orderRes.data.order._id,
        paymentMethod: formData.paymentMethod
      };

      if (formData.paymentMethod === 'card') {
        paymentPayload.cardDetails = {
          cardNumber: cardData.cardNumber.replace(/\D/g, ''),
          cardHolder: cardData.cardHolder,
          expiry: cardData.expiry,
          last4: cardData.cardNumber.replace(/\D/g, '').slice(-4)
        };
      } else if (formData.paymentMethod === 'upi') {
        paymentPayload.upiDetails = {
          upiId: upiData.upiId
        };
      }

      await api.post('/payments/process', paymentPayload);

      await clearCart();
      localStorage.removeItem('scannedTable');
      toast.success('Order placed successfully!');
      navigate(`/track/${orderRes.data.order.orderNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const cardInfo = getCardType(cardData.cardNumber);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark-800 mb-2">Checkout</h1>
      <p className="text-dark-500 mb-8">Complete your order and payment</p>

      {scannedTable && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-6 flex items-center gap-3">
          <span className="text-2xl">🪑</span>
          <div>
            <p className="text-sm font-medium text-primary-700">Table {scannedTable} detected from QR scan</p>
            <p className="text-xs text-primary-500">Your table number has been auto-set. You can change it below.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Order Type</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'dine-in', label: 'Dine In', icon: '🍽️' },
                  { value: 'takeaway', label: 'Takeaway', icon: '🥡' },
                  { value: 'delivery', label: 'Delivery', icon: '🚴' }
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, orderType: type.value })}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      formData.orderType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dark-200 hover:border-dark-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.orderType === 'dine-in' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Table Number</h3>
                <input
                  type="number"
                  placeholder="Enter table number"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  className="input-field"
                  min="1"
                  max="50"
                />
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="space-y-3">
                {[
                  { value: 'cash', label: 'Cash on Delivery', desc: 'Pay when you receive your order', icon: FiDollarSign },
                  { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: FiCreditCard },
                  { value: 'upi', label: 'UPI Payment', desc: 'Google Pay, PhonePe, Paytm', icon: FiSmartphone }
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.paymentMethod === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-dark-200 hover:border-dark-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="text-primary-500 w-4 h-4"
                      />
                      <Icon size={20} className="text-dark-500" />
                      <div>
                        <span className="font-medium block">{method.label}</span>
                        <span className="text-xs text-dark-400">{method.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {formData.paymentMethod === 'card' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Card Details</h3>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <FiShield size={14} />
                    <span>Secured</span>
                  </div>
                </div>

                <div
                  className={`relative w-full h-48 rounded-2xl bg-gradient-to-br ${cardInfo.color} p-6 text-white mb-6 shadow-lg cursor-pointer transition-transform ${showCardFront ? '' : 'rotate-y-180'}`}
                  onClick={() => setShowCardFront(!showCardFront)}
                >
                  {showCardFront ? (
                    <>
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-8 bg-yellow-300/80 rounded-md" />
                        <span className="text-sm font-bold tracking-wider">{cardInfo.type}</span>
                      </div>
                      <div className="text-xl tracking-widest font-mono mb-6">
                        {cardData.cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] uppercase opacity-70">Card Holder</div>
                          <div className="text-sm font-semibold tracking-wide">
                            {cardData.cardHolder || 'YOUR NAME'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase opacity-70">Expires</div>
                          <div className="text-sm font-semibold">{cardData.expiry || 'MM/YY'}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-full">
                      <div className="w-full h-10 bg-white/20 rounded mb-6" />
                      <div className="flex items-center gap-2">
                        <div className="text-xs opacity-70">CVV</div>
                        <div className="w-24 h-8 bg-white/20 rounded flex items-center justify-center text-lg font-mono tracking-[0.3em]">
                          {cardData.cvv || '•••'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Card Number</label>
                    <div className="relative">
                      <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) })}
                        className="input-field pl-10 font-mono tracking-wider"
                        maxLength={19}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name as on card"
                      value={cardData.cardHolder}
                      onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
                      className="input-field"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                        className="input-field font-mono"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">CVV</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                          className="input-field pl-10 font-mono"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-dark-400">
                  <FiLock size={12} />
                  <span>Your card info is encrypted and secure. We never store your CVV.</span>
                </div>
              </div>
            )}

            {formData.paymentMethod === 'upi' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">UPI Payment</h3>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <FiShield size={14} />
                    <span>Secured</span>
                  </div>
                </div>

                <div className="bg-dark-50 rounded-lg p-4 mb-4 flex items-center gap-4">
                  <div className="flex gap-3">
                    {['GPay', 'PhonePe', 'Paytm', 'Other'].map(app => (
                      <div key={app} className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xs font-medium border shadow-sm">
                        {app === 'GPay' && <span className="text-blue-600">G</span>}
                        {app === 'PhonePe' && <span className="text-purple-600">₹</span>}
                        {app === 'Paytm' && <span className="text-blue-500">P</span>}
                        {app === 'Other' && <span className="text-dark-400">•••</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">UPI ID</label>
                  <div className="relative">
                    <FiSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiData.upiId}
                      onChange={(e) => setUpiData({ upiId: e.target.value })}
                      className="input-field pl-10"
                    />
                  </div>
                  <p className="text-xs text-dark-400 mt-1">Enter your UPI ID linked to Google Pay, PhonePe, or Paytm</p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-dark-400">
                  <FiLock size={12} />
                  <span>You will receive a payment request on your UPI app. Approve it to complete payment.</span>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Special Instructions</h3>
              <textarea
                placeholder="Any special requests or dietary requirements..."
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                className="input-field h-24 resize-none"
              />
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product?.image ? (
                        <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg flex items-center justify-center h-full">🍽️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs text-dark-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">₹{(item.product?.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              <div className="space-y-2 mb-4">
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
                    <span>Discount ({cart.couponCode})</span>
                    <span>-₹{cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-bold text-dark-800 text-xl">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4 p-3 bg-dark-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-dark-600">
                  {formData.paymentMethod === 'cash' && <FiDollarSign size={16} />}
                  {formData.paymentMethod === 'card' && <FiCreditCard size={16} />}
                  {formData.paymentMethod === 'upi' && <FiSmartphone size={16} />}
                  <span className="capitalize">
                    {formData.paymentMethod === 'card' && cardData.cardNumber
                      ? `Card ending ${cardData.cardNumber.replace(/\D/g, '').slice(-4)}`
                      : formData.paymentMethod === 'upi' && upiData.upiId
                      ? upiData.upiId
                      : formData.paymentMethod === 'cash' ? 'Cash on delivery' : formData.paymentMethod}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <FiLock size={18} />
                    Pay ₹{total.toFixed(2)}
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-dark-400">
                <FiShield size={12} />
                <span>Secure & encrypted payment</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
