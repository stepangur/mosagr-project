import { Router } from "express";
import { db } from "@workspace/db";
import { newsTable, templatesTable, servicesTable, siteSettingsTable, faqsTable, reviewsTable } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";

const router = Router();

router.get("/news", async (req, res) => {
  const articles = await db
    .select()
    .from(newsTable)
    .where(eq(newsTable.published, true))
    .orderBy(desc(newsTable.publishedAt));
  res.json(articles.map(mapNews));
});

router.get("/news/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [article] = await db
    .select()
    .from(newsTable)
    .where(eq(newsTable.id, id));
  if (!article || !article.published) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapNews(article));
});

router.get("/services", async (req, res) => {
  const items = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.active, true))
    .orderBy(asc(servicesTable.sortOrder));
  res.json(items.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    price: s.price,
    features: s.features,
    highlighted: s.highlighted,
    badge: s.badge,
    sortOrder: s.sortOrder,
  })));
});

router.get("/templates", async (req, res) => {
  const items = await db
    .select()
    .from(templatesTable)
    .orderBy(desc(templatesTable.createdAt));
  res.json(items.map(mapTemplate));
});

const PUBLIC_SETTINGS_KEYS = [
  "company.phone", "company.email", "company.address", "company.hours",
  "hero.badge", "hero.title", "hero.subtitle", "hero.cta1", "hero.cta2",
  "stats.0.value", "stats.0.label", "stats.1.value", "stats.1.label",
  "stats.2.value", "stats.2.label", "stats.3.value", "stats.3.label",
  "banner.enabled", "banner.text", "banner.url", "banner.color",
  "seo.description", "seo.keywords",
  "social.vk", "social.telegram", "social.max",
];

const DEFAULT_PUBLIC: Record<string, string> = {
  "company.phone": "+7 (495) 568-18-77",
  "company.email": "office@razrabotka-agr.ru",
  "company.address": "125130, Россия, г. Москва, ул. Выборгская, д. 22",
  "company.hours": "Пн–Пт: 9:00–18:00",
  "hero.badge": "Профессиональное проектирование в Москве",
  "hero.title": "Разработка и согласование Буклета АГР",
  "hero.subtitle": "Подготовим Архитектурно-градостроительный облик для вашего объекта и сопроводим до получения Свидетельства Москомархитектуры.",
  "hero.cta1": "Оставить заявку",
  "hero.cta2": "Смотреть услуги",
  "stats.0.value": "95%",
  "stats.0.label": "проектов с первого раза",
  "stats.1.value": "10+",
  "stats.1.label": "лет на рынке",
  "stats.2.value": "500+",
  "stats.2.label": "объектов согласовано",
  "stats.3.value": "от 10",
  "stats.3.label": "рабочих дней",
  "banner.enabled": "false",
  "banner.text": "",
  "banner.url": "",
  "banner.color": "primary",
  "seo.description": "МосАГРПроект — профессиональная разработка буклета АГР для Москомархитектуры.",
  "seo.keywords": "буклет АГР, Москомархитектура, разработка АГР Москва",
};

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable);
  const settings: Record<string, string> = { ...DEFAULT_PUBLIC };
  for (const row of rows) {
    if (PUBLIC_SETTINGS_KEYS.includes(row.key)) settings[row.key] = row.value;
  }
  res.json(settings);
});

router.get("/sitemap.xml", async (_req, res) => {
  const BASE = "https://razrabotka-agr.ru";
  const today = new Date().toISOString().slice(0, 10);

  const staticPages = [
    { loc: "/",            priority: "1.0", changefreq: "weekly" },
    { loc: "/requirements", priority: "0.9", changefreq: "monthly" },
    { loc: "/services",    priority: "0.9", changefreq: "monthly" },
    { loc: "/order",       priority: "0.85", changefreq: "monthly" },
    { loc: "/templates",   priority: "0.8", changefreq: "weekly" },
    { loc: "/news",        priority: "0.8", changefreq: "weekly" },
    { loc: "/contact",     priority: "0.7", changefreq: "monthly" },
    { loc: "/privacy",     priority: "0.3", changefreq: "yearly" },
  ];

  const articles = await db
    .select({ id: newsTable.id, publishedAt: newsTable.publishedAt, createdAt: newsTable.createdAt })
    .from(newsTable)
    .where(eq(newsTable.published, true))
    .orderBy(desc(newsTable.publishedAt));

  const urls = [
    ...staticPages.map((p) => `
  <url>
    <loc>${BASE}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...articles.map((a) => {
      const lastmod = (a.publishedAt ?? a.createdAt ?? new Date()).toISOString().slice(0, 10);
      return `
  <url>
    <loc>${BASE}/news/${a.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }),
  ].join("");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`);
});

router.get("/faq", async (_req, res) => {
  const rows = await db.select().from(faqsTable)
    .where(eq(faqsTable.active, true))
    .orderBy(asc(faqsTable.sortOrder), asc(faqsTable.id));
  res.json(rows);
});

router.get("/reviews", async (_req, res) => {
  const rows = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.active, true))
    .orderBy(asc(reviewsTable.sortOrder), asc(reviewsTable.id));
  res.json(rows);
});

function mapNews(a: typeof newsTable.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    tag: a.tag,
    tagColor: a.tagColor,
    image: a.image,
    readTime: a.readTime,
    published: a.published,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
  };
}

function mapTemplate(t: typeof templatesTable.$inferSelect) {
  return {
    id: t.id,
    title: t.title,
    category: t.category,
    type: t.type,
    tag: t.tag,
    tagColor: t.tagColor,
    description: t.description,
    free: t.free,
    image: t.image,
    fileUrl: t.fileUrl,
    fileName: t.fileName,
    createdAt: t.createdAt,
  };
}

// ─── YML-фид для Яндекс Бизнес / Карты ─────────────────────────────────────

router.get("/feed.yml", async (req, res) => {
  const items = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.active, true))
    .orderBy(asc(servicesTable.sortOrder));

  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

  const extractPrice = (t: string) => t.replace(/[^\d]/g, "") || "0";

  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const baseUrl = "https://razrabotka-agr.ru";

  const offers = items.map((s) => {
    const price = extractPrice(s.price);
    if (price === "0") return "";
    const desc = [s.description, s.features ? `\nВключает: ${s.features}` : ""].join("").trim();
    return `      <offer id="${s.id}" available="true">
        <name>${escapeXml(s.title)}</name>
        <vendor>МосАГРПроект</vendor>
        <url>${baseUrl}/services</url>
        <price>${price}</price>
        <currencyId>RUB</currencyId>
        <categoryId>1</categoryId>
        <picture>${baseUrl}/images/hero-arch.webp</picture>
        <description>${escapeXml(desc.slice(0, 3000))}</description>
        <shortDescription>${escapeXml(s.description.slice(0, 250))}</shortDescription>
      </offer>`;
  }).filter(Boolean).join("\n");

  const yml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog date="${now}">
  <shop>
    <name>МосАГРПроект</name>
    <company>ООО &quot;МИНЕРАЛ&quot;</company>
    <url>${baseUrl}</url>
    <currencies>
      <currency id="RUB" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Услуги по разработке буклета АГР</category>
    </categories>
    <offers>
${offers}
    </offers>
  </shop>
</yml_catalog>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(yml);
});

export default router;
