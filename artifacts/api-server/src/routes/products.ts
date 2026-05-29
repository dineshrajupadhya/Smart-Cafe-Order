import { Router } from "express";
import { eq, and, ilike, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  ListProductsQueryParams,
  UpdateStockBody,
  UpdateStockParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

function buildProductRow(p: typeof productsTable.$inferSelect, categoryName: string | null) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    imageUrl: p.imageUrl ?? null,
    categoryId: p.categoryId,
    categoryName: categoryName ?? null,
    stock: p.stock,
    isAvailable: p.isAvailable,
    preparationTime: p.preparationTime ?? null,
    calories: p.calories ?? null,
    isVegetarian: p.isVegetarian,
    isSpicy: p.isSpicy,
    tags: p.tags,
    createdAt: p.createdAt,
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const qp = ListProductsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { categoryId, search, available } = qp.data;
  const conditions = [];
  if (categoryId !== undefined) conditions.push(eq(productsTable.categoryId, categoryId));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (available !== undefined) conditions.push(eq(productsTable.isAvailable, available));

  const rows = await db
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
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.name);

  res.json(rows);
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db.insert(productsTable).values({
    ...parsed.data,
    tags: parsed.data.tags ?? [],
    isVegetarian: parsed.data.isVegetarian ?? false,
    isSpicy: parsed.data.isSpicy ?? false,
    isAvailable: parsed.data.isAvailable ?? true,
    stock: parsed.data.stock ?? 0,
  }).returning();

  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, p.categoryId));
  res.status(201).json(buildProductRow(p, cat?.name ?? null));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
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
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(eq(productsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(row);
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db.update(productsTable).set(parsed.data).where(eq(productsTable.id, params.data.id)).returning();
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, p.categoryId));
  res.json(buildProductRow(p, cat?.name ?? null));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [p] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/products/:id/stock", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateStockParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateStockBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db.update(productsTable)
    .set({ stock: parsed.data.stock, isAvailable: parsed.data.stock > 0 })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, p.categoryId));
  res.json(buildProductRow(p, cat?.name ?? null));
});

// QR table menu
router.get("/qr/table/:tableNumber", async (req, res): Promise<void> => {
  const tableNumber = Array.isArray(req.params.tableNumber) ? req.params.tableNumber[0] : req.params.tableNumber;

  const [categories, products] = await Promise.all([
    db.select().from(categoriesTable).orderBy(categoriesTable.name),
    db
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
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .where(eq(productsTable.isAvailable, true))
      .orderBy(productsTable.name),
  ]);

  res.json({
    tableNumber,
    categories: categories.map(c => ({ ...c, productCount: products.filter(p => p.categoryId === c.id).length })),
    products,
  });
});

export default router;
