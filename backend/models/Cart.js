const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  specialInstructions: {
    type: String,
    maxlength: [200, 'Special instructions cannot exceed 200 characters']
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  couponCode: {
    type: String,
    trim: true
  },
  discount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

CartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
});

CartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

CartSchema.set('toJSON', { virtuals: true });
CartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', CartSchema);
