import { Schema, model } from "mongoose";

const CartItemSchema = new Schema({
  userId: { type: Number, required: true },
  productId: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index to ensure unique items per user
CartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const CartItem = model("CartItem", CartItemSchema);
