const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Payment = require('../models/Payment');

exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let groupId;
    if (groupBy === 'day') {
      groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (groupBy === 'week') {
      groupId = { $week: '$createdAt' };
    } else if (groupBy === 'month') {
      groupId = { $month: '$createdAt' };
    }

    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: 'completed' } },
      {
        $group: {
          _id: groupId,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', totalSold: 1, totalRevenue: 1 } }
    ]);

    const categorySales = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $group: { _id: '$category.name', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      report: {
        period: { start, end },
        sales,
        topProducts,
        categorySales
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .sort('stock');

    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    res.json({
      success: true,
      report: {
        totalProducts,
        outOfStock,
        lowStock,
        totalStockValue,
        products
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerReport = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const newUsersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    const topCustomers = await Order.aggregate([
      { $group: { _id: '$user', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', totalOrders: 1, totalSpent: 1 } }
    ]);

    res.json({
      success: true,
      report: {
        totalUsers,
        newUsersThisMonth,
        topCustomers
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const paymentsByMethod = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: { _id: '$method', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);

    const totalTransactions = await Payment.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const successfulPayments = await Payment.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'completed' });
    const failedPayments = await Payment.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'failed' });

    res.json({
      success: true,
      report: {
        period: { start, end },
        paymentsByMethod,
        totalTransactions,
        successfulPayments,
        failedPayments,
        successRate: totalTransactions > 0 ? ((successfulPayments / totalTransactions) * 100).toFixed(2) : 0
      }
    });
  } catch (err) {
    next(err);
  }
};
