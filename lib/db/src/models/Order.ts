import { Schema, model } from "mongoose";

const OrderItemSchema = new Schema({
  productId: { type: Number, required: true },
  productName: { type: String, required: true },
  productImageUrl: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const OrderSchema = new Schema({
  id: { type: Number, unique: true },
  userId: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
    default: "pending"
  },
  total: { type: Number, required: true },
  tableNumber: { type: String },
  notes: { type: String },
  paymentMethod: { type: String, enum: ["cash", "card", "upi"], required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  estimatedReadyTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  items: [OrderItemSchema],
});

export const Order = model("Order", OrderSchema);
