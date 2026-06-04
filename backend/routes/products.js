const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/low-stock', protect, authorize('admin'), getLowStockProducts);
router.get('/:id', getProduct);

router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id/stock', protect, authorize('admin'), updateStock);

module.exports = router;
