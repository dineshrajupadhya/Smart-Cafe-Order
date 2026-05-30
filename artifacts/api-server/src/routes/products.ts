import { Router } from "express";
import { Product, Category, getNextSequence } from "@workspace/db";
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

function buildProductRow(p: any, categoryName: string | null) {
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
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const qp = ListProductsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { categoryId, search, available } = qp.data;
  const filter: any = {};
  if (categoryId !== undefined) filter.categoryId = categoryId;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (available !== undefined) filter.isAvailable = available;

  const products = await Product.find(filter).sort({ name: 1 }).lean();

  const productsWithCat = await Promise.all(products.map(async (p: any) => {
    const cat: any = await Category.findOne({ id: p.categoryId }).lean();
    return buildProductRow(p, cat?.name ?? null);
  }));

  res.json(productsWithCat);
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("product");
  const p: any = await Product.create({
    id,
    ...parsed.data,
    tags: parsed.data.tags ?? [],
    isVegetarian: parsed.data.isVegetarian ?? false,
    isSpicy: parsed.data.isSpicy ?? false,
    isAvailable: parsed.data.isAvailable ?? true,
    stock: parsed.data.stock ?? 0,
  });

  const cat: any = await Category.findOne({ id: p.categoryId }).lean();
  res.status(201).json(buildProductRow(p, cat?.name ?? null));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const p: any = await Product.findOne({ id: params.data.id }).lean();
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const cat: any = await Category.findOne({ id: p.categoryId }).lean();
  res.json(buildProductRow(p, cat?.name ?? null));
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
  const p: any = await Product.findOneAndUpdate(
    { id: params.data.id },
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const cat: any = await Category.findOne({ id: p.categoryId }).lean();
  res.json(buildProductRow(p, cat?.name ?? null));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const p = await Product.findOneAndDelete({ id: params.data.id });
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
  const p: any = await Product.findOneAndUpdate(
    { id: params.data.id },
    { $set: { stock: parsed.data.stock, isAvailable: parsed.data.stock > 0 } },
    { new: true }
  ).lean();

  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const cat: any = await Category.findOne({ id: p.categoryId }).lean();
  res.json(buildProductRow(p, cat?.name ?? null));
});

// QR table menu
router.get("/qr/table/:tableNumber", async (req, res): Promise<void> => {
  const tableNumber = Array.isArray(req.params.tableNumber) ? req.params.tableNumber[0] : req.params.tableNumber;

  const [categories, products] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.find({ isAvailable: true }).sort({ name: 1 }).lean(),
  ]);

  const productsWithCat = await Promise.all(products.map(async (p: any) => {
    const cat = categories.find((c: any) => c.id === p.categoryId);
    return buildProductRow(p, cat?.name ?? null);
  }));

  res.json({
    tableNumber,
    categories: categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      imageUrl: c.imageUrl ?? null,
      createdAt: c.createdAt.toISOString(),
      productCount: products.filter((p: any) => p.categoryId === c.id).length,
    })),
    products: productsWithCat,
  });
});

export default router;
