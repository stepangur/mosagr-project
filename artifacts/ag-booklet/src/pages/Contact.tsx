import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitContactForm } from "@/hooks/use-contacts";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Building2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const contactSchema = z.object({
  name: z.string().min(2, "Введите ваше имя"),
  email: z.string().email("Некорректный email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Сообщение слишком короткое"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "МосАГРПроект",
  "legalName": "ООО «Минерал»",
  "description": "Профессиональная разработка буклета АГР (архитектурно-градостроительного облика) для согласования в Москомархитектуре (МКА). Свидетельство об утверждении АГР под ключ. Работаем в Москве и Московской области.",
  "url": "https://razrabotka-agr.ru",
  "telephone": "+7-495-568-18-77",
  "email": "office@razrabotka-agr.ru",
  "image": "https://razrabotka-agr.ru/images/hero-arch.webp",
  "priceRange": "от 20 000 ₽",
  "currenciesAccepted": "RUB",
  "paymentAccepted": "Безналичный расчёт, банковский перевод",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "10:00",
      "closes": "19:00"
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ул. Выборгская, д. 22",
    "addressLocality": "Москва",
    "postalCode": "125130",
    "addressCountry": "RU"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "55.8042",
    "longitude": "37.5219"
  },
  "areaServed": [
    { "@type": "City", "name": "Москва" },
    { "@type": "AdministrativeArea", "name": "Московская область" }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Услуги по разработке буклета АГР",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Разработка буклета АГР под ключ",
          "description": "Полный цикл: ТЭПы, визуализация фасада, НПМ/ВПМ модели, согласование в МКА, Свидетельство об утверждении АГР."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Консультация по требованиям МКА",
          "description": "Консультация по актуальным требованиям Москомархитектуры и Постановлению 284-ПП."
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "47",
    "bestRating": "5"
  },
  "sameAs": ["https://razrabotka-agr.ru"]
};

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const { mutate, isPending } = useSubmitContactForm();

  const onSubmit = (data: ContactFormValues) => {
    mutate({ data }, {
      onSuccess: () => reset()
    });
  };

  return (
    <>
      <Seo
        title="Контакты — МосАГРПроект | Разработка АГР в Москве, ул. Выборгская, 22"
        description="Офис МосАГРПроект в Москве: ул. Выборгская, д. 22, 125130. Тел. +7 (495) 568-18-77. Консультация по разработке буклета АГР и требованиям Москомархитектуры (МКА). Пн-Пт 10:00–19:00."
        keywords="контакты МосАГРПроект Москва, адрес разработка АГР, консультация Москомархитектура МКА, телефон буклет АГР, ООО Минерал Выборгская"
        path="/contact"
        breadcrumbs={[{ name: "Контакты", path: "/contact" }]}
        structuredData={professionalServiceSchema}
      />
      <Breadcrumb items={[{ name: "Контакты", path: "/contact" }]} />

      {/* Hero */}
      <section className="pt-12 pb-8 md:pt-24 md:pb-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 bg-primary/8 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/15">
              <Building2 className="w-4 h-4" />
              ООО «Минерал» — МосАГРПроект
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">
              Свяжитесь с нами
            </h1>
            <p className="text-lg text-slate-600">
              Ответим на вопросы по требованиям Москомархитектуры, рассчитаем стоимость разработки буклета АГР и проконсультируем по вашему объекту.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-primary text-white p-10 rounded-3xl shadow-xl flex flex-col"
            >
              <h2 className="text-2xl font-display font-bold mb-8">Контактная информация</h2>

              <div className="space-y-7 flex-1">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/60 mb-1">Офис в Москве</p>
                    <address className="not-italic text-base font-semibold leading-snug">
                      <span itemProp="streetAddress">ул. Выборгская, д. 22</span><br />
                      <span itemProp="addressLocality">Москва</span>,{" "}
                      <span itemProp="postalCode">125130</span>
                    </address>
                    <p className="text-xs text-white/50 mt-1">м. Войковская / Водный стадион</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/60 mb-1">Телефон</p>
                    <a
                      href="tel:+74955681877"
                      className="text-lg font-bold hover:text-white/80 transition-colors"
                      itemProp="telephone"
                    >
                      +7 (495) 568-18-77
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/60 mb-1">Email</p>
                    <a
                      href="mailto:office@razrabotka-agr.ru"
                      className="text-base font-semibold hover:text-white/80 transition-colors break-all"
                      itemProp="email"
                    >
                      office@razrabotka-agr.ru
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full shrink-0">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/60 mb-1">График работы</p>
                    <p className="text-base font-semibold">Пн–Пт: 10:00 — 19:00</p>
                    <p className="text-sm text-white/60">Сб–Вс: выходной</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-xs text-white/40 mb-3 font-semibold uppercase tracking-widest">Почему выбирают нас</p>
                <ul className="space-y-2">
                  {[
                    "Смета за 1 рабочий день",
                    "95% проектов с первого раза",
                    "Член СРО архитекторов",
                    "Работаем по Москве и МО",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-50 p-10 rounded-3xl border border-slate-100"
            >
              <h2 className="text-xl font-display font-bold text-slate-900 mb-6">Написать нам</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя <span className="text-red-500">*</span></Label>
                  <Input id="name" {...register("name")} className="bg-white" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" {...register("email")} className="bg-white" />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" {...register("phone")} className="bg-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Сообщение <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="message"
                    {...register("message")}
                    className="bg-white min-h-[150px]"
                    placeholder="Опишите ваш объект: адрес, тип, площадь — рассчитаем стоимость АГР..."
                  />
                  {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-base py-6 rounded-xl"
                  disabled={isPending}
                >
                  {isPending ? "Отправка..." : "Отправить сообщение"}
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  Ответим в течение 1 рабочего дня
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Реквизиты и SEO-текст */}
      <section className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-800 mb-4">О компании</h2>
              <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
                <p>
                  <strong>МосАГРПроект</strong> (ООО «Минерал») — специализированная организация по разработке буклетов АГР (архитектурно-градостроительного облика) для согласования в <strong>Москомархитектуре (МКА)</strong>.
                </p>
                <p>
                  Работаем по Москве и Московской области. Специализируемся на сложных объектах: жилые и коммерческие здания, реконструкция фасадов, благоустройство, рекламные конструкции, медиафасады.
                </p>
                <p>
                  Готовим полный пакет: состав буклета, <strong>ТЭПы</strong>, 3D-модели НПМ и ВПМ, загрузку на Мос.ру и сопровождение до <strong>Свидетельства об утверждении АГР</strong>.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-800 mb-4">Реквизиты</h2>
              <dl className="text-sm text-slate-600 space-y-1.5">
                <div className="flex gap-2">
                  <dt className="text-slate-400 shrink-0 w-28">Полное наименование</dt>
                  <dd className="font-medium">ООО «Минерал»</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 shrink-0 w-28">Бренд</dt>
                  <dd className="font-medium">МосАГРПроект</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 shrink-0 w-28">Адрес</dt>
                  <dd className="font-medium">125130, г. Москва, ул. Выборгская, д. 22</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 shrink-0 w-28">Телефон</dt>
                  <dd className="font-medium">
                    <a href="tel:+74955681877" className="text-primary hover:underline">+7 (495) 568-18-77</a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 shrink-0 w-28">Email</dt>
                  <dd className="font-medium">
                    <a href="mailto:office@razrabotka-agr.ru" className="text-primary hover:underline">office@razrabotka-agr.ru</a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 shrink-0 w-28">График</dt>
                  <dd className="font-medium">Пн–Пт: 10:00–19:00</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="bg-slate-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
            <iframe
              frameBorder="0"
              width="100%"
              height="500"
              src="https://makemap.2gis.ru/widget?data=eJw9UtGOmzAQ_Bf3MejOQIghb6mjElIXBXpSS6t7iILrc47EyDjcJVH-_dabtkgIvLMzO-vdKzG2lVa2uTQH6ayWA5n_vhJ37iWZky9y605WkoD01vTSOsQB1q7zOF1fqtHln-l6Wb1mXNH1Y61KPqHiZ3VyOQdiK4ed1b3T5giEzWox-Z_UPFWuBXKzqk5Iiquh5Iw2INryN9qkijZLH4v_ft-pYLVyfEbFQlGhlOeOjl-oGAEHLcGqwQEXtEAzLEpeAbd-afmUNgLqAbcRtcryhc8ZNdTE_2Xl0NMK9P2ZAT_n2EiWf8NcrDNVWKMFn2IPTfK3gu-r15I_0a-LvsA-VrV2PKTCeq9wLoBjvf9H4PgY-Bvrfckz1Mr4pPDevS_kY054z8E49gTaZ3h3eAe-DwH9fJ-mIl5M4KJ3pjMWrvgTjdLwTwSRS3Fs5TuZh_TfcwuIug_6jGO8T3lj9NGhAiyDPm4dLkHMHhIax2wWJMlDGidRlD0DX7dknkTs9hyQw7bfmEHfR3sl3dYBhLlhls4yRtMsDQPSeRjVkjCcUpYmUcjiGfgz5gDuGKjCjpiu-_EiZfcLo86e5O0D7zTLvA"
              sandbox="allow-modals allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
              className="w-full"
              title="Карта офиса МосАГРПроект — ул. Выборгская, 22, Москва"
            />
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            ул. Выборгская, д. 22, Москва, 125130 — ближайшие станции метро: Войковская, Водный стадион
          </p>
        </div>
      </section>
    </>
  );
}
