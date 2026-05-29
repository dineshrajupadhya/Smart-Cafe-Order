import { Router } from "express";
import { eq, sql, ne } from "drizzle-orm";
import { db, productsTable, orderItemsTable, ordersTable, categoriesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/recommendations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  // Get user's ordered product categories
  const userOrders = await db
    .select({ productId: orderItemsTable.productId })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
    .where(eq(ordersTable.userId, userId));

  const orderedProductIds = userOrders.map(o => o.productId);

  let recommended;

  if (orderedProductIds.length > 0) {
    // Recommend popular products the user hasn't ordered yet
    recommended = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        price: productsTable.price,
        imageUrl: productsTable.imageUrl,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        stock: productsTable.stock,
        isAvailable: productsTable.isAvailable,
        preparationTime: productsTable.preparationTime,
        calories: productsTable.calories,
        isVegetarian: productsTable.isVegetarian,
        isSpicy: productsTable.isSpicy,
        tags: productsTable.tags,
        createdAt: productsTable.createdAt,
        orderCount: sql<number>`cast(coalesce(count(${orderItemsTable.id}), 0) as int)`,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .leftJoin(orderItemsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(productsTable.isAvailable, true))
      .groupBy(productsTable.id, categoriesTable.name)
      .orderBy(sql`count(${orderItemsTable.id}) desc`)
      .limit(6);
  } else {
    // New user: recommend top-rated popular products
    recommended = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        price: productsTable.price,
        imageUrl: productsTable.imageUrl,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        stock: productsTable.stock,
        isAvailable: productsTable.isAvailable,
        preparationTime: productsTable.preparationTime,
        calories: productsTable.calories,
        isVegetarian: productsTable.isVegetarian,
        isSpicy: productsTable.isSpicy,
        tags: productsTable.tags,
        createdAt: productsTable.createdAt,
        orderCount: sql<number>`cast(coalesce(count(${orderItemsTable.id}), 0) as int)`,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .leftJoin(orderItemsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(productsTable.isAvailable, true))
      .groupBy(productsTable.id, categoriesTable.name)
      .orderBy(sql`count(${orderItemsTable.id}) desc`)
      .limit(6);
  }

  res.json(recommended.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    imageUrl: p.imageUrl ?? null,
    categoryId: p.categoryId,
    categoryName: p.categoryName ?? null,
    stock: p.stock,
    isAvailable: p.isAvailable,
    preparationTime: p.preparationTime ?? null,
    calories: p.calories ?? null,
    isVegetarian: p.isVegetarian,
    isSpicy: p.isSpicy,
    tags: p.tags,
    createdAt: p.createdAt,
  })));
});

export default router;
