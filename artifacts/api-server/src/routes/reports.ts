import { Router } from "express";
import { Order, Product, Category } from "@workspace/db";
import { GetSalesReportQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/reports/sales", requireAdmin, async (req, res): Promise<void> => {
  const qp = GetSalesReportQueryParams.safeParse(req.query);

  const filter: any = { status: "completed" };
  if (qp.success) {
    if (qp.data.from || qp.data.to) {
      filter.createdAt = {};
      if (qp.data.from) filter.createdAt.$gte = new Date(qp.data.from);
      if (qp.data.to) filter.createdAt.$lte = new Date(qp.data.to);
    }
  }

  const orders: any = await Order.find(filter).lean();

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const dailyMap: Record<string, { revenue: number, orders: number }> = {};
  orders.forEach((o: any) => {
    const date = o.createdAt.toISOString().split('T')[0];
    if (!dailyMap[date]) dailyMap[date] = { revenue: 0, orders: 0 };
    dailyMap[date].revenue += o.total;
    dailyMap[date].orders++;
  });

  const dailyData = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, revenue: Number(data.revenue.toFixed(2)), orders: data.orders }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalOrders,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    dailyData,
  });
});

router.get("/reports/top-products", requireAdmin, async (req, res): Promise<void> => {
  const completedOrders: any = await Order.find({ status: "completed" }).lean();

  const productStats: Record<number, any> = {};
  for (const order of completedOrders) {
    for (const item of order.items) {
      if (!productStats[item.productId]) {
        productStats[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          productImageUrl: item.productImageUrl,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productStats[item.productId].totalQuantity += item.quantity;
      productStats[item.productId].totalRevenue += item.subtotal;
    }
  }

  const results = await Promise.all(Object.values(productStats).map(async (ps: any) => {
    const product: any = await Product.findOne({ id: ps.productId }).lean();
    const cat: any = product ? await Category.findOne({ id: product.categoryId }).lean() : null;
    return {
      ...ps,
      totalRevenue: Number(ps.totalRevenue.toFixed(2)),
      categoryName: cat?.name ?? null,
    };
  }));

  res.json(results.sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10));
});

router.get("/reports/category-breakdown", requireAdmin, async (req, res): Promise<void> => {
  const completedOrders: any = await Order.find({ status: "completed" }).lean();
  const categories: any = await Category.find().lean();

  const categoryStats: Record<number, any> = {};
  categories.forEach((c: any) => {
    categoryStats[c.id] = {
      categoryId: c.id,
      categoryName: c.name,
      revenue: 0,
      orderCount: 0,
      orderIds: new Set(),
    };
  });

  for (const order of completedOrders) {
    for (const item of order.items) {
      const product: any = await Product.findOne({ id: item.productId }).lean();
      if (product && categoryStats[product.categoryId]) {
        categoryStats[product.categoryId].revenue += item.subtotal;
        categoryStats[product.categoryId].orderIds.add(order.id);
      }
    }
  }

  const results = Object.values(categoryStats).map((cs: any) => ({
    categoryId: cs.categoryId,
    categoryName: cs.categoryName,
    revenue: Number(cs.revenue.toFixed(2)),
    orderCount: cs.orderIds.size,
  }));

  const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);

  res.json(results.map(r => ({
    ...r,
    percentage: totalRevenue > 0 ? Number(((r.revenue / totalRevenue) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.revenue - a.revenue));
});

export default router;
