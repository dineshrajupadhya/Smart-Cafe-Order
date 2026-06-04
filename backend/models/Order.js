const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specialInstructions: String
});

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  tableNumber: {
    type: Number,
    min: 1
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway', 'delivery'],
    default: 'dine-in'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'out-for-delivery', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'upi'],
    default: 'cash'
  },
  paymentId: String,
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  couponCode: String,
  specialInstructions: String,
  estimatedPreparationTime: Number,
  actualPreparationTime: Number,
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  qrCode: String,
  tableQRCode: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const prefix = 'ORD';
    const timestamp = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', OrderSchema);
