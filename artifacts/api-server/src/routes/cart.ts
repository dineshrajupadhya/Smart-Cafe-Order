import { Router } from "express";
import { CartItem, Product } from "@workspace/db";
import { AddCartItemBody, UpdateCartItemBody, UpdateCartItemParams, RemoveCartItemParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

async function buildCart(userId: number) {
  const items: any = await CartItem.find({ userId }).lean();

  const cartItems = await Promise.all(items.map(async (i: any) => {
    const product: any = await Product.findOne({ id: i.productId }).lean();
    return {
      id: i._id,
      productId: i.productId,
      productName: product?.name ?? "Unknown",
      productImageUrl: product?.imageUrl ?? null,
      price: product?.price ?? 0,
      quantity: i.quantity,
      subtotal: Number(((product?.price ?? 0) * i.quantity).toFixed(2)),
    };
  }));

  const total = Number(cartItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return { items: cartItems, total, itemCount };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  res.json(await buildCart(req.user!.userId));
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, quantity } = parsed.data;
  const userId = req.user!.userId;

  const product = await Product.findOne({ id: productId });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  await CartItem.findOneAndUpdate(
    { userId, productId },
    { $inc: { quantity }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true }
  );

  res.json(await buildCart(userId));
});

router.patch("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;
  const { productId } = params.data;
  const { quantity } = parsed.data;

  if (quantity === 0) {
    await CartItem.deleteOne({ userId, productId });
  } else {
    await CartItem.updateOne(
      { userId, productId },
      { $set: { quantity, updatedAt: new Date() } }
    );
  }

  res.json(await buildCart(userId));
});

router.delete("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }
  const userId = req.user!.userId;
  await CartItem.deleteOne({ userId, productId: params.data.productId });
  res.json(await buildCart(userId));
});

router.delete("/cart/clear", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  await CartItem.deleteMany({ userId });
  res.json({ items: [], total: 0, itemCount: 0 });
});

export default router;
