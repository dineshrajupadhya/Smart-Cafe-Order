const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getPaymentReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/customers', getCustomerReport);
router.get('/payments', getPaymentReport);

module.exports = router;
