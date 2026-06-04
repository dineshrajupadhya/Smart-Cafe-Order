const QRCode = require('qrcode');
const Table = require('../models/Table');

exports.generateTableQR = async (req, res, next) => {
  try {
    const { tableNumber } = req.body;
    const table = await Table.findOne({ tableNumber });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const qrData = JSON.stringify({
      tableNumber: table.tableNumber,
      tableId: table._id,
      url: `${process.env.FRONTEND_URL}/order?table=${table.tableNumber}`
    });

    const qrCode = await QRCode.toDataURL(qrData);
    table.qrCode = qrCode;
    await table.save();

    res.json({ success: true, qrCode, table });
  } catch (err) {
    next(err);
  }
};

exports.generateOrderQR = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = require('../models/Order');
    const orderDoc = await order.findById(orderId);
    if (!orderDoc) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const qrData = JSON.stringify({
      orderNumber: orderDoc.orderNumber,
      orderId: orderDoc._id,
      url: `${process.env.FRONTEND_URL}/track/${orderDoc.orderNumber}`
    });

    const qrCode = await QRCode.toDataURL(qrData);
    orderDoc.qrCode = qrCode;
    await orderDoc.save();

    res.json({ success: true, qrCode, order: orderDoc });
  } catch (err) {
    next(err);
  }
};

exports.getTableInfo = async (req, res, next) => {
  try {
    const table = await Table.findOne({ tableNumber: req.params.tableNumber });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, table });
  } catch (err) {
    next(err);
  }
};

exports.getAllTables = async (req, res, next) => {
  try {
    const tables = await Table.find().sort('tableNumber');
    res.json({ success: true, tables });
  } catch (err) {
    next(err);
  }
};

exports.updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, table });
  } catch (err) {
    next(err);
  }
};
