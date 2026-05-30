import { Router } from "express";
import { Category, Product, getNextSequence } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await Category.find().sort({ name: 1 }).lean();

  const categoriesWithCount = await Promise.all(categories.map(async (c: any) => {
    const productCount = await Product.countDocuments({ categoryId: c.id });
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      imageUrl: c.imageUrl ?? null,
      createdAt: c.createdAt.toISOString(),
      productCount,
    };
  }));

  res.json(categoriesWithCount);
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("category");
  const cat: any = await Category.create({
    id,
    ...parsed.data,
  });
  res.status(201).json({
    id: cat.id,
    name: cat.name,
    description: cat.description ?? null,
    imageUrl: cat.imageUrl ?? null,
    createdAt: cat.createdAt.toISOString(),
    productCount: 0,
  });
});

router.patch("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const cat: any = await Category.findOneAndUpdate(
    { id: params.data.id },
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const productCount = await Product.countDocuments({ categoryId: cat.id });

  res.json({
    id: cat.id,
    name: cat.name,
    description: cat.description ?? null,
    imageUrl: cat.imageUrl ?? null,
    createdAt: cat.createdAt.toISOString(),
    productCount,
  });
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const cat = await Category.findOneAndDelete({ id: params.data.id });
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
