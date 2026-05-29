import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { AddCartItemBody, UpdateCartItemBody, UpdateCartItemParams, RemoveCartItemParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

async function buildCart(userId: number) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      productName: productsTable.name,
      productImageUrl: productsTable.imageUrl,
      price: productsTable.price,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
    .where(eq(cartItemsTable.userId, userId));

  const cartItems = items.map(i => ({
    id: i.id,
    productId: i.productId,
    productName: i.productName,
    productImageUrl: i.productImageUrl ?? null,
    price: i.price,
    quantity: i.quantity,
    subtotal: Number((i.price * i.quantity).toFixed(2)),
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

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [existing] = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)))
    .limit(1);

  if (existing) {
    await db.update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ userId, productId, quantity });
  }

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
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));
  } else {
    await db.update(cartItemsTable)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));
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
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, params.data.productId)));
  res.json(await buildCart(userId));
});

router.delete("/cart/clear", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  res.json({ items: [], total: 0, itemCount: 0 });
});

export default router;
