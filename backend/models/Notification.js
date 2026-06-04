const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['order-status', 'promotion', 'stock-alert', 'system', 'payment'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Map,
    of: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  smsSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

NotificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
