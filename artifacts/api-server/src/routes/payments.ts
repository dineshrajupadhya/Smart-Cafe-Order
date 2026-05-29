import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable, ordersTable } from "@workspace/db";
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

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [payment] = await db.insert(paymentsTable).values({
    orderId,
    method: method as any,
    status: "pending",
    amount: order.total,
    upiId: upiId ?? null,
  }).returning();

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    transactionId: payment.transactionId ?? null,
    upiId: payment.upiId ?? null,
    createdAt: payment.createdAt,
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

  const [payment] = await db.update(paymentsTable)
    .set({ status: "paid", transactionId: parsed.data.transactionId })
    .where(eq(paymentsTable.id, params.data.id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  // Update order payment status
  await db.update(ordersTable)
    .set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() })
    .where(eq(ordersTable.id, payment.orderId));

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    transactionId: payment.transactionId ?? null,
    upiId: payment.upiId ?? null,
    createdAt: payment.createdAt,
  });
});

router.get("/payments/order/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentByOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid orderId" });
    return;
  }

  const [payment] = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.orderId, params.data.orderId))
    .orderBy(paymentsTable.createdAt)
    .limit(1);

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
    createdAt: payment.createdAt,
  });
});

export default router;
