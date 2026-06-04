const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserRole,
  toggleUserActive,
  getAllOrders
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-active', toggleUserActive);
router.get('/orders', getAllOrders);

module.exports = router;
