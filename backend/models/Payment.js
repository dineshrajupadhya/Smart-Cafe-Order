const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'online', 'upi'],
    required: true
  },
  transactionId: String,
  stripePaymentIntentId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
