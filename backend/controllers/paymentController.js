const Payment = require('../models/Payment');
const Order = require('../models/Order');
const sendEmail = require('../services/emailService');

exports.processPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, cardDetails, upiDetails } = req.body;

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    let payment;
    const txnId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    if (paymentMethod === 'cash') {
      payment = await Payment.create({
        order: orderId,
        user: req.user.id,
        amount: order.totalAmount,
        method: 'cash',
        status: 'completed',
        transactionId: txnId
      });

      order.paymentStatus = 'completed';
      order.paymentMethod = 'cash';
      await order.save();
    } else if (paymentMethod === 'card') {
      const last4 = cardDetails?.last4 || cardDetails?.cardNumber?.slice(-4) || '0000';
      payment = await Payment.create({
        order: orderId,
        user: req.user.id,
        amount: order.totalAmount,
        method: 'card',
        status: 'completed',
        transactionId: txnId,
        metadata: new Map([
          ['cardLast4', last4],
          ['cardHolder', cardDetails?.cardHolder || ''],
          ['expiry', cardDetails?.expiry || '']
        ])
      });

      order.paymentStatus = 'completed';
      order.paymentMethod = 'card';
      order.paymentId = txnId;
      await order.save();
    } else if (paymentMethod === 'upi') {
      payment = await Payment.create({
        order: orderId,
        user: req.user.id,
        amount: order.totalAmount,
        method: 'upi',
        status: 'completed',
        transactionId: txnId,
        metadata: new Map([
          ['upiId', upiDetails?.upiId || '']
        ])
      });

      order.paymentStatus = 'completed';
      order.paymentMethod = 'upi';
      order.paymentId = txnId;
      await order.save();
    }

    const populatedOrder = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image');

    if (populatedOrder && populatedOrder.user && populatedOrder.user.email) {
      const itemsHtml = populatedOrder.items.map(item =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      ).join('');

      const paymentDetailsHtml = paymentMethod === 'card'
        ? `<p><strong>Card:</strong> •••• •••• •••• ${cardDetails?.last4 || '****'}</p><p><strong>Cardholder:</strong> ${cardDetails?.cardHolder || 'N/A'}</p>`
        : paymentMethod === 'upi'
        ? `<p><strong>UPI ID:</strong> ${upiDetails?.upiId || 'N/A'}</p>`
        : `<p><strong>Payment:</strong> Cash on Delivery</p>`;

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
              <p>Order Confirmation</p>
            </div>
            <div class="content">
              <div class="order-number">
                <p style="margin:0 0 5px;color:#64748b;">Your Order Number</p>
                <strong>${order.orderNumber}</strong>
              </div>

              <p>Hi ${populatedOrder.user.name},</p>
              <p>Your order has been placed successfully! Here are the details:</p>

              <div style="margin:15px 0;">
                <p><strong>Order Type:</strong> ${order.orderType === 'dine-in' ? 'Dine In (Table ' + order.tableNumber + ')' : order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <p><strong>Status:</strong> <span class="status-badge">Pending</span></p>
                ${order.estimatedPreparationTime ? `<p><strong>Estimated Time:</strong> ${order.estimatedPreparationTime} minutes</p>` : ''}
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
                <div class="row total"><span>Total Paid</span><span>₹${order.totalAmount.toFixed(2)}</span></div>
              </div>

              <div style="margin-top:20px;padding:15px;background:#f8fafc;border-radius:8px;">
                <h3 style="margin:0 0 10px;font-size:14px;">Payment Details</h3>
                <p style="margin:0;font-size:13px;color:#64748b;">
                  <strong>Method:</strong> ${paymentMethod.toUpperCase()}<br/>
                  <strong>Transaction ID:</strong> ${txnId}<br/>
                  <strong>Status:</strong> <span style="color:#16a34a;">Paid</span><br/>
                  ${paymentDetailsHtml}
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
                  Track your order in real-time from the Smart Cafe app or website.
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

      try {
        await sendEmail({
          to: populatedOrder.user.email,
          subject: `Order Confirmed #${order.orderNumber} - Smart Cafe`,
          html: emailHtml
        });
        console.log(`Order confirmation email sent to ${populatedOrder.user.email}`);
      } catch (emailErr) {
        console.error('Failed to send order email:', emailErr.message);
      }
    }

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber totalAmount')
      .populate('user', 'name email');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    let query = {};
    if (status) query.status = status;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('order', 'orderNumber')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      payments,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const { refundAmount, refundReason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot refund this payment' });
    }

    payment.status = 'refunded';
    payment.refundAmount = refundAmount || payment.amount;
    payment.refundReason = refundReason;
    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = 'refunded';
      await order.save();
    }

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};
