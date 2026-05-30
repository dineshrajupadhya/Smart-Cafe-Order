import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  categoryId: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number },
  calories: { type: Number },
  isVegetarian: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const Product = model("Product", ProductSchema);
