const express = require('express');
const router = express.Router();
const { processPayment, getPayment, getPayments, refundPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/process', processPayment);
router.get('/', authorize('admin'), getPayments);
router.get('/:id', getPayment);
router.put('/:id/refund', authorize('admin'), refundPayment);

module.exports = router;
