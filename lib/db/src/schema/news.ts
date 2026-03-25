import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsTable = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  tag: text("tag").notNull(),
  tagColor: text("tag_color").notNull(),
  image: text("image"),
  readTime: text("read_time").notNull(),
  published: boolean("published").notNull().default(true),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsSchema = createInsertSchema(newsTable).omit({ id: true, createdAt: true });
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type NewsArticleRow = typeof newsTable.$inferSelect;
