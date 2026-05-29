import { Router } from "express";
import { eq, gte, lte, and, sql, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { GetSalesReportQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/reports/sales", requireAdmin, async (req, res): Promise<void> => {
  const qp = GetSalesReportQueryParams.safeParse(req.query);

  const conditions = [eq(ordersTable.status, "completed" as any)];
  if (qp.success) {
    if (qp.data.from) conditions.push(gte(ordersTable.createdAt, new Date(qp.data.from)));
    if (qp.data.to) conditions.push(lte(ordersTable.createdAt, new Date(qp.data.to)));
  }

  const [summary] = await db.select({
    totalRevenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
    totalOrders: sql<number>`cast(count(*) as int)`,
    averageOrderValue: sql<number>`coalesce(avg(${ordersTable.total}), 0)`,
  }).from(ordersTable).where(and(...conditions));

  const dailyData = await db.select({
    date: sql<string>`to_char(date_trunc('day', ${ordersTable.createdAt}), 'YYYY-MM-DD')`,
    revenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
    orders: sql<number>`cast(count(*) as int)`,
  })
    .from(ordersTable)
    .where(and(...conditions))
    .groupBy(sql`date_trunc('day', ${ordersTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${ordersTable.createdAt})`);

  res.json({
    totalRevenue: Number(summary.totalRevenue) || 0,
    totalOrders: summary.totalOrders || 0,
    averageOrderValue: Number(summary.averageOrderValue) || 0,
    dailyData: dailyData.map(d => ({ date: d.date, revenue: Number(d.revenue), orders: d.orders })),
  });
});

router.get("/reports/top-products", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      productId: orderItemsTable.productId,
      productName: orderItemsTable.productName,
      productImageUrl: orderItemsTable.productImageUrl,
      totalQuantity: sql<number>`cast(sum(${orderItemsTable.quantity}) as int)`,
      totalRevenue: sql<number>`coalesce(sum(${orderItemsTable.subtotal}), 0)`,
      categoryName: categoriesTable.name,
    })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
    .leftJoin(productsTable, eq(productsTable.id, orderItemsTable.productId))
    .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
    .where(eq(ordersTable.status, "completed" as any))
    .groupBy(orderItemsTable.productId, orderItemsTable.productName, orderItemsTable.productImageUrl, categoriesTable.name)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
    .limit(10);

  res.json(rows.map(r => ({
    productId: r.productId,
    productName: r.productName,
    productImageUrl: r.productImageUrl ?? null,
    totalQuantity: r.totalQuantity,
    totalRevenue: Number(r.totalRevenue),
    categoryName: r.categoryName ?? null,
  })));
});

router.get("/reports/category-breakdown", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      categoryId: categoriesTable.id,
      categoryName: categoriesTable.name,
      revenue: sql<number>`coalesce(sum(${orderItemsTable.subtotal}), 0)`,
      orderCount: sql<number>`cast(count(distinct ${ordersTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(orderItemsTable, eq(orderItemsTable.productId, productsTable.id))
    .leftJoin(ordersTable, and(eq(ordersTable.id, orderItemsTable.orderId), eq(ordersTable.status, "completed" as any)))
    .groupBy(categoriesTable.id, categoriesTable.name)
    .orderBy(desc(sql`sum(${orderItemsTable.subtotal})`));

  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue), 0);

  res.json(rows.map(r => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    revenue: Number(r.revenue),
    orderCount: r.orderCount,
    percentage: totalRevenue > 0 ? Number(((Number(r.revenue) / totalRevenue) * 100).toFixed(1)) : 0,
  })));
});

export default router;
