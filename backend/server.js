const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/qr', require('./routes/qr'));

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
  });

  socket.on('join-admin', () => {
    socket.join('admin-room');
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Cafeteria API is running' });
});

app.get('/api/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  const smtpUser = process.env.SMTP_USER || 'NOT SET';
  const smtpPass = process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0,2)}***${process.env.SMTP_PASS.substring(process.env.SMTP_PASS.length - 2)} (len:${process.env.SMTP_PASS.length})` : 'NOT SET';
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 25,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    });
    const info = await transporter.sendMail({
      from: `"Smart Cafe" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Smart Cafe - Test Email',
      html: '<h1>It works!</h1><p>Email configured correctly.</p>'
    });
    res.json({ success: true, messageId: info.messageId, smtpUser, smtpPass });
  } catch (err) {
    res.json({ success: false, error: err.message, smtpUser, smtpPass });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
