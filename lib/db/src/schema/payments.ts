import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { paymentMethodEnum, paymentStatusEnum } from "./orders";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amount: real("amount").notNull(),
  transactionId: text("transaction_id"),
  upiId: text("upi_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;
