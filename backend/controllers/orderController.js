const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const sendEmail = require('../services/emailService');
const sendSMS = require('../services/smsService');

exports.createOrder = async (req, res, next) => {
  try {
    const { tableNumber, orderType, paymentMethod, specialInstructions, tableQRCode } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    for (const item of cart.items) {
      if (!item.product.isAvailable) {
        return res.status(400).json({ success: false, message: `${item.product.name} is not available` });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}` });
      }
    }

    const subtotal = cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax - cart.discount;

    const estimatedPreparationTime = Math.max(...cart.items.map(item => item.product.preparationTime));

    const order = await Order.create({
      user: req.user.id,
      items: cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      tableNumber,
      orderType,
      paymentMethod,
      specialInstructions,
      tableQRCode,
      subtotal,
      tax,
      discount: cart.discount,
      totalAmount,
      estimatedPreparationTime,
      statusHistory: [{ status: 'pending', timestamp: new Date() }]
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, soldCount: item.quantity }
      });
    }

    cart.items = [];
    cart.couponCode = undefined;
    cart.discount = 0;
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image');

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('new-order', populatedOrder);
    }

    try {
      const itemsHtml = populatedOrder.items.map(item =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      ).join('');

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dd8a2b, #ce6f20); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .order-number { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 20px; }
            .order-number strong { color: #166534; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f8fafc; padding: 8px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #64748b; }
            .totals { margin-top: 15px; }
            .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
            .totals .total { font-size: 18px; font-weight: bold; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 5px; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Smart Cafe</h1>
              <p>Order Placed Successfully!</p>
            </div>
            <div class="content">
              <div class="order-number">
                <p style="margin:0 0 5px;color:#64748b;">Your Order Number</p>
                <strong>${order.orderNumber}</strong>
              </div>

              <p>Hi ${populatedOrder.user.name},</p>
              <p>Thank you for your order! Here are your order details:</p>

              <div style="margin:15px 0;">
                <p><strong>Order Type:</strong> ${order.orderType === 'dine-in' ? 'Dine In (Table ' + order.tableNumber + ')' : order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <p><strong>Status:</strong> <span class="status-badge">Pending</span></p>
                ${order.estimatedPreparationTime ? `<p><strong>Estimated Preparation Time:</strong> ${order.estimatedPreparationTime} minutes</p>` : ''}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="totals">
                <div class="row"><span>Subtotal</span><span>₹${order.subtotal.toFixed(2)}</span></div>
                <div class="row"><span>Tax (5%)</span><span>₹${order.tax.toFixed(2)}</span></div>
                ${order.discount > 0 ? `<div class="row" style="color:#16a34a;"><span>Discount</span><span>-₹${order.discount.toFixed(2)}</span></div>` : ''}
                <div class="row total"><span>Total Amount</span><span>₹${order.totalAmount.toFixed(2)}</span></div>
              </div>

              <div style="margin-top:20px;padding:15px;background:#f8fafc;border-radius:8px;">
                <h3 style="margin:0 0 10px;font-size:14px;">Payment Information</h3>
                <p style="margin:0;font-size:13px;color:#64748b;">
                  <strong>Method:</strong> ${order.paymentMethod.toUpperCase()}<br/>
                  <strong>Status:</strong> <span style="color:#16a34a;">${order.paymentStatus}</span>
                </p>
              </div>

              ${order.specialInstructions ? `
              <div style="margin-top:15px;padding:15px;background:#fef3c7;border-radius:8px;">
                <h3 style="margin:0 0 5px;font-size:14px;">Special Instructions</h3>
                <p style="margin:0;font-size:13px;">${order.specialInstructions}</p>
              </div>
              ` : ''}

              <div style="margin-top:20px;padding:15px;background:#eff6ff;border-radius:8px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#1e40af;">
                  Track your order in real-time from the Smart Cafe app.
                </p>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for ordering from Smart Cafe!</p>
              <p>© ${new Date().getFullYear()} Smart Cafe. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      sendEmail({
        to: populatedOrder.user.email,
        subject: `Order Placed #${order.orderNumber} - Smart Cafe`,
        html: emailHtml
      }).catch(e => console.log('Order email failed:', e.message));

      Notification.create({
        user: req.user.id,
        type: 'order-status',
        title: 'Order Placed',
        message: `Your order ${order.orderNumber} has been placed successfully`,
        data: { orderId: order._id.toString() }
      }).catch(e => console.log('Notification failed:', e.message));
    } catch (e) {
      console.log('Notification failed:', e.message);
    }

    res.status(201).json({ success: true, order: populatedOrder });

    scheduleStatusProgression(order._id, order.orderType, io);
  } catch (err) {
    next(err);
  }
};

function buildDeliveryEmail(order, user, status) {
  const isOutForDelivery = status === 'out-for-delivery';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dd8a2b, #ce6f20); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .header-out { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
        .header-delivered { background: linear-gradient(135deg, #16a34a, #15803d); }
        .content { padding: 30px; }
        .order-number { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 20px; }
        .order-number strong { color: #166534; font-size: 18px; }
        .status-icon { text-align: center; font-size: 48px; margin: 15px 0; }
        .status-text { text-align: center; font-size: 20px; font-weight: bold; margin: 10px 0 5px; }
        .status-sub { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 20px; }
        .details { background: #f8fafc; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .details p { margin: 5px 0; font-size: 13px; color: #334155; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header ${isOutForDelivery ? 'header-out' : 'header-delivered'}">
          <h1>Smart Cafe</h1>
          <p>${isOutForDelivery ? 'Your Order is On the Way!' : 'Order Delivered!'}</p>
        </div>
        <div class="content">
          <div class="order-number">
            <p style="margin:0 0 5px;color:#64748b;">Order Number</p>
            <strong>${order.orderNumber}</strong>
          </div>

          <div class="status-icon">${isOutForDelivery ? '🛵' : '✅'}</div>
          <div class="status-text">${isOutForDelivery ? 'Out for Delivery' : 'Delivered Successfully'}</div>
          <div class="status-sub">${isOutForDelivery ? 'Your order is on its way to you!' : 'Your order has been delivered. Enjoy your meal!'}</div>

          <div class="details">
            <p><strong>Customer:</strong> ${user.name}</p>
            <p><strong>Order Type:</strong> Delivery</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
            ${isOutForDelivery ? '' : `<p><strong>Delivered At:</strong> ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>`}
          </div>

          <div style="margin-top:20px;padding:15px;background:#eff6ff;border-radius:8px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#1e40af;">
              ${isOutForDelivery ? 'Track your order in real-time from the Smart Cafe app.' : 'Thank you for ordering from Smart Cafe! We hope you enjoy your meal.'}
            </p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smart Cafe. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function updateOrderAndNotify(orderId, newStatus, io) {
  const order = await Order.findById(orderId);
  if (!order) return null;
  if (['cancelled', 'served', 'delivered'].includes(order.status)) return null;

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, timestamp: new Date() });
  if (['ready', 'served', 'delivered'].includes(newStatus)) {
    order.actualPreparationTime = Math.round((Date.now() - order.createdAt) / 60000);
  }
  await order.save();

  if (io) {
    io.to(`order-${orderId}`).emit('order-update', { orderId: orderId.toString(), status: newStatus, timestamp: new Date() });
    io.to('admin-room').emit('order-update', { orderId: orderId.toString(), status: newStatus, orderNumber: order.orderNumber });
  }

  const populatedOrder = await Order.findById(orderId).populate('user', 'name email');
  if (populatedOrder && populatedOrder.user) {
    try {
      await Notification.create({
        user: populatedOrder.user._id,
        type: 'order-status',
        title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Your order ${populatedOrder.orderNumber} is now ${newStatus}`,
        data: { orderId: orderId.toString() }
      });
    } catch (e) {
      console.log('Notification failed:', e.message);
    }

    if (newStatus === 'out-for-delivery') {
      try {
        await sendEmail({
          to: populatedOrder.user.email,
          subject: `Order On the Way #${populatedOrder.orderNumber} - Smart Cafe`,
          html: buildDeliveryEmail(populatedOrder, populatedOrder.user, 'out-for-delivery')
        });
      } catch (e) {
        console.log('Out for delivery email failed:', e.message);
      }
    }

    if (newStatus === 'delivered') {
      try {
        await sendEmail({
          to: populatedOrder.user.email,
          subject: `Order Delivered #${populatedOrder.orderNumber} - Smart Cafe`,
          html: buildDeliveryEmail(populatedOrder, populatedOrder.user, 'delivered')
        });
      } catch (e) {
        console.log('Delivered email failed:', e.message);
      }
    }
  }

  console.log(`Order ${orderId} auto-updated to ${newStatus}`);
  return order;
}

function scheduleStatusProgression(orderId, orderType, io) {
  const timers = [
    { status: 'confirmed', delay: 3000 },
    { status: 'preparing', delay: 10000 },
    { status: 'ready', delay: 30000 },
  ];

  if (orderType === 'delivery') {
    timers.push({ status: 'out-for-delivery', delay: 45000 });
    timers.push({ status: 'delivered', delay: 70000 });
  }

  timers.forEach(({ status, delay }) => {
    setTimeout(async () => {
      try {
        await updateOrderAndNotify(orderId, status, io);
      } catch (err) {
        console.error(`Auto status update error (${status}):`, err.message);
      }
    }, delay);
  });
}

exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let query = { user: req.user.id };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
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

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date(), note });

    if (status === 'ready' || status === 'served' || status === 'delivered') {
      order.actualPreparationTime = Math.round((Date.now() - order.createdAt) / 60000);
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-update', { orderId: order._id, status, timestamp: new Date() });
      io.to('admin-room').emit('order-update', { orderId: order._id, status, orderNumber: order.orderNumber });
    }

    try {
      await Notification.create({
        user: order.user._id,
        type: 'order-status',
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your order ${order.orderNumber} is now ${status}`,
        data: { orderId: order._id.toString() }
      });

      if ((status === 'out-for-delivery' || status === 'delivered') && order.orderType === 'delivery') {
        try {
          await sendEmail({
            to: order.user.email,
            subject: status === 'delivered'
              ? `Order Delivered #${order.orderNumber} - Smart Cafe`
              : `Order On the Way #${order.orderNumber} - Smart Cafe`,
            html: buildDeliveryEmail(order, order.user, status)
          });
        } catch (e) {
          console.log('Delivery status email failed:', e.message);
        }
      }
    } catch (e) {
      console.log('Notification failed:', e.message);
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['served', 'delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date() });
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity }
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.markAsReceived = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({ success: false, message: 'Order is not ready yet' });
    }

    order.status = 'served';
    order.statusHistory.push({ status: 'served', timestamp: new Date() });
    order.actualPreparationTime = Math.round((Date.now() - order.createdAt) / 60000);
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id}`).emit('order-update', { orderId: order._id, status: 'served', timestamp: new Date() });
      io.to('admin-room').emit('order-update', { orderId: order._id, status: 'served', orderNumber: order.orderNumber });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.rateOrder = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['served', 'delivered'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Can only rate completed orders' });
    }

    order.rating = rating;
    order.review = review;
    await order.save();

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const newRating = ((product.rating * product.numReviews) + rating) / (product.numReviews + 1);
        product.rating = Math.round(newRating * 10) / 10;
        product.numReviews += 1;
        await product.save();
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
