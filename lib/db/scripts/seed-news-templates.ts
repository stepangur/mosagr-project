import { db } from "../src";
import { newsTable, templatesTable } from "../src/schema";

async function seed() {
  const newsCount = await db.$count(newsTable);
  if (newsCount === 0) {
    await db.insert(newsTable).values([
      {
        title: "Обновлены требования к составу буклета АГР в 2026 году",
        excerpt: "Москомархитектура внесла изменения в Постановление № 284-ПП. С 1 апреля 2026 года в состав буклета АГР обязательно включение раздела об инсоляции и освещённости прилегающих территорий.",
        tag: "Законодательство",
        tagColor: "bg-blue-100 text-blue-700",
        image: "/images/hero-arch.png",
        readTime: "4 мин",
        published: true,
        publishedAt: new Date("2026-03-10"),
        content: `## Что изменилось\n\nМоскомархитектура опубликовала обновлённую редакцию Постановления Правительства Москвы № 284-ПП. Новые требования вступают в силу с **1 апреля 2026 года**.\n\n## Ключевые изменения\n\n### 1. Раздел об инсоляции и освещённости\n\nГлавное нововведение — обязательное включение в состав буклета АГР **расчётного раздела по инсоляции**.`,
      },
      {
        title: "Архсовет Москвы одобрил 47 проектов за февраль 2026",
        excerpt: "По итогам заседаний Архитектурного совета в феврале 2026 года согласование получили 47 объектов капитального строительства.",
        tag: "Практика",
        tagColor: "bg-green-100 text-green-700",
        image: "/images/blueprint-bg.png",
        readTime: "3 мин",
        published: true,
        publishedAt: new Date("2026-03-02"),
        content: `## Итоги февральских заседаний Архсовета\n\nВ феврале 2026 года состоялось **4 заседания Архитектурного совета Москвы**. По их итогам одобрение получили 47 проектов из 58 рассмотренных.`,
      },
      {
        title: "Пошаговое руководство по подаче документов в Москомархитектуру",
        excerpt: "Полная инструкция по порядку подачи документации для получения АГР-согласования в 2026 году.",
        tag: "Руководство",
        tagColor: "bg-amber-100 text-amber-700",
        image: "/images/hero-arch.png",
        readTime: "6 мин",
        published: true,
        publishedAt: new Date("2026-02-20"),
        content: `## Общий порядок действий\n\nПроцедура получения согласования АГР состоит из нескольких этапов. Рассмотрим каждый из них подробно.\n\n### Этап 1. Подготовка проектной документации\n\nНа первом этапе необходимо подготовить полный пакет проектной документации.`,
      },
    ]);
    console.log("Seeded news articles");
  }

  const tmplCount = await db.$count(templatesTable);
  if (tmplCount === 0) {
    await db.insert(templatesTable).values([
      {
        title: "Буклет АГР — Стандартный объект",
        category: "booklet",
        type: "DOCX",
        tag: "Базовый",
        tagColor: "bg-blue-100 text-blue-700",
        description: "Полный шаблон буклета АГР для объектов жилого и нежилого назначения по требованиям Москомархитектуры 2026 года.",
        free: true,
      },
      {
        title: "Буклет АГР — Реконструкция",
        category: "booklet",
        type: "DOCX",
        tag: "Реконструкция",
        tagColor: "bg-amber-100 text-amber-700",
        description: "Шаблон буклета для объектов реконструкции с адаптированными разделами под существующую застройку.",
        free: true,
      },
      {
        title: "3D-модель — Жилой комплекс",
        category: "model",
        type: "RVT",
        tag: "Revit",
        tagColor: "bg-purple-100 text-purple-700",
        description: "Параметрическая BIM-модель жилого комплекса со стандартными семействами фасадных элементов для Москвы.",
        free: false,
      },
      {
        title: "3D-модель — Офисное здание",
        category: "model",
        type: "SKP",
        tag: "SketchUp",
        tagColor: "bg-green-100 text-green-700",
        description: "Базовая 3D-модель офисного здания для фотомонтажей и визуализаций в составе буклета АГР.",
        free: false,
      },
      {
        title: "Шаблон фотомонтажа",
        category: "template",
        type: "PSD",
        tag: "Photoshop",
        tagColor: "bg-orange-100 text-orange-700",
        description: "Профессиональный шаблон для создания фотомонтажей с правильными слоями и масками для АГР.",
        free: true,
      },
      {
        title: "Шаблон ТЗ на буклет АГР",
        category: "template",
        type: "DOCX",
        tag: "Документы",
        tagColor: "bg-gray-100 text-gray-700",
        description: "Готовое техническое задание на разработку буклета АГР с заполненными типовыми требованиями.",
        free: true,
      },
    ]);
    console.log("Seeded templates");
  }

  console.log("Seeding complete");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
