const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be positive']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please add a category']
  },
  image: {
    type: String,
    default: 'default-product.png'
  },
  images: [String],
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  preparationTime: {
    type: Number,
    default: 10
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: String,
    enum: ['none', 'mild', 'medium', 'hot', 'very-hot'],
    default: 'none'
  },
  tags: [String],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, isAvailable: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ soldCount: -1 });

module.exports = mongoose.model('Product', ProductSchema);
