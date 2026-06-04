const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Table = require('../models/Table');
const Coupon = require('../models/Coupon');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-cafe');
    console.log('MongoDB Connected');

    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Table.deleteMany();
    await Coupon.deleteMany();

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@smartcafe.com',
      password: 'admin123',
      role: 'admin',
      phone: '1234567890'
    });

    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'user123',
      role: 'user',
      phone: '9876543210',
      preferences: {
        favoriteCategories: [],
        dietaryRestrictions: [],
        spiceLevel: 'medium'
      }
    });

    const categories = await Category.insertMany([
      { name: 'Beverages', description: 'Hot and cold drinks', icon: 'Coffee', sortOrder: 1 },
      { name: 'Snacks', description: 'Quick bites and appetizers', icon: 'Cookie', sortOrder: 2 },
      { name: 'Main Course', description: 'Hearty meals', icon: 'UtensilsCrossed', sortOrder: 3 },
      { name: 'Desserts', description: 'Sweet treats', icon: 'Cake', sortOrder: 4 },
      { name: 'Breakfast', description: 'Morning essentials', icon: 'Egg', sortOrder: 5 },
      { name: 'Healthy Options', description: 'Fresh and nutritious', icon: 'Salad', sortOrder: 6 }
    ]);

    const products = await Product.insertMany([
      { name: 'Cappuccino', description: 'Classic Italian coffee with steamed milk', price: 150, category: categories[0]._id, stock: 100, preparationTime: 5, isVegetarian: true, spiceLevel: 'none', tags: ['coffee', 'hot', 'popular'], image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop', nutritionalInfo: { calories: 120, protein: 6, carbs: 12, fat: 4, fiber: 0 } },
      { name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 80, category: categories[0]._id, stock: 150, preparationTime: 7, isVegetarian: true, spiceLevel: 'mild', tags: ['tea', 'hot', 'indian'], image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6201f?w=400&h=300&fit=crop', nutritionalInfo: { calories: 80, protein: 2, carbs: 15, fat: 1, fiber: 0 } },
      { name: 'Cold Coffee', description: 'Iced coffee with chocolate', price: 180, category: categories[0]._id, stock: 80, preparationTime: 5, isVegetarian: true, spiceLevel: 'none', tags: ['coffee', 'cold', 'popular'], image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop', nutritionalInfo: { calories: 200, protein: 5, carbs: 30, fat: 6, fiber: 0 } },
      { name: 'Fresh Lime Soda', description: 'Refreshing lime with soda', price: 60, category: categories[0]._id, stock: 120, preparationTime: 3, isVegetarian: true, spiceLevel: 'none', tags: ['cold', 'refreshing'], image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e959?w=400&h=300&fit=crop', nutritionalInfo: { calories: 50, protein: 0, carbs: 12, fat: 0, fiber: 0 } },
      { name: 'Samosa', description: 'Crispy pastry with spiced potato filling', price: 40, category: categories[1]._id, stock: 50, preparationTime: 10, isVegetarian: true, spiceLevel: 'medium', tags: ['snack', 'indian', 'fried'], image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', nutritionalInfo: { calories: 150, protein: 3, carbs: 18, fat: 8, fiber: 2 } },
      { name: 'French Fries', description: 'Golden crispy potato fries', price: 120, category: categories[1]._id, stock: 60, preparationTime: 8, isVegetarian: true, spiceLevel: 'none', tags: ['snack', 'western', 'popular'], image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop', nutritionalInfo: { calories: 300, protein: 4, carbs: 36, fat: 16, fiber: 3 } },
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 180, category: categories[1]._id, stock: 40, preparationTime: 15, isVegetarian: true, spiceLevel: 'medium', tags: ['snack', 'indian', 'grilled'], image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop', nutritionalInfo: { calories: 220, protein: 18, carbs: 8, fat: 14, fiber: 1 } },
      { name: 'Veg Biryani', description: 'Fragrant rice with mixed vegetables', price: 220, category: categories[2]._id, stock: 30, preparationTime: 20, isVegetarian: true, spiceLevel: 'medium', tags: ['main', 'indian', 'rice'], image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop', nutritionalInfo: { calories: 350, protein: 12, carbs: 52, fat: 10, fiber: 4 } },
      { name: 'Butter Paneer', description: 'Creamy tomato curry with cottage cheese', price: 250, category: categories[2]._id, stock: 25, preparationTime: 25, isVegetarian: true, spiceLevel: 'mild', tags: ['main', 'indian', 'curry'], image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop', nutritionalInfo: { calories: 380, protein: 15, carbs: 28, fat: 22, fiber: 3 } },
      { name: 'Mushroom Risotto', description: 'Creamy Italian rice with mushrooms', price: 280, category: categories[2]._id, stock: 20, preparationTime: 25, isVegetarian: true, spiceLevel: 'none', tags: ['main', 'italian', 'rice'], image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop', nutritionalInfo: { calories: 320, protein: 10, carbs: 45, fat: 12, fiber: 2 } },
      { name: 'Chocolate Brownie', description: 'Warm chocolate brownie with ice cream', price: 150, category: categories[3]._id, stock: 40, preparationTime: 5, isVegetarian: true, spiceLevel: 'none', tags: ['dessert', 'chocolate', 'popular'], image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', nutritionalInfo: { calories: 350, protein: 5, carbs: 45, fat: 18, fiber: 2 } },
      { name: 'Gulab Jamun', description: 'Sweet dumplings in sugar syrup', price: 80, category: categories[3]._id, stock: 50, preparationTime: 5, isVegetarian: true, spiceLevel: 'none', tags: ['dessert', 'indian', 'sweet'], image: 'https://images.unsplash.com/photo-1666190466521-4fb407e5bd21?w=400&h=300&fit=crop', nutritionalInfo: { calories: 180, protein: 2, carbs: 32, fat: 5, fiber: 0 } },
      { name: 'Pancakes', description: 'Fluffy pancakes with maple syrup', price: 180, category: categories[4]._id, stock: 45, preparationTime: 12, isVegetarian: true, spiceLevel: 'none', tags: ['breakfast', 'western', 'sweet'], image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', nutritionalInfo: { calories: 280, protein: 8, carbs: 42, fat: 8, fiber: 1 } },
      { name: 'Masala Omelette', description: 'Spiced egg omelette with vegetables', price: 120, category: categories[4]._id, stock: 60, preparationTime: 8, isVegetarian: false, spiceLevel: 'medium', tags: ['breakfast', 'eggs', 'indian'], image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=300&fit=crop', nutritionalInfo: { calories: 180, protein: 14, carbs: 4, fat: 12, fiber: 1 } },
      { name: 'Caesar Salad', description: 'Fresh romaine lettuce with Caesar dressing', price: 200, category: categories[5]._id, stock: 35, preparationTime: 10, isVegetarian: true, spiceLevel: 'none', tags: ['healthy', 'salad', 'fresh'], image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', nutritionalInfo: { calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 3 } },
      { name: 'Fruit Bowl', description: 'Fresh seasonal fruits', price: 150, category: categories[5]._id, stock: 40, preparationTime: 5, isVegetarian: true, spiceLevel: 'none', tags: ['healthy', 'fruit', 'fresh'], image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop', nutritionalInfo: { calories: 100, protein: 2, carbs: 22, fat: 0, fiber: 4 } }
    ]);

    const tables = [];
    for (let i = 1; i <= 20; i++) {
      tables.push({
        tableNumber: i,
        capacity: i <= 10 ? 4 : 6,
        section: i <= 10 ? 'indoor' : i <= 15 ? 'outdoor' : 'private',
        status: 'available'
      });
    }
    await Table.insertMany(tables);

    await Coupon.insertMany([
      { code: 'WELCOME10', description: '10% off on first order', discountType: 'percentage', discountValue: 10, minOrderAmount: 200, usageLimit: 100, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { code: 'FLAT50', description: '₹50 off on orders above ₹500', discountType: 'fixed', discountValue: 50, minOrderAmount: 500, usageLimit: 200, startDate: new Date(), endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      { code: 'CAFE20', description: '20% off on all items', discountType: 'percentage', discountValue: 20, minOrderAmount: 300, maxDiscountAmount: 100, usageLimit: 150, startDate: new Date(), endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) }
    ]);

    console.log('Seed data created successfully!');
    console.log('Admin: admin@smartcafe.com / admin123');
    console.log('User: john@example.com / user123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
