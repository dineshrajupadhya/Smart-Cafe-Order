const Coupon = require('../models/Coupon');

exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, coupon });
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deactivated' });
  } catch (err) {
    next(err);
  }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    let discount = coupon.discountType === 'percentage'
      ? (orderAmount * coupon.discountValue) / 100
      : coupon.discountValue;

    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }

    res.json({ success: true, coupon, discount });
  } catch (err) {
    next(err);
  }
};
