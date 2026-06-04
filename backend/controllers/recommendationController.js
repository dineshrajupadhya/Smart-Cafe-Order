const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { productId } = req.query;

    let recommendations = [];

    if (productId) {
      const product = await Product.findById(productId).populate('category');
      if (product) {
        const categoryProducts = await Product.find({
          category: product.category._id,
          _id: { $ne: productId },
          isAvailable: true,
          isActive: true
        }).limit(5);
        recommendations = categoryProducts;
      }
    } else if (user.orderHistory.length > 0) {
      const recentOrders = await Order.find({ user: req.user.id })
        .populate('items.product')
        .sort({ createdAt: -1 })
        .limit(5);

      const orderedProductIds = recentOrders.flatMap(order =>
        order.items.map(item => item.product._id.toString())
      );

      const categoryIds = [...new Set(recentOrders.flatMap(order =>
        order.items.map(item => item.product.category?.toString())
      ).filter(Boolean))];

      const frequentlyOrdered = await Order.aggregate([
        { $match: { user: req.user.id } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      const frequentlyOrderedProducts = await Product.find({
        _id: { $in: frequentlyOrdered.map(p => p._id) },
        isAvailable: true
      });

      recommendations = frequentlyOrderedProducts;
    }

    if (recommendations.length < 5) {
      const popularProducts = await Product.find({
        isAvailable: true,
        isActive: true,
        _id: { $nin: recommendations.map(r => r._id) }
      })
        .sort({ soldCount: -1 })
        .limit(5 - recommendations.length);

      recommendations = [...recommendations, ...popularProducts];
    }

    res.json({ success: true, recommendations });
  } catch (err) {
    next(err);
  }
};

exports.trackPreference = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    if (product.category && !user.preferences.favoriteCategories.includes(product.category.toString())) {
      user.preferences.favoriteCategories.push(product.category.toString());
      if (user.preferences.favoriteCategories.length > 5) {
        user.preferences.favoriteCategories.shift();
      }
      await user.save();
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getPopularItems = async (req, res, next) => {
  try {
    const popular = await Product.find({ isAvailable: true, isActive: true })
      .sort({ soldCount: -1 })
      .limit(10)
      .populate('category', 'name');

    res.json({ success: true, popular });
  } catch (err) {
    next(err);
  }
};

exports.getTrendingItems = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trending = await Order.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', weeklySold: { $sum: '$items.quantity' } } },
      { $sort: { weeklySold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', image: '$product.image', price: '$product.price', weeklySold: 1 } }
    ]);

    res.json({ success: true, trending });
  } catch (err) {
    next(err);
  }
};
