import { Check, ArrowRight, Briefcase, PhoneCall, Star, Shield, Clock, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect, useRef } from "react";
import { useOrderModal } from "@/contexts/OrderModalContext";

function WireframeCanvas({ light = false, fullPage = false }: { light?: boolean; fullPage?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouse = { x: -999, y: -999 };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", () => { mouse = { x: -999, y: -999 }; });

    const NODE_COUNT = light ? 55 : 60;
    const MAX_DIST = light ? 150 : 160;
    const MOUSE_DIST = 120;

    const lineColor = light
      ? (a: number) => `rgba(99, 102, 241, ${a * 0.28})`
      : (a: number) => `rgba(99, 102, 241, ${a * 0.35})`;
    const dotColor = light
      ? (near: boolean) => near ? `rgba(99, 102, 241, 0.7)` : `rgba(148, 163, 184, 0.55)`
      : (near: boolean) => near ? `rgba(139, 92, 246, 0.9)` : `rgba(99, 102, 241, 0.55)`;

    interface Node {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
    }

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.5 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((n) => {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_DIST) {
          const force = (MOUSE_DIST - d) / MOUSE_DIST * 0.8;
          n.x -= dx * force * 0.04;
          n.y -= dy * force * 0.04;
        }
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const alpha = 1 - d / MAX_DIST;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = lineColor(alpha);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const isNear = d < MOUSE_DIST;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isNear ? n.r * 2.2 : n.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor(isNear);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [light]);

  return (
    <canvas
      ref={canvasRef}
      className={fullPage ? "fixed inset-0 w-full h-full z-0" : "absolute inset-0 w-full h-full"}
      style={{ pointerEvents: "none" }}
    />
  );
}

interface ServiceItem {
  id: number;
  title: string;
  description: string;
  price: string;
  features: string;
  highlighted: boolean;
  badge?: string;
  sortOrder: number;
}

export default function Services() {
  const { open } = useOrderModal();
  const { data: services = [] } = useQuery<ServiceItem[]>({
    queryKey: ["/api/public/services"],
    queryFn: async () => {
      const res = await fetch("/api/public/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const { data: faqs = [] } = useQuery<Array<{ id: number; question: string; answer: string }>>({
    queryKey: ["/api/public/faq"],
    queryFn: async () => {
      const res = await fetch("/api/public/faq");
      if (!res.ok) throw new Error("Failed to fetch faq");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <>
      <WireframeCanvas light fullPage />
      <Seo
        title="Цена разработки буклета АГР в Москве — услуги и сметы | МосАГРПроект"
        description="Стоимость разработки буклета АГР в Москве от 20 000 ₽. Смета за 1 день, СРО, гарантия Свидетельства МКА. Консультация по требованиям Москомархитектуры, ТЭПы, 3D-модели, сопровождение под ключ."
        keywords="цена разработки АГР Москва, смета буклет АГР, стоимость согласования АГР МКА, СРО архитектурный проект Москва, услуги АГР Москомархитектура, ТЭПы АГР, буклет АГО под ключ, разработка буклета АГР Московская область, Свидетельство об утверждении АГР цена"
        path="/services"
        breadcrumbs={[{ name: "Услуги", path: "/services" }]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Разработка буклета АГР",
            "description": "Профессиональная разработка буклета АГР (архитектурно-градостроительного облика) для согласования в Москомархитектуре. Под ключ, от 10 рабочих дней.",
            "provider": {
              "@type": "ProfessionalService",
              "name": "МосАГРПроект",
              "url": "https://razrabotka-agr.ru"
            },
            "areaServed": { "@type": "City", "name": "Москва" },
            "serviceType": "Архитектурное проектирование",
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "RUB",
              "lowPrice": "20000",
              "offerCount": "3"
            }
          },
          ...(faqs.length > 0 ? [{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((f: { question: string; answer: string }) => ({
              "@type": "Question",
              "name": f.question,
              "acceptedAnswer": { "@type": "Answer", "text": f.answer }
            }))
          }] : [])
        ]}
      />
      <Breadcrumb items={[{ name: "Стоимость услуг по АГР", path: "/services" }]} />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-white">
        {/* Subtle background accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-[360px] h-[360px] rounded-full bg-indigo-100/60 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-primary/8 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-primary/15">
              <Briefcase className="w-4 h-4" />
              Услуги и стоимость
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-5 leading-tight">
              Разработка буклета АГР<br className="hidden md:block" />
              <span className="text-primary"> под ключ</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12">
              Берём на себя полный цикл — от анализа документации до получения Свидетельства об утверждении АГР в Москомархитектуре.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: Shield, text: "Гарантия результата" },
                { icon: Clock, text: "Сроки от 10 рабочих дней" },
                { icon: Users, text: "Команда архитекторов и визуализаторов" },
              ].map((item, i) => (
                <div key={i} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-600">
                  <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="relative py-20 bg-slate-50 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start max-w-6xl mx-auto">
            {services.map((svc, idx) => {
              const features = svc.features
                .split("\n")
                .map((f) => f.trim())
                .filter(Boolean);
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.12 }}
                  className={`relative flex flex-col rounded-3xl border overflow-visible ${
                    svc.highlighted
                      ? "bg-primary text-white border-primary shadow-2xl shadow-primary/25 md:-mt-4 md:mb-4"
                      : "bg-white text-slate-900 border-slate-200 shadow-md"
                  }`}
                >
                  {svc.badge && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md">
                        <Star className="w-3 h-3 fill-amber-900" />
                        {svc.badge}
                      </span>
                    </div>
                  )}

                  <div className={`px-8 pt-10 pb-6 ${svc.badge ? "mt-2" : ""}`}>
                    <h3 className={`text-xl font-display font-bold mb-2 ${svc.highlighted ? "text-white" : "text-slate-900"}`}>
                      {svc.title}
                    </h3>
                    <p className={`text-sm mb-6 leading-relaxed ${svc.highlighted ? "text-white/75" : "text-slate-500"}`}>
                      {svc.description}
                    </p>
                    <div className={`text-3xl font-display font-extrabold ${svc.highlighted ? "text-white" : "text-primary"}`}>
                      {svc.price}
                    </div>
                    <div className={`text-xs mt-1 ${svc.highlighted ? "text-white/60" : "text-slate-400"}`}>
                      Окончательная стоимость зависит от площади и сложности объекта
                    </div>
                  </div>

                  <div className={`mx-8 border-t ${svc.highlighted ? "border-white/20" : "border-slate-100"}`} />

                  <ul className="px-8 py-6 space-y-3 flex-1">
                    {features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${svc.highlighted ? "bg-white/20" : "bg-primary/10"}`}>
                          <Check className={`w-3 h-3 ${svc.highlighted ? "text-white" : "text-primary"}`} />
                        </span>
                        <span className={`text-sm leading-snug ${svc.highlighted ? "text-white/90" : "text-slate-600"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="px-8 pb-8">
                    <button
                      onClick={() => open()}
                      className={`w-full py-3.5 rounded-2xl text-center font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        svc.highlighted
                          ? "bg-white text-primary hover:bg-slate-100"
                          : "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                      }`}
                    >
                      Заказать
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footnote */}
          <p className="text-center text-sm text-slate-400 mt-10">
            Не уверены, какой тариф подходит?{" "}
            <Link href="/contact" className="text-primary font-semibold hover:underline">
              Свяжитесь с нами
            </Link>{" "}
            — проконсультируем бесплатно.
          </p>
        </div>
      </section>

      {/* SEO text block */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
            Разработка буклета АГР в Москве — профессиональное сопровождение
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4 text-sm">
            <p>
              <strong>Архитектурно-градостроительный облик (АГР)</strong> — обязательный документ для согласования фасадных решений, благоустройства, рекламных и информационных конструкций в Москве. Буклет АГР рассматривается на заседании Архитектурной комиссии <strong>Москомархитектуры (МКА)</strong> и является основанием для выдачи <strong>Свидетельства об утверждении АГР</strong>.
            </p>
            <p>
              МосАГРПроект специализируется на разработке проектных материалов по требованиям Москомархитектуры. Мы работаем в соответствии с актуальными регламентами: Приказ №282 от 17.10.2025 (ред. №338) и Постановлением Правительства Москвы №284-ПП. <strong>Смета на разработку буклета</strong> формируется за 1 рабочий день после получения исходных данных об объекте. Организация входит в СРО архитекторов.
            </p>
            <p>
              В наш стандартный пакет «Буклет АГР» входят: разработка всех обязательных разделов, расчёт <strong>ТЭПов</strong> объекта, архитектурная 3D-визуализация фасадов и окружения, фотофиксация, фотомонтаж, а также формирование итогового альбома в PDF. При необходимости готовим НПМ и ВПМ трёхмерные модели для ЦИМ АГР в соответствии с Распоряжением №64-16-429/25/1736 от 22.08.2025.
            </p>
            <p>
              Пакет «Полный» включает не только разработку буклета, но и подачу материалов через портал Мос.ру, взаимодействие с экспертами <strong>МКА</strong> на этапе предварительного и рабочего рассмотрения, а также гарантированное получение <strong>Свидетельства об утверждении АГР</strong>. Работаем по Москве и Московской области.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <PhoneCall className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-display font-bold mb-4">Остались вопросы?</h2>
          <p className="text-white/70 mb-8">
            Расскажите об объекте — рассчитаем стоимость и сроки разработки буклета АГР.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => open()}
              className="inline-block px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Заказать разработку
            </button>
            <Link
              href="/contact"
              className="inline-block px-8 py-3.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
            >
              Написать нам
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
