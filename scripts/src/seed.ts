import { User, Category, Product, getNextSequence } from "@workspace/db";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

async function seed() {
  console.log("Seeding MongoDB database...");

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/cafeteria";
  await mongoose.connect(mongoUri);

  // Seed admin user
  const existing = await User.findOne({ email: "admin@cafeteria.com" });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const id = await getNextSequence("user");
    await User.create({
      id,
      name: "Admin",
      email: "admin@cafeteria.com",
      passwordHash,
      role: "admin",
    });
    console.log("Created admin user: admin@cafeteria.com / admin123");
  } else {
    console.log("Admin user already exists");
  }

  // Seed categories
  const existingCats = await Category.countDocuments();
  if (existingCats === 0) {
    const catData = [
      { name: "Breakfast", description: "Start your day right", imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80" },
      { name: "Main Course", description: "Hearty meals to keep you going", imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" },
      { name: "Snacks", description: "Light bites and sides", imageUrl: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80" },
      { name: "Beverages", description: "Hot and cold drinks", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "Desserts", description: "Sweet endings", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80" },
    ];

    const cats = [];
    for (const data of catData) {
        const id = await getNextSequence("category");
        cats.push(await Category.create({ id, ...data }));
    }

    const [breakfast, main, snacks, beverages, desserts] = cats;
    console.log("Created categories");

    // Seed products
    const productData = [
      // Breakfast
      { name: "Masala Dosa", description: "Crispy rice crepe with spiced potato filling and chutney", price: 80, categoryId: breakfast.id, stock: 50, isVegetarian: true, preparationTime: 10, calories: 320, imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80", tags: ["popular"] },
      { name: "Idli Sambar", description: "Steamed rice cakes with lentil soup and coconut chutney", price: 60, categoryId: breakfast.id, stock: 40, isVegetarian: true, preparationTime: 8, calories: 250, imageUrl: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400&q=80", tags: [] },
      { name: "Poha", description: "Flattened rice with onions, peanuts and spices", price: 50, categoryId: breakfast.id, stock: 30, isVegetarian: true, preparationTime: 5, calories: 200, imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80", tags: [] },
      { name: "Aloo Paratha", description: "Whole wheat flatbread stuffed with spiced potato, served with yogurt", price: 90, categoryId: breakfast.id, stock: 25, isVegetarian: true, preparationTime: 12, calories: 380, imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80", tags: ["bestseller"] },

      // Main Course
      { name: "Dal Rice", description: "Slow-cooked lentil curry with steamed basmati rice", price: 100, categoryId: main.id, stock: 60, isVegetarian: true, preparationTime: 15, calories: 450, imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80", tags: [] },
      { name: "Chicken Biryani", description: "Aromatic basmati rice cooked with tender chicken and whole spices", price: 180, categoryId: main.id, stock: 30, isVegetarian: false, isSpicy: true, preparationTime: 20, calories: 650, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80", tags: ["popular", "bestseller"] },
      { name: "Paneer Butter Masala", description: "Cottage cheese in rich tomato-cream gravy with naan", price: 160, categoryId: main.id, stock: 25, isVegetarian: true, preparationTime: 18, calories: 580, imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80", tags: ["popular"] },
      { name: "Rajma Chawal", description: "Kidney bean curry with steamed rice — North Indian comfort food", price: 110, categoryId: main.id, stock: 35, isVegetarian: true, preparationTime: 15, calories: 420, imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80", tags: [] },
      { name: "Fish Curry", description: "Coastal style fish in tangy coconut gravy with rice", price: 200, categoryId: main.id, stock: 20, isVegetarian: false, isSpicy: true, preparationTime: 20, calories: 500, imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80", tags: [] },

      // Snacks
      { name: "Samosa (2 pcs)", description: "Crispy pastry filled with spiced potatoes and peas", price: 30, categoryId: snacks.id, stock: 80, isVegetarian: true, isSpicy: true, preparationTime: 3, calories: 180, imageUrl: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400&q=80", tags: ["popular"] },
      { name: "Vada Pav", description: "Mumbai street-style spicy potato fritter in a soft bun", price: 40, categoryId: snacks.id, stock: 60, isVegetarian: true, isSpicy: true, preparationTime: 5, calories: 280, imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80", tags: ["popular"] },
      { name: "Spring Rolls (4 pcs)", description: "Crispy golden rolls filled with vegetables and noodles", price: 80, categoryId: snacks.id, stock: 45, isVegetarian: true, preparationTime: 8, calories: 220, imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80", tags: [] },
      { name: "French Fries", description: "Golden crispy fries with ketchup and seasoning", price: 70, categoryId: snacks.id, stock: 50, isVegetarian: true, preparationTime: 8, calories: 320, imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80", tags: [] },

      // Beverages
      { name: "Masala Chai", description: "Spiced milk tea with ginger, cardamom and tulsi", price: 20, categoryId: beverages.id, stock: 100, isVegetarian: true, preparationTime: 3, calories: 90, imageUrl: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80", tags: ["popular"] },
      { name: "Cold Coffee", description: "Chilled blended coffee with milk and ice cream", price: 80, categoryId: beverages.id, stock: 40, isVegetarian: true, preparationTime: 5, calories: 220, imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80", tags: [] },
      { name: "Mango Lassi", description: "Creamy yogurt-based mango drink", price: 60, categoryId: beverages.id, stock: 30, isVegetarian: true, preparationTime: 4, calories: 280, imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80", tags: ["seasonal"] },
      { name: "Fresh Lime Soda", description: "Freshly squeezed lime with sparkling water and mint", price: 40, categoryId: beverages.id, stock: 50, isVegetarian: true, preparationTime: 2, calories: 60, imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80", tags: [] },
      { name: "Filter Coffee", description: "South Indian style drip coffee with milk", price: 25, categoryId: beverages.id, stock: 80, isVegetarian: true, preparationTime: 3, calories: 100, imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80", tags: [] },

      // Desserts
      { name: "Gulab Jamun (2 pcs)", description: "Soft milk dumplings in rose sugar syrup", price: 50, categoryId: desserts.id, stock: 40, isVegetarian: true, preparationTime: 2, calories: 280, imageUrl: "https://images.unsplash.com/photo-1601303516534-bf4e0f79e8b7?w=400&q=80", tags: ["popular"] },
      { name: "Kulfi", description: "Traditional Indian ice cream with pistachios and saffron", price: 60, categoryId: desserts.id, stock: 25, isVegetarian: true, preparationTime: 1, calories: 200, imageUrl: "https://images.unsplash.com/photo-1557499305-0af888c3d8ec?w=400&q=80", tags: [] },
      { name: "Halwa", description: "Semolina pudding with ghee, sugar and dry fruits", price: 45, categoryId: desserts.id, stock: 30, isVegetarian: true, preparationTime: 5, calories: 350, imageUrl: "https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=400&q=80", tags: [] },
      { name: "Chocolate Brownie", description: "Warm fudgy brownie with vanilla ice cream", price: 90, categoryId: desserts.id, stock: 20, isVegetarian: true, preparationTime: 5, calories: 420, imageUrl: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80", tags: ["bestseller"] },
    ];

    for (const data of productData) {
        const id = await getNextSequence("product");
        await Product.create({ id, ...data });
    }
    console.log("Created products");
  } else {
    console.log("Categories/Products already exist, skipping");
  }

  console.log("Seeding complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
