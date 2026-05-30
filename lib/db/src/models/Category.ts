import { Schema, model } from "mongoose";

const CategorySchema = new Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Category = model("Category", CategorySchema);
