const User = require('../models/User');
const sendEmail = require('../services/emailService');
const sendSMS = require('../services/smsService');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email: email.toLowerCase(), password, phone });

    const token = user.getSignedJwtToken();

    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Smart Cafe!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #dd8a2b, #ce6f20); padding: 30px; text-align: center; color: white; }
              .content { padding: 30px; text-align: center; }
              .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Smart Cafe!</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>Your account has been created successfully.</p>
                <p>You can now order your favorite food, track orders in real-time, and enjoy a seamless dining experience.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu" style="display:inline-block;margin-top:15px;padding:12px 30px;background:#dd8a2b;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Start Ordering</a>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Smart Cafe. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (e) {
      console.log('Welcome email failed:', e.message);
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('orderHistory');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, preferences } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (preferences) updateFields.preferences = preferences;

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};
