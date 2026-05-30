import { Router } from "express";
import { Payment, Order, getNextSequence } from "@workspace/db";
import { InitiatePaymentBody, ConfirmPaymentBody, ConfirmPaymentParams, GetPaymentByOrderParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/payments/initiate", requireAuth, async (req, res): Promise<void> => {
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { orderId, method, upiId } = parsed.data;

  const order: any = await Order.findOne({ id: orderId }).lean();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const id = await getNextSequence("payment");
  const payment: any = await Payment.create({
    id,
    orderId,
    method: method as any,
    status: "pending",
    amount: order.total,
    upiId: upiId ?? null,
  });

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    transactionId: payment.transactionId ?? null,
    upiId: payment.upiId ?? null,
    createdAt: payment.createdAt.toISOString(),
  });
});

router.post("/payments/:id/confirm", requireAuth, async (req, res): Promise<void> => {
  const params = ConfirmPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = ConfirmPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const payment: any = await Payment.findOneAndUpdate(
    { id: params.data.id },
    { $set: { status: "paid", transactionId: parsed.data.transactionId } },
    { new: true }
  ).lean();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  // Update order payment status
  await Order.updateOne(
    { id: payment.orderId },
    { $set: { paymentStatus: "paid", status: "confirmed", updatedAt: new Date() } }
  );

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    transactionId: payment.transactionId ?? null,
    upiId: payment.upiId ?? null,
    createdAt: payment.createdAt.toISOString(),
  });
});

router.get("/payments/order/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentByOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid orderId" });
    return;
  }

  const payment: any = await Payment.findOne({ orderId: params.data.orderId })
    .sort({ createdAt: 1 })
    .lean();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    transactionId: payment.transactionId ?? null,
    upiId: payment.upiId ?? null,
    createdAt: payment.createdAt.toISOString(),
  });
});

export default router;
