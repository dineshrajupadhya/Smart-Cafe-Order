const express = require('express');
const router = express.Router();
const {
  generateTableQR,
  generateOrderQR,
  getTableInfo,
  getAllTables,
  updateTableStatus
} = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/auth');

router.get('/tables', getAllTables);
router.get('/tables/:tableNumber', getTableInfo);

router.post('/table/generate', protect, authorize('admin'), generateTableQR);
router.post('/order/generate', protect, authorize('admin'), generateOrderQR);
router.put('/tables/:id/status', protect, authorize('admin'), updateTableStatus);

module.exports = router;
