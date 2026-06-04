const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  markAsReceived,
  rateOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/received', markAsReceived);
router.put('/:id/rate', rateOrder);

module.exports = router;
