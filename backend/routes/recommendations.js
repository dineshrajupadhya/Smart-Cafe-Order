const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  trackPreference,
  getPopularItems,
  getTrendingItems
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getRecommendations);
router.post('/track', protect, trackPreference);
router.get('/popular', getPopularItems);
router.get('/trending', getTrendingItems);

module.exports = router;
