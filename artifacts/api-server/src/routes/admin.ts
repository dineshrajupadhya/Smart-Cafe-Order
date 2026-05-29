import { Router } from "express";
import { eq, gte, sql, desc } from "drizzle-orm";
import { db, ordersTable, productsTable, usersTable, orderItemsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/admin/dashboard", requireAdmin, async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totals] = await db.select({
    totalRevenue: sql<number>`coalesce(sum(case when ${ordersTable.status} = 'completed' then ${ordersTable.total} else 0 end), 0)`,
    totalOrders: sql<number>`cast(count(*) as int)`,
    activeOrders: sql<number>`cast(count(case when ${ordersTable.status} in ('pending','confirmed','preparing','ready') then 1 end) as int)`,
    revenueToday: sql<number>`coalesce(sum(case when ${ordersTable.createdAt} >= ${today.toISOString()} and ${ordersTable.status} = 'completed' then ${ordersTable.total} else 0 end), 0)`,
    ordersToday: sql<number>`cast(count(case when ${ordersTable.createdAt} >= ${today.toISOString()} then 1 end) as int)`,
  }).from(ordersTable);

  const [productCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable);
  const [userCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable);

  const ordersByStatus = await db.select({
    status: ordersTable.status,
    count: sql<number>`cast(count(*) as int)`,
  }).from(ordersTable).groupBy(ordersTable.status);

  // Last 7 days revenue
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const revenueByDay = await db.select({
    date: sql<string>`to_char(date_trunc('day', ${ordersTable.createdAt}), 'YYYY-MM-DD')`,
    revenue: sql<number>`coalesce(sum(case when ${ordersTable.status} = 'completed' then ${ordersTable.total} else 0 end), 0)`,
    orders: sql<number>`cast(count(*) as int)`,
  })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, sevenDaysAgo))
    .groupBy(sql`date_trunc('day', ${ordersTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${ordersTable.createdAt})`);

  res.json({
    totalRevenue: Number(totals.totalRevenue) || 0,
    totalOrders: totals.totalOrders || 0,
    activeOrders: totals.activeOrders || 0,
    totalProducts: productCount.count || 0,
    totalUsers: userCount.count || 0,
    revenueToday: Number(totals.revenueToday) || 0,
    ordersToday: totals.ordersToday || 0,
    ordersByStatus: ordersByStatus.map(r => ({ status: r.status, count: r.count })),
    revenueByDay: revenueByDay.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: r.orders })),
  });
});

router.get("/admin/low-stock", requireAdmin, async (req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(sql`${productsTable.stock} < 10`).orderBy(productsTable.stock);
  res.json(products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    imageUrl: p.imageUrl ?? null,
    categoryId: p.categoryId,
    categoryName: null,
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

router.get("/admin/recent-orders", requireAdmin, async (req, res): Promise<void> => {
  const orders = await db
    .select({
      id: ordersTable.id,
      userId: ordersTable.userId,
      userName: usersTable.name,
      status: ordersTable.status,
      total: ordersTable.total,
      tableNumber: ordersTable.tableNumber,
      notes: ordersTable.notes,
      paymentMethod: ordersTable.paymentMethod,
      paymentStatus: ordersTable.paymentStatus,
      estimatedReadyTime: ordersTable.estimatedReadyTime,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(usersTable.id, ordersTable.userId))
    .orderBy(desc(ordersTable.createdAt))
    .limit(20);

  const orderIds = orders.map(o => o.id);
  const items = orderIds.length > 0 ? await db.select().from(orderItemsTable) : [];

  res.json(orders.map(o => ({
    ...o,
    userName: o.userName ?? null,
    tableNumber: o.tableNumber ?? null,
    notes: o.notes ?? null,
    estimatedReadyTime: o.estimatedReadyTime ? o.estimatedReadyTime.toISOString() : null,
    items: items.filter(i => i.orderId === o.id).map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImageUrl: i.productImageUrl ?? null,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
  })));
});

export default router;
