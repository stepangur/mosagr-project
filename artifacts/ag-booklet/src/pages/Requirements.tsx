import { CheckCircle2, FileText, Layers, Box, AlertCircle, Sparkles, Landmark, Monitor, BadgeCheck, Clock, XCircle, ChevronRight, Send, Users, Mail, LayoutTemplate, Clipboard, Download, ScrollText, Puzzle } from "lucide-react";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";
import { Link } from "wouter";
import { useOrderModal } from "@/contexts/OrderModalContext";

const npmParams = [
  { label: "Полигонаж", value: "до 150 000 треугольников" },
  { label: "Форматы файлов", value: "FBX + IFC (с 19.01.2026)" },
  { label: "Размер архива", value: "не более 20 МБ" },
  { label: "Текстуры", value: "Текстурный атлас (UV-развёртка)" },
  { label: "Состав", value: "Без подземных коммуникаций и интерьеров" },
  { label: "Назначение", value: "3D-карта Москвы, рассмотрение концепции" },
];

const vpmParams = [
  { label: "Полигонаж", value: "до 2 000 000 треугольников" },
  { label: "Форматы файлов", value: "FBX + IFC (с 19.01.2026)" },
  { label: "Размер архива", value: "до 500 МБ (благоустройство — до 1 ГБ)" },
  { label: "Развёртка текстур", value: "UDIM-развёртка" },
  { label: "GeoJSON", value: "Обязателен для геопривязки координат" },
  { label: "Назначение", value: "Архив цифрового двойника Москвы, Unreal Engine" },
];

const checklist = [
  "Форматы: FBX + IFC (с 19.01.2026 для BIM-проектов)",
  "IFC-файл соответствует требованиям от 02.04.2026 (Расп. ДГП и ДИТ от 16.01.2026)",
  "Именование: код_района_адрес_ (транслитерированный)",
  "Координаты сверены с кадастровыми данными",
  "GeoJSON приложен к ВПМ",
  "Полигонаж НПМ ≤ 150 тыс. треугольников",
  "Полигонаж ВПМ ≤ 2 млн треугольников",
  "Размер архива НПМ ≤ 20 МБ, ВПМ ≤ 500 МБ",
  "Тестирование модели в Unreal Engine",
  "Набор атрибутов Rus_set_AGR заполнен в ЦИМ АГР",
];

export default function Requirements() {
  const { open } = useOrderModal();
  return (
    <>
      <Seo
        title="Требования к буклету АГР, Архитектурная комиссия и 3D-модели"
        description="Актуальные требования Москомархитектуры к буклету АГР. Порядок подачи в Архитектурную комиссию, государственная услуга по ПП №284-ПП, требования к 3D-моделям ВПМ и НПМ, IFC с 2 апреля 2026."
        keywords="требования Москомархитектуры АГР, Архитектурная комиссия Москомархитектура, состав буклета АГР, ПП 284-ПП, ВПМ НПМ 3D модель, IFC АГР 2026, FBX модель Москомархитектура"
        path="/requirements"
        breadcrumbs={[{ name: "Требования", path: "/requirements" }]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Требования к буклету АГР — Москомархитектура",
          "description": "Актуальные требования к буклету АГР и 3D-моделям для Архитектурной комиссии Москомархитектуры.",
          "url": "https://razrabotka-agr.ru/requirements",
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", ".speakable"]
          }
        }}
      />
      <Breadcrumb items={[{ name: "Требования к буклету АГР", path: "/requirements" }]} />

      {/* Architectural Commission Section — FIRST BLOCK */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
              <Users className="w-4 h-4" />
              Приказ Москомархитектуры №282 от 17.10.2025 (ред. №338 от 26.11.2025)
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-4">
              Архитектурная комиссия по рассмотрению проектных материалов
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Комиссия работает при Комитете по архитектуре и градостроительству города Москвы в целях повышения качества проектных материалов — в том числе в сфере формирования архитектурно-художественного облика и благоустройства.
            </p>
          </motion.div>

          {/* Submission process steps */}
          <div className="max-w-5xl mx-auto mb-12">
            <h3 className="text-lg font-display font-bold text-slate-800 mb-6">Порядок подачи материалов на рассмотрение</h3>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  step: "1",
                  icon: <Send className="w-5 h-5 text-violet-600" />,
                  title: "Направить обращение",
                  desc: "На имя руководителя Департамента градостроительной политики В.А. Овчинского через электронную приёмную mos.ru или посредством системы московского электронного документооборота (МЭДО).",
                },
                {
                  step: "2",
                  icon: <Clipboard className="w-5 h-5 text-violet-600" />,
                  title: "Указать в обращении",
                  desc: "Цель с пометкой «О включении в повестку заседания Архитектурной комиссии», наименование и адрес объекта, вид проектных материалов, заказчика, проектную организацию и контакт ответственного лица.",
                },
                {
                  step: "3",
                  icon: <FileText className="w-5 h-5 text-violet-600" />,
                  title: "Приложить материалы",
                  desc: "В соответствии с «Требованиями к составу, содержанию и форматам представления проектных материалов», «Инструкцией по предоставлению исходных данных» и шаблоном презентации.",
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-violet-100 text-violet-700 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                      {s.step}
                    </div>
                    <div className="bg-violet-50 p-2 rounded-lg border border-violet-100">
                      {s.icon}
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{s.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Presentation templates + contact + download */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

            {/* Template types with download links */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 rounded-3xl p-8 border border-slate-200"
            >
              <h3 className="text-base font-display font-bold text-slate-900 mb-5 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-violet-600" />
                Шаблоны презентаций
              </h3>
              <ul className="space-y-1 mb-5">
                {[
                  { name: "Концепция АГР с НПМ", file: "/api/uploads/shablon-kontseptsiya-agr-npm.pptx", dl: "Шаблон_Концепция_АГР_НПМ.pptx" },
                  { name: "Проектные материалы АГР с НПМ или ВПМ", file: "/api/uploads/shablon-agr-npm-vpm.pptx", dl: "Шаблон_АГР_НПМ_ВПМ.pptx" },
                  { name: "Концепция благоустройства", file: "/api/uploads/shablon-blagoustroystvo.pptx", dl: "Шаблон_Концепция_благоустройства.pptx" },
                  { name: "АХК размещения информационных конструкций", file: "/api/uploads/shablon-viveski.pptx", dl: "Шаблон_АХК_информконструкции.pptx" },
                  { name: "Проект размещения крышной рекламной конструкции", file: "/api/uploads/shablon-krishnaya.pptx", dl: "Шаблон_Крышная_конструкция.pptx" },
                  { name: "Проект размещения рекламной конструкции на фасаде (медиафасад)", file: "/api/uploads/shablon-mediafasad.pptx", dl: "Шаблон_Медиафасад.pptx" },
                ].map((tmpl, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 py-2 border-b border-slate-200 last:border-0">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-snug">{tmpl.name}</span>
                    </div>
                    <a
                      href={tmpl.file}
                      download={tmpl.dl}
                      title="Скачать шаблон"
                      className="shrink-0 p-1.5 text-violet-500 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-400">Официальные шаблоны Москомархитектуры (ДГП). Формат PPTX.</p>
              <Link href="/templates" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                Все шаблоны в библиотеке →
              </Link>
            </motion.div>

            {/* Letter content + download + contact */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col gap-5"
            >
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex-1">
                <h3 className="text-base font-display font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-violet-600" />
                  Что указать в обращении
                </h3>
                <ul className="space-y-2 mb-6">
                  {[
                    "Цель с пометкой «О включении в повестку заседания Архитектурной комиссии»",
                    "Наименование и адресная привязка объекта (с районом и округом)",
                    "Финансирование: БЮДЖЕТ или ВНЕБЮДЖЕТ",
                    "Наименование прилагаемых проектных материалов",
                    "Наименование заказчика / правообладателя",
                    "Наименование проектной организации",
                    "Контактные данные ответственного лица (организация, должность, ФИО, телефон, e-mail)",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-violet-500 font-bold text-xs mt-1 shrink-0">{i + 1}.</span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/api/uploads/obrazec-obrascheniya-archkomissiya.doc"
                  download="Образец_обращения_Архитектурная_комиссия.doc"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-200"
                >
                  <FileText className="w-4 h-4" />
                  Скачать образец обращения (.doc)
                </a>
              </div>
              <div className="bg-violet-50 border border-violet-200 rounded-2xl px-6 py-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-violet-700 mb-0.5">Вопросы по трёхмерным моделям</div>
                  <a href="mailto:agr@str.mos.ru" className="text-sm font-bold text-violet-900 hover:underline">agr@str.mos.ru</a>
                  <div className="text-xs text-violet-600 mt-1">Официальный e-mail Москомархитектуры по вопросам ЦИМ АГР</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Regulatory documents */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto mt-8"
          >
            <h3 className="text-base font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-violet-600" />
              Нормативные документы Москомархитектуры
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: "Требования к составу, содержанию и форматам представления проектных материалов",
                  desc: "Обязательный документ для подготовки материалов на заседание Архитектурной комиссии. Содержит требования к буклету АГР, концепции благоустройства, информационным и рекламным конструкциям.",
                  file: "/api/uploads/trebovaniya-sostav-formaty.pdf",
                  dl: "Требования_состав_форматы.pdf",
                  ext: "PDF",
                  color: "bg-blue-50 border-blue-200",
                  badge: "bg-blue-100 text-blue-700",
                },
                {
                  title: "Инструкция по предоставлению исходных данных (НПМ, ВПМ)",
                  desc: "Официальная инструкция по подготовке и передаче данных для низкополигональной (НПМ) и высокополигональной (ВПМ) трёхмерных моделей. Обязательна для BIM-проектов с 19.01.2026.",
                  file: "/api/uploads/instruktsiya-npm-vpm.xlsx",
                  dl: "Инструкция_НПМ_ВПМ.xlsx",
                  ext: "XLSX",
                  color: "bg-green-50 border-green-200",
                  badge: "bg-green-100 text-green-700",
                },
              ].map((doc, i) => (
                <div key={i} className={`${doc.color} border rounded-2xl p-6 flex flex-col gap-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${doc.badge}`}>{doc.ext}</span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{doc.title}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">{doc.desc}</p>
                  <a
                    href={doc.file}
                    download={doc.dl}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:border-violet-400 hover:text-violet-700 transition-colors shadow-sm self-start"
                  >
                    <Download className="w-4 h-4" />
                    Скачать документ
                  </a>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3D Models Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
              <Sparkles className="w-4 h-4" />
              Новые требования с 19 января 2026 года
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-4">
              Трёхмерные модели: ВПМ и НПМ
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Распоряжение Москомархитектуры и ДИТ г. Москвы №&nbsp;64-16-429/25/1736 от 22.08.2025 вводит обязательную подачу двух типов 3D-моделей. Модели используются в цифровом двойнике Москвы и рассматриваются в&nbsp;Unreal Engine.
            </p>
          </motion.div>

          {/* Alert banners */}
          <div className="max-w-5xl mx-auto mb-10 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>С 19 января 2026 года</strong> (Распоряжение №64-16-429/25/1736 от 22.08.2025): для BIM-проектов формат <strong>IFC обязателен</strong> вместе с FBX. Количество пунктов проверки сокращено с 210 до 153 — согласование ускорилось. Контакт по вопросам 3D-моделей: <a href="mailto:agr@str.mos.ru" className="underline font-semibold">agr@str.mos.ru</a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong>Со 2 апреля 2026 года</strong> (Совместное распоряжение ДГП и ДИТ от 16.01.2026 №ДГП-Р-1/26/64-16-6/26): вступают в силу <strong>требования к материалам в формате IFC</strong>, представляемым в целях согласования АГР объектов капитального строительства. Подготовьте IFC-файлы заблаговременно.
              </div>
            </motion.div>
          </div>

          {/* Instruction download strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto mb-10 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <ScrollText className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-slate-900">Инструкция по предоставлению исходных данных (НПМ, ВПМ)</div>
                <div className="text-xs text-slate-500 mt-0.5">Официальная инструкция Москомархитектуры по подготовке 3D-моделей для согласования АГР · XLSX</div>
              </div>
            </div>
            <a
              href="/api/uploads/instruktsiya-npm-vpm.xlsx"
              download="Инструкция_НПМ_ВПМ.xlsx"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm shrink-0"
            >
              <Download className="w-4 h-4" />
              Скачать инструкцию
            </a>
          </motion.div>

          {/* НПМ + ВПМ Cards */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mb-14">

            {/* НПМ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 rounded-3xl p-8 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <Box className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Low-poly</div>
                  <h3 className="text-xl font-display font-bold text-slate-900">НПМ — Низкополигональная модель</h3>
                </div>
              </div>
              <div className="space-y-3">
                {npmParams.map((p, i) => (
                  <div key={i} className="flex justify-between gap-4 py-2 border-b border-slate-200 last:border-0">
                    <span className="text-sm text-slate-500 shrink-0">{p.label}</span>
                    <span className="text-sm font-semibold text-slate-800 text-right">{p.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700">
                <strong>Подаётся:</strong> при рассмотрении концепции и при оформлении Свидетельства об утверждении АГР
              </div>
            </motion.div>

            {/* ВПМ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 rounded-3xl p-8 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-violet-100 p-2.5 rounded-xl">
                  <Box className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide">High-poly</div>
                  <h3 className="text-xl font-display font-bold text-slate-900">ВПМ — Высокополигональная модель</h3>
                </div>
              </div>
              <div className="space-y-3">
                {vpmParams.map((p, i) => (
                  <div key={i} className="flex justify-between gap-4 py-2 border-b border-slate-200 last:border-0">
                    <span className="text-sm text-slate-500 shrink-0">{p.label}</span>
                    <span className="text-sm font-semibold text-slate-800 text-right">{p.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-violet-50 rounded-xl px-4 py-3 text-xs text-violet-700">
                <strong>Подаётся:</strong> при рассмотрении АГР с детализацией фасадов и при оформлении Свидетельства
              </div>
            </motion.div>
          </div>

          {/* MSI Tools Plugin */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto mb-10"
          >
            <div className="bg-gradient-to-br from-violet-950 to-slate-900 rounded-3xl p-8 md:p-10 border border-violet-800/50">
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-violet-500/20 p-2.5 rounded-xl">
                      <Puzzle className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Официальный инструмент</div>
                      <h3 className="text-xl font-display font-bold text-white">MSI MOS Tools — плагин для Blender</h3>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Официальный плагин от Москомархитектуры с инструментами для проверки и подготовки 3D-моделей АГР. Позволяет ускорить и корректно разработать модели в соответствии с требованиями ДГП.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 mb-8">
                    {[
                      "Проверка плотности текстур",
                      "Отображение коллизии",
                      "Поиск искажений",
                      "Поиск пересечений коллизии",
                      "Мердж вершин",
                      "Триангуляция",
                      "Изолированные вершины",
                      "Color Attributes",
                      "GEOJSON Export",
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="text-sm text-slate-300">{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="/api/uploads/msi-mos-tools-blender.zip"
                      download="MSI_MOS_Tools_Blender.zip"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Скачать плагин (.zip)
                    </a>
                    <div className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-xl text-xs text-slate-400">
                      <Box className="w-4 h-4 text-violet-400" />
                      Совместим с Blender · Бесплатно
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-10"
          >
            <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Чек-лист перед подачей 3D-моделей
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Timing table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto mt-10"
          >
            <h3 className="text-lg font-display font-bold text-slate-800 mb-4">Когда подавать модели</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Этап согласования</th>
                    <th className="text-center px-4 py-3 font-semibold text-blue-700">НПМ</th>
                    <th className="text-center px-4 py-3 font-semibold text-violet-700">ВПМ</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Рассмотрение концепции (без детализации фасадов)", true, false],
                    ["Рассмотрение АГР с детализацией фасадов", true, true],
                    ["Оформление Свидетельства об утверждении АГР", true, true],
                  ].map(([label, npm, vpm], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-5 py-3 text-slate-600">{label as string}</td>
                      <td className="px-4 py-3 text-center">
                        {npm ? <span className="text-green-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {vpm ? <span className="text-green-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* State Service Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-5">
              <Landmark className="w-4 h-4" />
              ПП №284-ПП от 30.04.2013, редакция от 01.10.2025
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-4">
              Государственная услуга: Свидетельство АГР
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Оформление свидетельства об утверждении АГР осуществляется Комитетом по архитектуре и градостроительству города Москвы (Москомархитектура) исключительно в электронной форме.
            </p>
          </motion.div>

          {/* 4 key stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mb-14">
            {[
              {
                icon: <Landmark className="w-6 h-6 text-primary" />,
                label: "Ответственный орган",
                value: "Комитет по архитектуре и градостроительству города Москвы",
                sub: "Москомархитектура",
              },
              {
                icon: <Monitor className="w-6 h-6 text-blue-600" />,
                label: "Способ подачи",
                value: "Портал государственных услуг города Москвы",
                sub: "mos.ru — только в электронной форме",
              },
              {
                icon: <BadgeCheck className="w-6 h-6 text-green-600" />,
                label: "Стоимость услуги",
                value: "Бесплатно",
                sub: "Государственная пошлина не взимается",
              },
              {
                icon: <Clock className="w-6 h-6 text-amber-600" />,
                label: "Срок рассмотрения",
                value: "10–20 рабочих дней",
                sub: "Зависит от значения объекта",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-200 rounded-2xl p-6"
              >
                <div className="bg-slate-50 rounded-xl p-2.5 inline-flex mb-4 shadow-sm">
                  {card.icon}
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{card.label}</div>
                <div className="text-base font-bold text-slate-900 mb-1 leading-snug">{card.value}</div>
                <div className="text-xs text-slate-500">{card.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Processing times table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto mb-10"
          >
            <h3 className="text-lg font-display font-bold text-slate-800 mb-4">Сроки по категориям объектов (п. 2.7 Регламента)</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Категория объекта</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Срок (рабочих дней)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Объекты окружного значения", "10"],
                    ["Объекты городского значения", "20"],
                    ["Объекты программы реновации жилищного фонда", "15"],
                  ].map(([label, days], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                      <td className="px-5 py-3 text-slate-700">{label}</td>
                      <td className="px-4 py-3 text-center font-bold text-primary">{days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-2">Срок исчисляется со дня регистрации запроса в ведомственной системе Комитета (не позднее 1 рабочего дня с момента подачи).</p>
          </motion.div>

          {/* Documents + Formats grid */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mb-10">

            {/* Documents required */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border border-slate-200"
            >
              <h3 className="text-lg font-display font-bold text-slate-900 mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Документы заявителя (п. 2.5.1.1)
              </h3>
              <ul className="space-y-3">
                {[
                  "Запрос (заявление) через интерактивную форму на Портале",
                  "Материалы АГР объекта капитального строительства",
                  "Схема планировочной организации, совмещённая со схемой транспортной организации (DWG, М 1:500)",
                  "Доверенность на представителя (при наличии) — ZIP с УКЭП",
                  "Правоустанавливающие документы на земельный участок (PDF, если не в ЕГРН)",
                ].map((doc, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 leading-snug">{doc}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 text-xs text-slate-400">
                Перечень является исчерпывающим (п. 2.5.5 Регламента). Документы из п. 2.5.1.2 Комитет запрашивает самостоятельно.
              </div>
            </motion.div>

            {/* File formats */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border border-slate-200"
            >
              <h3 className="text-lg font-display font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Форматы файлов (п. 2.5.3 Регламента)
              </h3>
              <div className="space-y-3">
                {[
                  { what: "Материалы АГР (альбом)", format: "PDF" },
                  { what: "Схема планировочной организации (СПОЗУ)", format: "DWG (редактируемый, М 1:500)" },
                  { what: "НПМ (низкополигональная 3D-модель)", format: "FBX + IFC в ZIP-архиве" },
                  { what: "ВПМ (высокополигональная 3D-модель)", format: "FBX + PNG + GeoJSON в ZIP-архиве" },
                  { what: "Доверенность / полномочия представителя", format: "ZIP (с УКЭП)" },
                ].map((row, i) => (
                  <div key={i} className="flex flex-col gap-0.5 py-2.5 border-b border-slate-200 last:border-0">
                    <span className="text-xs text-slate-500">{row.what}</span>
                    <span className="text-sm font-semibold text-slate-800">{row.format}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Grounds for refusal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto bg-red-50 border border-red-100 rounded-3xl p-8"
          >
            <h3 className="text-lg font-display font-bold text-slate-900 mb-5 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Основания для отказа (п. 2.10.1 Регламента)
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Несоответствие материалов требованиям Регламента или законодательства",
                "Несоответствие АГР данным ГПЗУ или проекту планировки территории",
                "Несоответствие объекта функциональному назначению, объёмно-планировочным, колористическим характеристикам",
                "Документы утратили силу или содержат противоречивые сведения",
                "Отрицательное заключение Департамента культурного наследия (для ОКН)",
                "Отрицательное заключение Комитета по туризму (для средств размещения)",
                "Несоответствие местоположения участка территориальному делению Москвы",
                "Срок использования ГПЗУ истёк для подготовки проектной документации",
                "Подача повторного запроса на идентичный объект без изменений",
                "Объект, для которого АГР не требуется по Положению о порядке утверждения АГР",
              ].map((reason, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-snug">{reason}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 text-xs text-slate-500">
              Перечень оснований для отказа является исчерпывающим (п. 2.10.2). Решение направляется заявителю в Личный кабинет Портала не позднее 1 рабочего дня с даты его принятия.
            </div>
          </motion.div>

        </div>
      </section>

      {/* CTA */}
      <div className="bg-slate-50 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-primary rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-8 justify-between">
              <div>
                <h3 className="text-2xl font-bold font-display mb-2">Готовы получить Свидетельство АГР?</h3>
                <p className="text-white/80 max-w-md">
                  Подготовим полный комплект материалов АГР — буклет, СПОЗУ, ВПМ и НПМ — по актуальным требованиям Регламента. Сопроводим на всех этапах вплоть до получения Свидетельства.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => open()}
                  className="whitespace-nowrap px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-lg text-center"
                >
                  Оставить заявку
                </button>
                <Link
                  href="/services"
                  className="whitespace-nowrap px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-center text-sm"
                >
                  Смотреть услуги
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
