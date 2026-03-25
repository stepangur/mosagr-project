import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { servicesTable, faqsTable, reviewsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const BOT_UA = /yandex|googlebot|bingbot|slurp|duckduckbot|baiduspider|facebot|ia_archiver|crawler|spider|robot|scraper/i;

const BASE_URL = "https://razrabotka-agr.ru";
const SITE_NAME = "МосАГРПроект";

function isBot(ua: string | undefined): boolean {
  return !!ua && BOT_UA.test(ua);
}

const PAGE_META: Record<string, { title: string; description: string; h1: string; keywords: string }> = {
  "/": {
    title: "МосАГРПроект — Разработка буклета АГР в Москве | Москомархитектура",
    description: "Профессиональная разработка буклета АГР (архитектурно-градостроительного облика) для согласования в Москомархитектуре. Под ключ, от 2 недель, 95% с первого раза. Москва и Московская область.",
    h1: "Разработка и согласование Буклета АГР в Москве",
    keywords: "буклет АГР, разработка АГР Москва, согласование АГР Москомархитектура, архитектурно-градостроительный облик, АГР под ключ",
  },
  "/requirements": {
    title: "Требования к буклету АГР, Архитектурная комиссия и 3D-модели | МосАГРПроект",
    description: "Актуальные требования Москомархитектуры к буклету АГР. Порядок подачи в Архитектурную комиссию, государственная услуга по ПП №284-ПП, требования к 3D-моделям ВПМ и НПМ, IFC с 2026.",
    h1: "Требования Москомархитектуры к буклету АГР",
    keywords: "требования Москомархитектуры АГР, состав буклета АГР, ПП 284-ПП, 3D модель АГР, IFC АГР 2026",
  },
  "/services": {
    title: "Стоимость разработки буклета АГР в Москве | МосАГРПроект",
    description: "Актуальные цены на разработку буклета АГР в Москве и Московской области. Консультация, комплексная разработка, сопровождение согласования в Москомархитектуре.",
    h1: "Стоимость услуг по разработке буклета АГР",
    keywords: "стоимость буклета АГР, цена АГР Москва, разработка АГР цена, согласование АГР стоимость",
  },
  "/templates": {
    title: "Шаблоны и образцы документов для буклета АГР | МосАГРПроект",
    description: "Скачайте шаблоны и образцы документов для разработки буклета АГР. Актуальные бланки по требованиям Москомархитектуры.",
    h1: "Шаблоны документов для буклета АГР",
    keywords: "шаблоны АГР, образцы документов АГР, бланки Москомархитектура, скачать АГР",
  },
  "/news": {
    title: "Новости и изменения в требованиях АГР Москомархитектуры | МосАГРПроект",
    description: "Актуальные новости об изменениях в требованиях АГР, поправках к ПП №284-ПП и регламентах Москомархитектуры.",
    h1: "Новости АГР и Москомархитектуры",
    keywords: "новости АГР, изменения Москомархитектура, обновление требований АГР",
  },
  "/contact": {
    title: "Контакты МосАГРПроект — Разработка буклета АГР в Москве",
    description: "Свяжитесь с МосАГРПроект для консультации по разработке буклета АГР. Москва, ул. Выборгская д.22. Телефон: +7 (495) 568-18-77.",
    h1: "Контакты МосАГРПроект",
    keywords: "контакты МосАГРПроект, адрес АГР Москва, телефон разработка АГР",
  },
  "/order": {
    title: "Заказать разработку буклета АГР в Москве | МосАГРПроект",
    description: "Оставьте заявку на разработку буклета АГР для Москомархитектуры. Бесплатная консультация. Работаем в Москве и Московской области.",
    h1: "Заказать буклет АГР",
    keywords: "заказать буклет АГР, разработка АГР заказ, оставить заявку АГР",
  },
};

function buildBotHtml(path: string, extraContent: string): string {
  const meta = PAGE_META[path] || PAGE_META["/"];
  const canonical = `${BASE_URL}${path}`;

  const breadcrumbSchema = path !== "/" ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: meta.h1, item: canonical },
    ],
  }) : "";

  const orgSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    url: BASE_URL,
    telephone: "+74955681877",
    email: "office@razrabotka-agr.ru",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Выборгская, д. 22",
      addressLocality: "Москва",
      postalCode: "125130",
      addressCountry: "RU",
    },
    geo: { "@type": "GeoCoordinates", latitude: 55.7936, longitude: 37.5481 },
    areaServed: [
      { "@type": "City", name: "Москва" },
      { "@type": "State", name: "Московская область" },
    ],
    priceRange: "₽₽",
    openingHours: "Mo-Fr 09:00-18:00",
    serviceType: ["Разработка буклета АГР", "Согласование АГР Москомархитектура"],
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  <meta name="keywords" content="${meta.keywords}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE_URL}/opengraph.jpg">
  <meta property="og:locale" content="ru_RU">
  <script type="application/ld+json">${orgSchema}</script>
  ${breadcrumbSchema ? `<script type="application/ld+json">${breadcrumbSchema}</script>` : ""}
</head>
<body>
  <header>
    <a href="${BASE_URL}">${SITE_NAME}</a>
    <nav>
      <a href="${BASE_URL}/">Главная</a>
      <a href="${BASE_URL}/requirements">Требования АГР</a>
      <a href="${BASE_URL}/services">Стоимость услуг</a>
      <a href="${BASE_URL}/templates">Шаблоны</a>
      <a href="${BASE_URL}/news">Новости</a>
      <a href="${BASE_URL}/contact">Контакты</a>
    </nav>
  </header>
  <main>
    <h1>${meta.h1}</h1>
    <p>${meta.description}</p>
    ${extraContent}
    <section>
      <h2>О компании МосАГРПроект</h2>
      <p>МосАГРПроект — профессиональная компания по разработке буклета АГР (архитектурно-градостроительного облика) для согласования в Москомархитектуре. Работаем в Москве и Московской области. Более 500 объектов согласовано, 95% с первого раза. Сроки от 10 рабочих дней.</p>
      <address>
        <p>Адрес: 125130, Москва, ул. Выборгская, д. 22</p>
        <p>Телефон: <a href="tel:+74955681877">+7 (495) 568-18-77</a></p>
        <p>Email: <a href="mailto:office@razrabotka-agr.ru">office@razrabotka-agr.ru</a></p>
        <p>Режим работы: Пн–Пт 9:00–18:00</p>
      </address>
    </section>
  </main>
</body>
</html>`;
}

const STATIC_EXT = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|map|json|xml|txt|pdf|yml|yaml|mp4|webm)$/i;

export async function botRenderMiddleware(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"];
  if (!isBot(ua)) return next();

  // Skip static asset requests
  if (STATIC_EXT.test(req.path)) return next();

  const path = req.path;
  let extraContent = "";

  try {
    if (path === "/" || path === "/services") {
      const services = await db.select().from(servicesTable).where(eq(servicesTable.active, true)).orderBy(asc(servicesTable.order));
      if (services.length > 0) {
        extraContent += `<section><h2>Наши услуги по разработке АГР</h2><ul>`;
        for (const svc of services) {
          const price = svc.priceFrom ? `от ${svc.priceFrom.toLocaleString("ru-RU")} ₽` : "";
          extraContent += `<li><strong>${svc.title}</strong>${price ? ` — ${price}` : ""}${svc.description ? `: ${svc.description}` : ""}</li>`;
        }
        extraContent += `</ul></section>`;
      }
    }

    if (path === "/" || path === "/requirements") {
      const faqs = await db.select().from(faqsTable).where(eq(faqsTable.active, true)).orderBy(asc(faqsTable.order));
      if (faqs.length > 0) {
        const faqSchema = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map(f => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        });
        extraContent += `<script type="application/ld+json">${faqSchema}</script>`;
        extraContent += `<section><h2>Часто задаваемые вопросы об АГР</h2>`;
        for (const faq of faqs) {
          extraContent += `<details><summary>${faq.question}</summary><p>${faq.answer}</p></details>`;
        }
        extraContent += `</section>`;
      }
    }

    if (path === "/") {
      const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.active, true));
      if (reviews.length > 0) {
        extraContent += `<section><h2>Отзывы клиентов о разработке АГР</h2>`;
        for (const r of reviews) {
          extraContent += `<blockquote><p>${r.content}</p><cite>${r.author}${r.company ? `, ${r.company}` : ""}</cite></blockquote>`;
        }
        extraContent += `</section>`;
      }
    }
  } catch {
    // Non-critical: serve static content even if DB fails
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "index, follow");
  res.send(buildBotHtml(path, extraContent));
}
