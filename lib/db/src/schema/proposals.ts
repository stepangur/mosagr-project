import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  companyName: text("company_name"),
  inn: text("inn"),
  kpp: text("kpp"),
  services: text("services").notNull(),
  totalPrice: text("total_price").notNull(),
  discountAmount: text("discount_amount"),
  deadline: text("deadline").notNull(),
  validDays: integer("valid_days").notNull(),
  managerName: text("manager_name"),
  managerPhone: text("manager_phone"),
  notes: text("notes"),
  action: text("action").notNull().default("sent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Proposal = typeof proposalsTable.$inferSelect;
