import { Router } from "express";
import { Order, Product, User, Category } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/admin/dashboard", requireAdmin, async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allOrders: any = await Order.find().lean();
  const totalProducts = await Product.countDocuments();
  const totalUsers = await User.countDocuments();

  const totalRevenue = allOrders.filter((o: any) => o.status === "completed").reduce((sum: number, o: any) => sum + o.total, 0);
  const totalOrders = allOrders.length;
  const activeOrders = allOrders.filter((o: any) => ["pending", "confirmed", "preparing", "ready"].includes(o.status)).length;
  const revenueToday = allOrders.filter((o: any) => o.createdAt >= today && o.status === "completed").reduce((sum: number, o: any) => sum + o.total, 0);
  const ordersToday = allOrders.filter((o: any) => o.createdAt >= today).length;

  const statusMap: Record<string, number> = {};
  allOrders.forEach((o: any) => {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
  });
  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Last 7 days revenue
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0,0,0,0);

  const dailyMap: Record<string, { revenue: number, orders: number }> = {};
  allOrders.filter((o: any) => o.createdAt >= sevenDaysAgo).forEach((o: any) => {
    const date = o.createdAt.toISOString().split('T')[0];
    if (!dailyMap[date]) dailyMap[date] = { revenue: 0, orders: 0 };
    dailyMap[date].orders++;
    if (o.status === "completed") dailyMap[date].revenue += o.total;
  });

  const revenueByDay = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, revenue: Number(data.revenue.toFixed(2)), orders: data.orders }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalOrders,
    activeOrders,
    totalProducts,
    totalUsers,
    revenueToday: Number(revenueToday.toFixed(2)),
    ordersToday,
    ordersByStatus,
    revenueByDay,
  });
});

router.get("/admin/low-stock", requireAdmin, async (req, res): Promise<void> => {
  const products: any = await Product.find({ stock: { $lt: 10 } }).sort({ stock: 1 }).lean();

  const results = await Promise.all(products.map(async (p: any) => {
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

router.get("/admin/recent-orders", requireAdmin, async (req, res): Promise<void> => {
  const orders: any = await Order.find().sort({ createdAt: -1 }).limit(20).lean();

  const results = await Promise.all(orders.map(async (o: any) => {
    const user: any = await User.findOne({ id: o.userId }).lean();
    return {
      id: o.id,
      userId: o.userId,
      userName: user?.name ?? "Customer",
      status: o.status,
      total: o.total,
      tableNumber: o.tableNumber ?? null,
      notes: o.notes ?? null,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      estimatedReadyTime: o.estimatedReadyTime ? o.estimatedReadyTime.toISOString() : null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: o.items.map((i: any) => ({
        id: i._id,
        productId: i.productId,
        productName: i.productName,
        productImageUrl: i.productImageUrl ?? null,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    };
  }));

  res.json(results);
});

export default router;
