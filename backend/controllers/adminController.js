const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Category = require('../models/Category');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalProducts, totalOrders, todayOrders, pendingOrders, activeProducts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      Product.countDocuments({ isAvailable: true, isActive: true })
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const todayRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: today } } },
      { $group: { _id: null, todayRevenue: { $sum: '$totalAmount' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].todayRevenue : 0;

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', image: '$product.image', totalSold: 1, totalRevenue: 1 } }
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const last7Days = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        todayOrders,
        pendingOrders,
        activeProducts,
        totalRevenue,
        todayRevenue,
        topProducts,
        ordersByStatus,
        last7Days
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, orderType } = req.query;
    let query = {};
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      orders,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};
