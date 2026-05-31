import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/cafeteria";
mongoose.connect(mongoUri).catch(err => {
  console.error("MongoDB connection error:", err);
});

export { User } from "./models/User";
export { Category } from "./models/Category";
export { Product } from "./models/Product";
export { CartItem } from "./models/CartItem";
export { Order } from "./models/Order";
export { Payment } from "./models/Payment";
export { Counter, getNextSequence } from "./models/Counter";
