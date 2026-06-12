const cron = require('node-cron');
const Coupon = require('../models/Coupon');

const COUPON_TEMPLATES = [
  {
    namePrefix: 'WEEKLY',
    description: 'Weekly deal — percentage off',
    discountType: 'percentage',
    discountRange: [5, 15],
    maxDiscountRange: [20, 50],
    minOrderRange: [100, 300],
  },
  {
    namePrefix: 'FLAT',
    description: 'Flat discount on orders',
    discountType: 'fixed',
    discountRange: [25, 100],
    maxDiscountRange: null,
    minOrderRange: [300, 800],
  },
  {
    namePrefix: 'MEGA',
    description: 'Mega savings — limited use',
    discountType: 'percentage',
    discountRange: [10, 25],
    maxDiscountRange: [50, 150],
    minOrderRange: [500, 1000],
  },
  {
    namePrefix: 'NEWUSER',
    description: 'Welcome discount for everyone',
    discountType: 'percentage',
    discountRange: [5, 10],
    maxDiscountRange: [15, 30],
    minOrderRange: [100, 200],
  },
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCode(prefix) {
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

async function generateWeeklyCoupons() {
  try {
    console.log('[Coupon Generator] Starting weekly coupon generation...');

    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const generated = [];

    for (const template of COUPON_TEMPLATES) {
      const code = generateCode(template.namePrefix);
      const discountValue = randomBetween(template.discountRange[0], template.discountRange[1]);
      const minOrderAmount = randomBetween(template.minOrderRange[0], template.minOrderRange[1]);
      const maxDiscountAmount = template.maxDiscountRange
        ? randomBetween(template.maxDiscountRange[0], template.maxDiscountRange[1])
        : undefined;
      const usageLimit = randomBetween(20, 100);

      const coupon = await Coupon.create({
        code,
        description: template.description,
        discountType: template.discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        startDate: now,
        endDate: oneWeekLater,
        isActive: true,
      });

      generated.push(coupon.code);
      console.log(`[Coupon Generator] Created: ${coupon.code} — ${template.discountType} ${discountValue}`);
    }

    console.log(`[Coupon Generator] Generated ${generated.length} coupons: ${generated.join(', ')}`);
  } catch (err) {
    console.error('[Coupon Generator] Error:', err.message);
  }
}

async function deactivateExpiredCoupons() {
  try {
    const result = await Coupon.updateMany(
      { isActive: true, endDate: { $lt: new Date() } },
      { isActive: false }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Coupon Generator] Deactivated ${result.modifiedCount} expired coupons`);
    }
  } catch (err) {
    console.error('[Coupon Generator] Cleanup error:', err.message);
  }
}

function startCouponScheduler() {
  cron.schedule('0 0 * * 1', () => {
    generateWeeklyCoupons();
  });

  cron.schedule('0 0 * * *', () => {
    deactivateExpiredCoupons();
  });

  console.log('[Coupon Generator] Scheduler started — generates coupons every Monday at midnight');
}

module.exports = { startCouponScheduler, generateWeeklyCoupons, deactivateExpiredCoupons };
