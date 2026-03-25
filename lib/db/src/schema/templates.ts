import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templatesTable = pgTable("templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  tag: text("tag").notNull(),
  tagColor: text("tag_color").notNull(),
  description: text("description").notNull(),
  free: boolean("free").notNull().default(true),
  image: text("image"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templatesTable).omit({ id: true, createdAt: true });
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type TemplateRow = typeof templatesTable.$inferSelect;
