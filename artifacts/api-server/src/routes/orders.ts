import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable, usersTable, paymentsTable } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  GetOrderParams,
  CancelOrderParams,
  ListOrdersQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

async function buildOrder(orderId: number) {
  const [order] = await db.select({
    id: ordersTable.id,
    userId: ordersTable.userId,
    userName: usersTable.name,
    status: ordersTable.status,
    total: ordersTable.total,
    tableNumber: ordersTable.tableNumber,
    notes: ordersTable.notes,
    paymentMethod: ordersTable.paymentMethod,
    paymentStatus: ordersTable.paymentStatus,
    estimatedReadyTime: ordersTable.estimatedReadyTime,
    createdAt: ordersTable.createdAt,
    updatedAt: ordersTable.updatedAt,
  })
    .from(ordersTable)
    .leftJoin(usersTable, eq(usersTable.id, ordersTable.userId))
    .where(eq(ordersTable.id, orderId));

  if (!order) return null;

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    userName: order.userName ?? null,
    tableNumber: order.tableNumber ?? null,
    notes: order.notes ?? null,
    estimatedReadyTime: order.estimatedReadyTime ? order.estimatedReadyTime.toISOString() : null,
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImageUrl: i.productImageUrl ?? null,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const qp = ListOrdersQueryParams.safeParse(req.query);
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === "admin";

  const conditions = [];
  if (!isAdmin) conditions.push(eq(ordersTable.userId, userId));
  if (qp.success && qp.data.status) {
    conditions.push(eq(ordersTable.status, qp.data.status as any));
  }
  if (qp.success && qp.data.tableNumber) {
    conditions.push(eq(ordersTable.tableNumber, qp.data.tableNumber));
  }

  const orders = await db
    .select({
      id: ordersTable.id,
      userId: ordersTable.userId,
      userName: usersTable.name,
      status: ordersTable.status,
      total: ordersTable.total,
      tableNumber: ordersTable.tableNumber,
      notes: ordersTable.notes,
      paymentMethod: ordersTable.paymentMethod,
      paymentStatus: ordersTable.paymentStatus,
      estimatedReadyTime: ordersTable.estimatedReadyTime,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(usersTable.id, ordersTable.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(ordersTable.createdAt);

  // Fetch items for each order
  const allItems = orders.length > 0
    ? await db.select().from(orderItemsTable).where(
        conditions.length > 0 || !isAdmin
          ? eq(orderItemsTable.orderId, orders[0]?.id ?? 0)
          : undefined
      )
    : [];

  const orderIds = orders.map(o => o.id);
  const items = orderIds.length > 0
    ? await db.select().from(orderItemsTable)
    : [];

  res.json(orders.map(o => ({
    ...o,
    userName: o.userName ?? null,
    tableNumber: o.tableNumber ?? null,
    notes: o.notes ?? null,
    estimatedReadyTime: o.estimatedReadyTime ? o.estimatedReadyTime.toISOString() : null,
    items: items.filter(i => i.orderId === o.id).map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImageUrl: i.productImageUrl ?? null,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
  })));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;
  const { tableNumber, notes, paymentMethod } = parsed.data;

  // Get cart items
  const cartItems = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      productName: productsTable.name,
      productImageUrl: productsTable.imageUrl,
      price: productsTable.price,
      stock: productsTable.stock,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
    .where(eq(cartItemsTable.userId, userId));

  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const total = Number(cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));

  const [order] = await db.insert(ordersTable).values({
    userId,
    total,
    tableNumber: tableNumber ?? null,
    notes: notes ?? null,
    paymentMethod: paymentMethod as any,
    paymentStatus: "pending",
    status: "pending",
    estimatedReadyTime: new Date(Date.now() + 20 * 60 * 1000), // 20 mins
  }).returning();

  await db.insert(orderItemsTable).values(cartItems.map(i => ({
    orderId: order.id,
    productId: i.productId,
    productName: i.productName,
    productImageUrl: i.productImageUrl ?? null,
    price: i.price,
    quantity: i.quantity,
    subtotal: Number((i.price * i.quantity).toFixed(2)),
  })));

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  const result = await buildOrder(order.id);
  res.status(201).json(result);
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const order = await buildOrder(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (req.user!.role !== "admin" && order.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(order);
});

router.patch("/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const updates: Record<string, any> = {
    status: parsed.data.status,
    updatedAt: new Date(),
  };
  if (parsed.data.status === "completed") {
    updates.paymentStatus = "paid";
  }

  const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const result = await buildOrder(order.id);
  res.json(result);
});

router.post("/orders/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const params = CancelOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const result = await buildOrder(order.id);
  res.json(result);
});

export default router;
