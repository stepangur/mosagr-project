import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  company: text("company").notNull().default(""),
  content: text("content").notNull(),
  rating: integer("rating").notNull().default(5),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReviewRow = typeof reviewsTable.$inferSelect;
