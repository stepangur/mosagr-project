import { Link } from "wouter";
import { ArrowRight, FileCheck, Landmark, Clock, ShieldCheck, ClipboardList, Pencil, CheckSquare, BadgeCheck, ChevronRight, Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";
import { useOrderModal } from "@/contexts/OrderModalContext";
import { useQuery } from "@tanstack/react-query";

type Settings = Record<string, string>;

interface Review {
  id: number;
  author: string;
  company: string;
  content: string;
  rating: number;
}

const features = [
  {
    icon: <Landmark className="w-6 h-6 text-primary" />,
    title: "По актуальным требованиям",
    description: "Буклеты соответствуют Приказу №282 от 17.10.2025 (ред. №338) и всем регламентам Москомархитектуры."
  },
  {
    icon: <FileCheck className="w-6 h-6 text-primary" />,
    title: "Под ключ",
    description: "От сбора исходных данных до получения Свидетельства об утверждении АГР."
  },
  {
    icon: <Clock className="w-6 h-6 text-primary" />,
    title: "Оптимальные сроки",
    description: "Подготовка материалов занимает от 10 рабочих дней благодаря отлаженным процессам."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-primary" />,
    title: "Высокая проходимость",
    description: "Более 95% наших проектов согласовываются с первого раза без замечаний."
  }
];

const steps = [
  {
    icon: <ClipboardList className="w-7 h-7 text-primary" />,
    num: "01",
    title: "Сбор исходных данных",
    desc: "Запрашиваем ГПЗУ, архитектурные планы, фотофиксацию и ТЗ заказчика. Консультируем по составу пакета.",
    days: "День 1–2"
  },
  {
    icon: <Pencil className="w-7 h-7 text-primary" />,
    num: "02",
    title: "Разработка буклета",
    desc: "Создаём 3D-визуализацию, фотомонтаж, разрабатываем все разделы альбома по шаблонам Москомархитектуры.",
    days: "День 3–8"
  },
  {
    icon: <CheckSquare className="w-7 h-7 text-primary" />,
    num: "03",
    title: "Согласование и подача",
    desc: "Загружаем материалы на портал Мос.ру, сопровождаем на предварительном и рабочем рассмотрении.",
    days: "День 9–12"
  },
  {
    icon: <BadgeCheck className="w-7 h-7 text-primary" />,
    num: "04",
    title: "Свидетельство АГР",
    desc: "Получаем Свидетельство об утверждении АГР — официальный документ Москомархитектуры.",
    days: "День 13–14+"
  },
];

const DEFAULT_STATS = [
  { value: "95%", label: "проектов с первого раза" },
  { value: "10+", label: "лет на рынке" },
  { value: "500+", label: "объектов согласовано" },
  { value: "от 10", label: "рабочих дней" },
];

export default function Home() {
  const { open } = useOrderModal();

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/public/settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/public/reviews"],
    queryFn: async () => {
      const res = await fetch("/api/public/reviews");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const s = (key: string, fallback = "") => settings?.[key] ?? fallback;

  const heroBadge = s("hero.badge", "Профессиональное проектирование в Москве");
  const heroTitle = s("hero.title", "Разработка и согласование Буклета АГР");
  const heroSubtitle = s("hero.subtitle", "Подготовим Архитектурно-градостроительный облик для вашего объекта и сопроводим до получения Свидетельства Москомархитектуры.");
  const heroCta1 = s("hero.cta1", "Оставить заявку");
  const heroCta2 = s("hero.cta2", "Смотреть услуги");

  const stats = settings
    ? [0, 1, 2, 3].map(i => ({
        value: s(`stats.${i}.value`, DEFAULT_STATS[i].value),
        label: s(`stats.${i}.label`, DEFAULT_STATS[i].label),
      }))
    : DEFAULT_STATS;

  return (
    <>
      <Seo
        title="Разработка буклета АГР в Москве"
        description={s("seo.description", "МосАГРПроект — профессиональная разработка буклета АГР для Москомархитектуры. Под ключ, от 10 рабочих дней, 95% с первого раза. Более 500 объектов согласовано в Москве.")}
        keywords={s("seo.keywords", "разработка буклета АГР Москва, согласование АГР Москомархитектура, буклет АГР цена, АГР под ключ, архитектурно-градостроительный облик Москва, разработка АГР стоимость")}
        path="/"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Разработка буклета АГР",
            "description": "Разработка буклета архитектурно-градостроительного облика (АГР) для согласования в Москомархитектуре. Под ключ: архитектурная концепция, 3D-модели ВПМ/НПМ, загрузка на Мос.ру, сопровождение.",
            "provider": {
              "@type": "ProfessionalService",
              "name": "МосАГРПроект",
              "url": "https://razrabotka-agr.ru"
            },
            "areaServed": { "@type": "City", "name": "Москва" },
            "serviceType": "Разработка буклета АГР",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "RUB",
              "priceSpecification": {
                "@type": "PriceSpecification",
                "minPrice": "80000",
                "priceCurrency": "RUB"
              }
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://razrabotka-agr.ru" }
            ]
          }
        ]}
      />
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-20">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <img
            src={`${import.meta.env.BASE_URL}images/blueprint-bg.webp`}
            alt=""
            className="w-full h-full object-cover"
            fetchPriority="high"
            loading="eager"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary text-[#11290f]"></span>
              </span>
              {heroBadge}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[1.1] mb-6">
              {heroTitle.includes("Буклета АГР") ? (
                <>
                  {heroTitle.split("Буклета АГР")[0]}
                  <br />
                  <span className="text-gradient">Буклета АГР</span>
                  {heroTitle.split("Буклета АГР")[1]}
                </>
              ) : (
                <span>{heroTitle}</span>
              )}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={() => open()}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {heroCta1} <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="/services"
                className="w-full sm:w-auto px-8 py-4 bg-white text-primary border-2 border-slate-200 rounded-xl font-semibold hover:border-primary/30 hover:bg-slate-50 transition-all duration-200 text-center"
              >
                {heroCta2}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex-1 w-full max-w-lg lg:max-w-none"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent z-10 mix-blend-overlay"></div>
              <img
                src={`${import.meta.env.BASE_URL}images/hero-arch.webp`}
                alt="Современная архитектура"
                className="w-full h-auto object-cover aspect-[4/3] transform hover:scale-105 transition-transform duration-700"
                width="909"
                height="496"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </section>
      {/* Stats strip */}
      <section className="bg-primary py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-3xl font-display font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-sm text-white/70">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Info / Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Что такое Буклет АГР?</h2>
            <p className="text-slate-600 text-lg">
              Архитектурно-градостроительный облик (АГР) — обязательный документ для согласования фасадных решений, рекламных конструкций и благоустройства в Москве. Рассматривается на заседании Комиссии Москомархитектуры.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                  {feature.icon}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Process */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Процесс работы</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Как мы работаем</h2>
            <p className="text-slate-500">От первого звонка до Свидетельства — прозрачный и понятный процесс.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-display font-extrabold text-slate-100 select-none">{step.num}</span>
                </div>
                <span className="inline-block text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5 mb-3 w-fit">{step.days}</span>
                <h3 className="font-display font-bold text-base mb-2 text-slate-900">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1">{step.desc}</p>
                {idx < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 z-10" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => open()}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Начать работу <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-block bg-amber-50 text-amber-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-amber-100">Отзывы клиентов</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Что говорят о нас</h2>
              <p className="text-slate-500">Реальные отзывы от заказчиков, чьи проекты мы успешно согласовали.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07 }}
                  className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 hover:shadow-lg hover:border-primary/10 transition-all duration-300 hover:-translate-y-1"
                >
                  <Quote className="w-7 h-7 text-primary/20" />
                  <p className="text-slate-700 text-sm leading-relaxed flex-1">{review.content}</p>
                  <div>
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-4 h-4 ${n <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{review.author}</p>
                    {review.company && <p className="text-xs text-slate-400 mt-0.5">{review.company}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary z-0"></div>
        <div className="absolute inset-0 opacity-10 mix-blend-luminosity" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')", backgroundSize: "cover" }}></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Готовы начать работу над вашим проектом?
          </h2>
          <p className="text-white/75 text-lg mb-10">
            Получите бесплатную консультацию по вашему объекту и предварительную оценку стоимости разработки буклета АГР.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => open()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-slate-100 shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              Оставить заявку <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/25 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-200"
            >
              Связаться с нами
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
