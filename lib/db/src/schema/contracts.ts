import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"),
  contractNumber: text("contract_number").notNull(),
  version: integer("version").notNull().default(1),
  contractDate: text("contract_date").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  companyName: text("company_name"),
  inn: text("inn"),
  kpp: text("kpp"),
  ogrn: text("ogrn"),
  legalAddress: text("legal_address"),
  director: text("director"),
  bankAccount: text("bank_account"),
  bankName: text("bank_name"),
  bik: text("bik"),
  corrAccount: text("corr_account"),
  objectAddress: text("object_address"),
  subject: text("subject"),
  amount: text("amount"),
  prepayment: text("prepayment"),
  deadline: text("deadline"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Contract = typeof contractsTable.$inferSelect;
export type InsertContract = typeof contractsTable.$inferInsert;
