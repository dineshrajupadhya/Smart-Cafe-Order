import { Schema, model } from "mongoose";

const PaymentSchema = new Schema({
  id: { type: Number, unique: true },
  orderId: { type: Number, required: true },
  method: { type: String, enum: ["cash", "card", "upi"], required: true },
  status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  amount: { type: Number, required: true },
  transactionId: { type: String },
  upiId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Payment = model("Payment", PaymentSchema);
