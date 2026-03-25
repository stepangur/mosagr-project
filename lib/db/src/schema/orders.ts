import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Юридическое лицо (заполняется через DaData)
  inn: text("inn"),
  companyName: text("company_name"),
  companyFullName: text("company_full_name"),
  companyKpp: text("company_kpp"),
  companyOgrn: text("company_ogrn"),
  companyLegalAddress: text("company_legal_address"),
  companyDirector: text("company_director"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  companyWebsite: text("company_website"),
  // Банковские реквизиты
  companyBankAccount: text("company_bank_account"),
  companyBankName: text("company_bank_name"),
  companyBik: text("company_bik"),
  companyCorrAccount: text("company_corr_account"),
  contactMethod: text("contact_method"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, status: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
