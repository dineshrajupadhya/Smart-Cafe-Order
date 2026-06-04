const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  section: {
    type: String,
    enum: ['indoor', 'outdoor', 'private', 'counter'],
    default: 'indoor'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  qrCode: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', TableSchema);
