const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price image isAvailable stock');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, specialInstructions } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({ success: false, message: 'Product not available' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.specialInstructions === specialInstructions
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, specialInstructions });
    }

    await cart.save();
    cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price image isAvailable stock');

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price image isAvailable stock');

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items.pull(itemId);
    await cart.save();
    cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price image isAvailable stock');

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    cart.couponCode = undefined;
    cart.discount = 0;
    await cart.save();

    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    const Coupon = require('../models/Coupon');

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
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

    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subtotal = cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    let discount = coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }

    cart.couponCode = couponCode.toUpperCase();
    cart.discount = discount;
    await cart.save();

    coupon.usedCount += 1;
    await coupon.save();

    res.json({ success: true, cart, discount });
  } catch (err) {
    next(err);
  }
};
