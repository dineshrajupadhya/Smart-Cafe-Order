import { Router } from "express";
import { Order, CartItem, Product, User, getNextSequence } from "@workspace/db";
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
  const order: any = await Order.findOne({ id: orderId }).lean();
  if (!order) return null;

  const user: any = await User.findOne({ id: order.userId }).lean();

  return {
    id: order.id,
    userId: order.userId,
    userName: user?.name ?? "Customer",
    status: order.status,
    total: order.total,
    tableNumber: order.tableNumber ?? null,
    notes: order.notes ?? null,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    estimatedReadyTime: order.estimatedReadyTime ? order.estimatedReadyTime.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((i: any) => ({
      id: i._id,
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

  const filter: any = {};
  if (!isAdmin) filter.userId = userId;
  if (qp.success && qp.data.status) filter.status = qp.data.status;
  if (qp.success && qp.data.tableNumber) filter.tableNumber = qp.data.tableNumber;

  const orders = await Order.find(filter).sort({ createdAt: 1 }).lean();

  const results = await Promise.all(orders.map(async (o: any) => {
    const user: any = await User.findOne({ id: o.userId }).lean();
    return {
      id: o.id,
      userId: o.userId,
      userName: user?.name ?? "Customer",
      status: o.status,
      total: o.total,
      tableNumber: o.tableNumber ?? null,
      notes: o.notes ?? null,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      estimatedReadyTime: o.estimatedReadyTime ? o.estimatedReadyTime.toISOString() : null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: o.items.map((i: any) => ({
        id: i._id,
        productId: i.productId,
        productName: i.productName,
        productImageUrl: i.productImageUrl ?? null,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    };
  }));

  res.json(results);
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
  const cartItems: any = await CartItem.find({ userId }).lean();
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const orderItems = await Promise.all(cartItems.map(async (i: any) => {
    const product: any = await Product.findOne({ id: i.productId }).lean();
    if (!product) throw new Error(`Product ${i.productId} not found`);
    return {
      productId: i.productId,
      productName: product.name,
      productImageUrl: product.imageUrl ?? null,
      price: product.price,
      quantity: i.quantity,
      subtotal: Number((product.price * i.quantity).toFixed(2)),
    };
  }));

  const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Number((subtotal * 1.05).toFixed(2));

  const id = await getNextSequence("order");
  const order: any = await Order.create({
    id,
    userId,
    total,
    tableNumber: tableNumber ?? null,
    notes: notes ?? null,
    paymentMethod: paymentMethod as any,
    paymentStatus: "pending",
    status: "pending",
    estimatedReadyTime: new Date(Date.now() + 20 * 60 * 1000), // 20 mins
    items: orderItems,
  });

  // Clear cart
  await CartItem.deleteMany({ userId });

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

  const updates: any = {
    status: parsed.data.status,
    updatedAt: new Date(),
  };
  if (parsed.data.status === "completed") {
    updates.paymentStatus = "paid";
  }

  const order: any = await Order.findOneAndUpdate(
    { id: params.data.id },
    { $set: updates },
    { new: true }
  );
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

  const order: any = await Order.findOneAndUpdate(
    { id: params.data.id },
    { $set: { status: "cancelled", updatedAt: new Date() } },
    { new: true }
  );

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const result = await buildOrder(order.id);
  res.json(result);
});

export default router;
