import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { ordersTable, contactsTable, newsTable, templatesTable, servicesTable, siteSettingsTable, faqsTable, reviewsTable, proposalsTable, contractsTable } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { adminAuth, generateToken, verifyToken } from "../middlewares/adminAuth";
import { sendOrderNotification } from "../lib/telegram";
import { sendEmailTest, sendProposal, sendContract, ProposalData } from "../lib/email";

// Find uploads dir — works from both project root (prod) and artifacts/api-server/ (dev)
const uploadsDir = (
  [
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "artifacts", "api-server", "uploads"),
  ].find((d) => fs.existsSync(d)) ?? path.join(process.cwd(), "uploads")
);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function sanitizeFilename(name: string): string {
  const ext = name.includes(".") ? "." + name.split(".").pop()! : "";
  const base = name.replace(/\.[^.]+$/, "");
  const safe = base.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/g, "_").replace(/_+/g, "_");
  return safe + ext;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
  "application/pdf",
  // Documents & CAD
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip", "application/x-zip-compressed",
  // 3D / BIM (IFC files are served as octet-stream by most systems)
  "application/ifc",
  "application/x-step",
  "model/ifc",
  "application/octet-stream",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const safe = sanitizeFilename(file.originalname);
    cb(null, `${unique}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Недопустимый тип файла: ${file.mimetype}. Разрешены: изображения и PDF.`));
    }
  },
});

const ENV_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function getAdminPassword(): Promise<string> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "admin_password"));
  return row?.value || ENV_PASSWORD;
}

async function checkPassword(input: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2b$") || stored.startsWith("$2a$")) {
    return bcrypt.compare(input, stored);
  }
  return input === stored;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Слишком много попыток входа. Попробуйте через 15 минут." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const router = Router();

router.post("/login", loginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Пароль не указан" });
    return;
  }
  const correctPassword = await getAdminPassword();
  const valid = await checkPassword(password, correctPassword);
  if (!valid) {
    res.status(401).json({ error: "Неверный пароль" });
    return;
  }
  const token = generateToken();
  res.json({ ok: true, token });
});

router.post("/logout", (req, res) => {
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  if (!verifyToken(token)) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  res.json({ ok: true, token });
});

router.use(adminAuth);

router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "Новый пароль должен содержать минимум 6 символов" });
    return;
  }
  const storedPassword = await getAdminPassword();
  const valid = await checkPassword(currentPassword, storedPassword);
  if (!valid) {
    res.status(401).json({ error: "Текущий пароль указан неверно" });
    return;
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "admin_password"));
  if (existing) {
    await db.update(siteSettingsTable).set({ value: hashed }).where(eq(siteSettingsTable.key, "admin_password"));
  } else {
    await db.insert(siteSettingsTable).values({ key: "admin_password", value: hashed });
  }
  res.json({ ok: true });
});

router.get("/orders", async (req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map((o) => ({
    id: o.id,
    name: o.name,
    email: o.email,
    phone: o.phone,
    address: o.address,
    serviceType: o.serviceType,
    status: o.status,
    notes: o.notes,
    createdAt: o.createdAt,
    inn: o.inn,
    companyName: o.companyName,
    companyFullName: o.companyFullName,
    companyKpp: o.companyKpp,
    companyOgrn: o.companyOgrn,
    companyLegalAddress: o.companyLegalAddress,
    companyDirector: o.companyDirector,
    companyPhone: o.companyPhone,
    companyEmail: o.companyEmail,
    companyWebsite: o.companyWebsite,
    companyBankAccount: o.companyBankAccount,
    companyBankName: o.companyBankName,
    companyBik: o.companyBik,
    companyCorrAccount: o.companyCorrAccount,
  })));
});

router.put("/orders/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    status, notes,
    inn, companyName, companyFullName, companyKpp, companyOgrn, companyLegalAddress, companyDirector,
    companyPhone, companyEmail, companyWebsite,
    companyBankAccount, companyBankName, companyBik, companyCorrAccount,
  } = req.body;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (inn !== undefined) updates.inn = inn;
  if (companyName !== undefined) updates.companyName = companyName;
  if (companyFullName !== undefined) updates.companyFullName = companyFullName;
  if (companyKpp !== undefined) updates.companyKpp = companyKpp;
  if (companyOgrn !== undefined) updates.companyOgrn = companyOgrn;
  if (companyLegalAddress !== undefined) updates.companyLegalAddress = companyLegalAddress;
  if (companyDirector !== undefined) updates.companyDirector = companyDirector;
  if (companyPhone !== undefined) updates.companyPhone = companyPhone;
  if (companyEmail !== undefined) updates.companyEmail = companyEmail;
  if (companyWebsite !== undefined) updates.companyWebsite = companyWebsite;
  if (companyBankAccount !== undefined) updates.companyBankAccount = companyBankAccount;
  if (companyBankName !== undefined) updates.companyBankName = companyBankName;
  if (companyBik !== undefined) updates.companyBik = companyBik;
  if (companyCorrAccount !== undefined) updates.companyCorrAccount = companyCorrAccount;
  const [updated] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    address: updated.address,
    serviceType: updated.serviceType,
    status: updated.status,
    notes: updated.notes,
    createdAt: updated.createdAt,
    inn: updated.inn,
    companyName: updated.companyName,
    companyFullName: updated.companyFullName,
    companyKpp: updated.companyKpp,
    companyOgrn: updated.companyOgrn,
    companyLegalAddress: updated.companyLegalAddress,
    companyDirector: updated.companyDirector,
    companyPhone: updated.companyPhone,
    companyEmail: updated.companyEmail,
    companyWebsite: updated.companyWebsite,
    companyBankAccount: updated.companyBankAccount,
    companyBankName: updated.companyBankName,
    companyBik: updated.companyBik,
    companyCorrAccount: updated.companyCorrAccount,
  });
});

router.delete("/orders/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(ordersTable).where(eq(ordersTable.id, id));
  res.json({ ok: true });
});

router.get("/contacts", async (req, res) => {
  const contacts = await db.select().from(contactsTable).orderBy(desc(contactsTable.createdAt));
  res.json(contacts.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    message: c.message,
    createdAt: c.createdAt,
  })));
});

router.delete("/contacts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(contactsTable).where(eq(contactsTable.id, id));
  res.json({ ok: true });
});

// POST /admin/news/cover — upload cover image for a news article
router.post("/news/cover", adminAuth, upload.single("cover"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, error: "Файл не загружен" });
    return;
  }
  const imageUrl = `/api/uploads/${req.file.filename}`;
  res.json({ ok: true, imageUrl });
});

router.get("/news", async (req, res) => {
  const articles = await db.select().from(newsTable).orderBy(desc(newsTable.createdAt));
  res.json(articles.map(mapNews));
});

router.post("/news", async (req, res) => {
  const { title, excerpt, content, tag, tagColor, image, readTime, published } = req.body;
  const [article] = await db.insert(newsTable).values({
    title, excerpt, content, tag, tagColor, image, readTime,
    published: published ?? true,
    publishedAt: published ? new Date() : null,
  }).returning();
  res.status(201).json(mapNews(article));
});

router.get("/news/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [article] = await db.select().from(newsTable).where(eq(newsTable.id, id));
  if (!article) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapNews(article));
});

router.put("/news/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, excerpt, content, tag, tagColor, image, readTime, published } = req.body;
  const [updated] = await db.update(newsTable).set({
    title, excerpt, content, tag, tagColor, image, readTime,
    published: published ?? true,
    publishedAt: published ? new Date() : null,
  }).where(eq(newsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapNews(updated));
});

router.delete("/news/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(newsTable).where(eq(newsTable.id, id));
  res.json({ ok: true });
});

router.get("/templates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(templatesTable).where(eq(templatesTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapTemplate(item));
});

router.post("/templates/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const fileUrl = `/api/uploads/${req.file.filename}`;
  res.json({ fileUrl, fileName: req.file.originalname });
});

router.get("/templates", async (req, res) => {
  const items = await db.select().from(templatesTable).orderBy(desc(templatesTable.createdAt));
  res.json(items.map(mapTemplate));
});

router.post("/templates", async (req, res) => {
  const { title, category, type, tag, tagColor, description, free, image, fileUrl, fileName } = req.body;
  const [item] = await db.insert(templatesTable).values({
    title, category, type, tag, tagColor, description, free: free ?? true, image, fileUrl, fileName,
  }).returning();
  res.status(201).json(mapTemplate(item));
});

router.put("/templates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, category, type, tag, tagColor, description, free, image, fileUrl, fileName } = req.body;
  const [updated] = await db.update(templatesTable).set({
    title, category, type, tag, tagColor, description, free: free ?? true, image, fileUrl, fileName,
  }).where(eq(templatesTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mapTemplate(updated));
});

router.delete("/templates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(templatesTable).where(eq(templatesTable.id, id));
  res.json({ ok: true });
});

// ─── Services ───────────────────────────────────────────────────────────────

router.get("/services/export/yml", async (req, res) => {
  const { asc } = await import("drizzle-orm");
  const items = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.active, true))
    .orderBy(asc(servicesTable.sortOrder));

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const extractPrice = (priceText: string): string => {
    const digits = priceText.replace(/[^\d]/g, "");
    return digits || "0";
  };

  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const baseUrl = "https://razrabotka-agr.ru";

  const offers = items
    .map((s) => {
      const price = extractPrice(s.price);
      if (price === "0") return "";
      const desc = [s.description, s.features ? `\nВключает: ${s.features}` : ""].join("").trim();
      const shortDesc = s.description.slice(0, 250);
      return `      <offer id="${s.id}" available="true">
        <name>${escapeXml(s.title)}</name>
        <vendor>МосАГРПроект</vendor>
        <url>${baseUrl}/services</url>
        <price>${price}</price>
        <currencyId>RUB</currencyId>
        <categoryId>1</categoryId>
        <picture>${baseUrl}/images/hero-arch.webp</picture>
        <description>${escapeXml(desc.slice(0, 3000))}</description>
        <shortDescription>${escapeXml(shortDesc)}</shortDescription>
      </offer>`;
    })
    .filter(Boolean)
    .join("\n");

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
  res.setHeader("Content-Disposition", `attachment; filename="services-${Date.now()}.yml"`);
  res.send(yml);
});

router.get("/services", async (req, res) => {
  const { asc } = await import("drizzle-orm");
  const items = await db.select().from(servicesTable).orderBy(asc(servicesTable.sortOrder));
  res.json(items.map(mapService));
});

router.get("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapService(item));
});

router.post("/services", async (req, res) => {
  const { title, description, price, features, highlighted, badge, sortOrder, active } = req.body;
  const [item] = await db.insert(servicesTable).values({
    title, description, price,
    features: features ?? "",
    highlighted: highlighted ?? false,
    badge: badge || null,
    sortOrder: sortOrder ?? 0,
    active: active ?? true,
  }).returning();
  res.status(201).json(mapService(item));
});

router.put("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, price, features, highlighted, badge, sortOrder, active } = req.body;
  const [updated] = await db.update(servicesTable).set({
    title, description, price,
    features: features ?? "",
    highlighted: highlighted ?? false,
    badge: badge || null,
    sortOrder: sortOrder ?? 0,
    active: active ?? true,
  }).where(eq(servicesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapService(updated));
});

router.delete("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.json({ ok: true });
});

// ─── Site Settings ───────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Record<string, string> = {
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
  const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.put("/settings", async (req, res) => {
  const updates: Record<string, string> = req.body;
  for (const [key, value] of Object.entries(updates)) {
    await db.insert(siteSettingsTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: new Date() } });
  }
  res.json({ ok: true });
});

// ─── Telegram notification test ───────────────────────────────────────────────
router.post("/notify/test", async (req, res) => {
  try {
    const { botToken, chatId } = req.body as { botToken?: string; chatId?: string };
    if (!botToken || !chatId) {
      res.status(400).json({ ok: false, error: "Укажите токен бота и Chat ID" });
      return;
    }

    const text = [
      "✅ <b>Тест уведомлений МосАГРПроект</b>",
      "",
      "Если вы видите это сообщение — настройка выполнена верно!",
      "Новые заявки с сайта будут приходить сюда автоматически.",
      "",
      "🔧 <b>Пример заявки:</b>",
      "👤 Иван Иванов",
      "📞 +7 (495) 568-18-77",
      "📍 г. Москва, ул. Выборгская, д. 22",
      "🔧 Буклет АГР",
    ].join("\n");

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    const tgData = await tgRes.json() as { ok: boolean; description?: string };
    if (!tgData.ok) {
      res.status(400).json({ ok: false, error: tgData.description ?? "Ошибка Telegram API" });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── Email notification test ──────────────────────────────────────────────────
router.post("/notify/email/test", async (req, res) => {
  try {
    const { host, port, user, pass, from, recipients, secure } = req.body as {
      host?: string;
      port?: number;
      user?: string;
      pass?: string;
      from?: string;
      recipients?: string[];
      secure?: boolean;
    };

    if (!host || !user || !pass || !from || !recipients?.length) {
      res.status(400).json({ ok: false, error: "Заполните все SMTP-поля и укажите хотя бы один адрес получателя" });
      return;
    }

    await sendEmailTest({
      host,
      port: port ?? 587,
      secure: secure ?? false,
      user,
      pass,
      from,
      recipients,
    });

    res.json({ ok: true });
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    res.status(400).json({ ok: false, error: msg });
  }
});

// ─── FAQ ─────────────────────────────────────────────────────────────────────

router.get("/faq", async (_req, res) => {
  const rows = await db.select().from(faqsTable).orderBy(asc(faqsTable.sortOrder), asc(faqsTable.id));
  res.json(rows);
});

router.post("/faq", async (req, res) => {
  const { question, answer, sortOrder, active } = req.body;
  const [row] = await db.insert(faqsTable).values({ question, answer, sortOrder: sortOrder ?? 0, active: active ?? true }).returning();
  res.status(201).json(row);
});

router.put("/faq/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { question, answer, sortOrder, active } = req.body;
  const [updated] = await db.update(faqsTable).set({ question, answer, sortOrder: sortOrder ?? 0, active: active ?? true }).where(eq(faqsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/faq/:id", async (req, res) => {
  await db.delete(faqsTable).where(eq(faqsTable.id, parseInt(req.params.id)));
  res.json({ ok: true });
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

router.get("/reviews", async (_req, res) => {
  const rows = await db.select().from(reviewsTable).orderBy(asc(reviewsTable.sortOrder), asc(reviewsTable.id));
  res.json(rows);
});

router.post("/reviews", async (req, res) => {
  const { author, company, content, rating, active, sortOrder } = req.body;
  const [row] = await db.insert(reviewsTable).values({
    author, company: company ?? "", content, rating: rating ?? 5, active: active ?? true, sortOrder: sortOrder ?? 0,
  }).returning();
  res.status(201).json(row);
});

router.put("/reviews/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { author, company, content, rating, active, sortOrder } = req.body;
  const [updated] = await db.update(reviewsTable).set({
    author, company: company ?? "", content, rating: rating ?? 5, active: active ?? true, sortOrder: sortOrder ?? 0,
  }).where(eq(reviewsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/reviews/:id", async (req, res) => {
  await db.delete(reviewsTable).where(eq(reviewsTable.id, parseInt(req.params.id)));
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────

function mapService(s: typeof servicesTable.$inferSelect) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    price: s.price,
    features: s.features,
    highlighted: s.highlighted,
    badge: s.badge,
    sortOrder: s.sortOrder,
    active: s.active,
    createdAt: s.createdAt,
  };
}

// ────────────────────────────────────────────────────────────────────────────

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

// ─── Commercial Proposal ─────────────────────────────────────────────────────

async function saveProposalRecord(data: ProposalData, action: "sent" | "downloaded"): Promise<number | null> {
  try {
    const [row] = await db.insert(proposalsTable).values({
      orderId: data.orderId ?? null,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      companyName: data.companyName ?? null,
      inn: data.inn ?? null,
      kpp: data.kpp ?? null,
      services: JSON.stringify(data.services),
      totalPrice: data.totalPrice,
      discountAmount: data.discountAmount ?? null,
      deadline: data.deadline,
      validDays: data.validDays,
      managerName: data.managerName ?? null,
      managerPhone: data.managerPhone ?? null,
      notes: data.notes ?? null,
      action,
    }).returning({ id: proposalsTable.id });
    return row?.id ?? null;
  } catch (e) {
    console.error("[Proposals] Failed to save proposal record:", e);
    return null;
  }
}

router.get("/proposals", adminAuth, async (_req, res) => {
  const rows = await db.select().from(proposalsTable).orderBy(desc(proposalsTable.createdAt));
  res.json(rows);
});

router.post("/proposals/send", adminAuth, async (req, res) => {
  try {
    const data = req.body as ProposalData;

    if (!data.clientEmail || !data.clientName || !data.services?.length) {
      res.status(400).json({ ok: false, error: "Не заполнены обязательные поля: имя, email, услуги" });
      return;
    }

    const result = await sendProposal(data);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    await saveProposalRecord(data, "sent");
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
});

router.post("/proposals/pdf", adminAuth, async (req, res) => {
  try {
    const data = req.body as ProposalData;

    if (!data.clientName || !data.services?.length) {
      res.status(400).json({ error: "Не заполнены обязательные поля" });
      return;
    }

    const id = await saveProposalRecord(data, "downloaded");
    if (!id) {
      res.status(500).json({ error: "Не удалось сохранить КП" });
      return;
    }

    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? String(err) });
  }
});

// ─── Settings key endpoints ────────────────────────────────────────────────
router.get("/settings/key/:key", adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
    res.json({ value: row?.value ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.put("/settings/key/:key", adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body as { value: string };
    await db
      .insert(siteSettingsTable)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// ─── Contracts ─────────────────────────────────────────────────────────────
router.get("/contracts", adminAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(contractsTable).orderBy(desc(contractsTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post("/contracts/send", adminAuth, async (req, res) => {
  try {
    const data = req.body;

    if (!data.clientName || !data.contractNumber) {
      res.status(400).json({ ok: false, error: "Не заполнены обязательные поля" });
      return;
    }
    if (!data.clientEmail?.trim()) {
      res.status(400).json({ ok: false, error: "Не указан email получателя" });
      return;
    }

    const [templateRow] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "contract.template"));
    const template = templateRow?.value ?? null;

    const result = await sendContract(data, template);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    try {
      await db.insert(contractsTable).values({
        orderId: data.orderId ?? null,
        contractNumber: data.contractNumber,
        contractDate: data.contractDate,
        clientName: data.clientName,
        clientEmail: data.clientEmail ?? null,
        companyName: data.companyName ?? null,
        inn: data.inn ?? null,
        kpp: data.kpp ?? null,
        ogrn: data.ogrn ?? null,
        legalAddress: data.legalAddress ?? null,
        director: data.director ?? null,
        bankAccount: data.bankAccount ?? null,
        bankName: data.bankName ?? null,
        bik: data.bik ?? null,
        corrAccount: data.corrAccount ?? null,
        objectAddress: data.objectAddress ?? null,
        subject: data.subject ?? null,
        amount: data.amount ?? null,
        prepayment: data.prepayment ?? null,
        deadline: data.deadline ?? null,
        notes: data.notes ?? null,
      });
    } catch (e) {
      console.error("[Contracts] Failed to save record:", e);
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
});

async function saveContractRecord(data: Record<string, any>): Promise<number | null> {
  try {
    // Find max version for this contract number to implement versioning
    const existing = await db
      .select({ version: contractsTable.version })
      .from(contractsTable)
      .where(eq(contractsTable.contractNumber, data.contractNumber))
      .orderBy(desc(contractsTable.version))
      .limit(1);
    const nextVersion = (existing[0]?.version ?? 0) + 1;

    const values = {
      orderId: data.orderId ?? null,
      contractNumber: data.contractNumber,
      version: nextVersion,
      contractDate: data.contractDate,
      clientName: data.clientName,
      clientEmail: data.clientEmail ?? null,
      companyName: data.companyName ?? null,
      inn: data.inn ?? null,
      kpp: data.kpp ?? null,
      ogrn: data.ogrn ?? null,
      legalAddress: data.legalAddress ?? null,
      director: data.director ?? null,
      bankAccount: data.bankAccount ?? null,
      bankName: data.bankName ?? null,
      bik: data.bik ?? null,
      corrAccount: data.corrAccount ?? null,
      objectAddress: data.objectAddress ?? null,
      subject: data.subject ?? null,
      amount: data.amount ?? null,
      prepayment: data.prepayment ?? null,
      deadline: data.deadline ?? null,
      notes: data.notes ?? null,
    };
    const [row] = await db.insert(contractsTable).values(values).returning({ id: contractsTable.id });
    return row?.id ?? null;
  } catch (e) {
    console.error("[Contracts] Failed to save record:", e);
    return null;
  }
}

router.post("/contracts/pdf", adminAuth, async (req, res) => {
  try {
    const data = req.body;

    if (!data.clientName || !data.contractNumber) {
      res.status(400).json({ error: "Не заполнены обязательные поля" });
      return;
    }

    const id = await saveContractRecord(data);
    if (!id) {
      res.status(500).json({ error: "Не удалось сохранить договор" });
      return;
    }

    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? String(err) });
  }
});

router.post("/contracts/docx", adminAuth, async (req, res) => {
  try {
    const data = req.body;

    if (!data.clientName || !data.contractNumber) {
      res.status(400).json({ error: "Не заполнены обязательные поля" });
      return;
    }

    const id = await saveContractRecord(data);
    if (!id) {
      res.status(500).json({ error: "Не удалось сохранить договор" });
      return;
    }

    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? String(err) });
  }
});

// ─── Documents by order ──────────────────────────────────────────────────────

router.get("/orders/:orderId/proposals", adminAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const rows = await db
      .select()
      .from(proposalsTable)
      .where(eq(proposalsTable.orderId, orderId))
      .orderBy(desc(proposalsTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get("/orders/:orderId/contracts", adminAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const rows = await db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.orderId, orderId))
      .orderBy(desc(contractsTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get("/proposals/:id/pdf", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db.select().from(proposalsTable).where(eq(proposalsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const data: ProposalData = {
      clientName: row.clientName,
      clientEmail: row.clientEmail,
      companyName: row.companyName ?? undefined,
      inn: row.inn ?? undefined,
      kpp: row.kpp ?? undefined,
      services: JSON.parse(row.services),
      totalPrice: row.totalPrice,
      discountAmount: row.discountAmount ?? undefined,
      deadline: row.deadline,
      validDays: row.validDays,
      managerName: row.managerName ?? "",
      managerPhone: row.managerPhone ?? undefined,
      notes: row.notes ?? undefined,
      orderId: row.orderId ?? undefined,
    };

    const { generateProposalPdf } = await import("../lib/proposal-pdf");
    const pdfBuffer = await generateProposalPdf(data);

    const safeName = row.clientName.replace(/[^а-яА-ЯёЁa-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_") || "klient";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''%D0%9A%D0%9F_${encodeURIComponent(safeName)}.pdf`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get("/contracts/:id/pdf", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db.select().from(contractsTable).where(eq(contractsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const [templateRow] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "contract.template"));
    const template = templateRow?.value ?? null;

    const { generateContractPdf } = await import("../lib/contract-pdf");
    const pdfBuffer = await generateContractPdf(row, template);

    const safeName = String(row.contractNumber).replace(/[^а-яА-ЯёЁa-zA-Z0-9\-_]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''%D0%94%D0%BE%D0%B3%D0%BE%D0%B2%D0%BE%D1%80_${encodeURIComponent(safeName)}.pdf`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get("/contracts/:id/docx", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db.select().from(contractsTable).where(eq(contractsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const [templateRow] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "contract.template"));
    const template = templateRow?.value ?? null;

    const { generateContractDocx } = await import("../lib/contract-docx");
    const docxBuffer = await generateContractDocx(row, template);

    const safeName = String(row.contractNumber).replace(/[^а-яА-ЯёЁa-zA-Z0-9\-_]/g, "_");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''%D0%94%D0%BE%D0%B3%D0%BE%D0%B2%D0%BE%D1%80_${encodeURIComponent(safeName)}.docx`);
    res.setHeader("Content-Length", docxBuffer.length);
    res.end(docxBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

export default router;
