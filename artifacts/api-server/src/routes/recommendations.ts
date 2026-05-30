import { Router } from "express";
import { Product, Order, Category } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/recommendations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  // Get user's ordered product IDs
  const userOrders: any = await Order.find({ userId }).lean();
  const orderedProductIds = new Set<number>();
  userOrders.forEach((o: any) => o.items.forEach((i: any) => orderedProductIds.add(i.productId)));

  const allOrders: any = await Order.find().lean();
  const productPopularity: Record<number, number> = {};
  allOrders.forEach((o: any) => o.items.forEach((i: any) => {
    productPopularity[i.productId] = (productPopularity[i.productId] || 0) + i.quantity;
  }));

  const products: any = await Product.find({ isAvailable: true }).lean();

  const recommended = products
    .filter((p: any) => !orderedProductIds.has(p.id))
    .sort((a: any, b: any) => (productPopularity[b.id] || 0) - (productPopularity[a.id] || 0))
    .slice(0, 6);

  const results = await Promise.all(recommended.map(async (p: any) => {
    const cat: any = await Category.findOne({ id: p.categoryId }).lean();
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      price: p.price,
      imageUrl: p.imageUrl ?? null,
      categoryId: p.categoryId,
      categoryName: cat?.name ?? null,
      stock: p.stock,
      isAvailable: p.isAvailable,
      preparationTime: p.preparationTime ?? null,
      calories: p.calories ?? null,
      isVegetarian: p.isVegetarian,
      isSpicy: p.isSpicy,
      tags: p.tags,
      createdAt: p.createdAt.toISOString(),
    };
  }));

  res.json(results);
});

export default router;
