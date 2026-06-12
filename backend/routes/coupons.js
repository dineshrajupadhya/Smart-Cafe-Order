const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getActiveCoupons
} = require('../controllers/couponController');
const { generateWeeklyCoupons } = require('../services/couponGenerator');

router.get('/active', getActiveCoupons);
router.get('/', protect, authorize('admin'), getCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);
router.post('/validate', validateCoupon);
router.post('/generate', protect, authorize('admin'), async (req, res) => {
  try {
    await generateWeeklyCoupons();
    res.json({ success: true, message: 'Coupons generated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
