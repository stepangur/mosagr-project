import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Box, Building, Layers, Loader2, ScrollText, Puzzle, Eye } from "lucide-react";
import { Link } from "wouter";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { useOrderModal } from "@/contexts/OrderModalContext";

const IfcViewer = lazy(() => import("@/components/IfcViewer"));

const categories = [
  { id: "all", label: "Все" },
  { id: "docs", label: "Регламенты и инструкции" },
  { id: "template", label: "Шаблоны презентаций" },
  { id: "booklet", label: "Буклеты АГР" },
  { id: "model", label: "3D-модели" },
  { id: "plugin", label: "Плагины" },
];

interface TemplateItem {
  id: number;
  title: string;
  category: string;
  type: string;
  tag: string;
  tagColor: string;
  description: string;
  free: boolean;
  image?: string;
  fileUrl?: string;
  fileName?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  booklet: Building,
  model: Box,
  template: Layers,
  docs: ScrollText,
  plugin: Puzzle,
};

export default function Templates() {
  const { open } = useOrderModal();
  const [activeCategory, setActiveCategory] = useState("all");
  const [ifcViewer, setIfcViewer] = useState<{ url: string; title: string } | null>(null);

  const { data: items = [], isLoading } = useQuery<TemplateItem[]>({
    queryKey: ["/api/public/templates"],
    queryFn: async () => {
      const res = await fetch("/api/public/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const filtered = activeCategory === "all"
    ? items
    : items.filter((i) => i.category === activeCategory);

  return (
    <>
      <Seo
        title="Образцы и шаблоны буклета АГР для Москомархитектуры"
        description="Скачайте готовые образцы и шаблоны буклета АГР по требованиям Москомархитектуры. Примеры буклетов жилых, коммерческих и общественных зданий."
        keywords="шаблон буклета АГР, образец буклета АГО, пример АГР Москомархитектура, скачать буклет АГР"
        path="/templates"
        breadcrumbs={[{ name: "Шаблоны", path: "/templates" }]}
      />
      <Breadcrumb items={[{ name: "Шаблоны и образцы АГР", path: "/templates" }]} />
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-violet-500/10 blur-3xl" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-violet-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/10">
              <Layers className="w-4 h-4" />
              Библиотека материалов
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5 leading-tight">
              Шаблоны и примеры
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-12">
              Официальные шаблоны Москомархитектуры, нормативные документы, плагины для Blender и образцы буклетов АГР — всё в одном месте.
            </p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex flex-wrap justify-center gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              {[
                { icon: FileText, value: "6", label: "шаблонов PPTX" },
                { icon: ScrollText, value: "2", label: "норм. документа" },
                { icon: Box, value: "3D", label: "модели НПМ/ВПМ" },
                { icon: Puzzle, value: "1", label: "плагин Blender" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4 bg-white/[0.04] hover:bg-white/10 transition-colors">
                  <stat.icon className="w-4 h-4 text-violet-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-lg font-display font-bold text-white leading-none">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-5 py-2 rounded-full border text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-white border-primary"
                  : "hover:bg-primary hover:text-white hover:border-primary border-slate-200 text-slate-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Шаблоны не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((item, i) => {
                const Icon = categoryIcons[item.category] ?? FileText;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    {/* Image / Preview */}
                    <div className="relative h-48 bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100/60">
                        <Icon className="w-16 h-16 text-primary/30" />
                      </div>
                      {item.free && (
                        <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Бесплатно
                        </span>
                      )}
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${item.tagColor || "bg-slate-100 text-slate-600"}`}>
                        {item.tag}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.type}</span>
                      </div>
                      <h3 className="font-display font-semibold text-slate-900 text-base mb-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed flex-1 break-words line-clamp-3">
                        {item.description}
                      </p>

                      <div className="flex gap-2 mt-5">
                        {item.fileUrl?.toLowerCase().endsWith(".ifc") && (
                          <button
                            onClick={() => setIfcViewer({ url: item.fileUrl!, title: item.title })}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-violet-50 text-violet-700 border border-violet-200 text-sm font-medium rounded-xl hover:bg-violet-100 transition-colors shrink-0"
                            title="Онлайн-просмотр 3D"
                          >
                            <Eye className="w-4 h-4" />
                            3D
                          </button>
                        )}
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            download={item.fileName || true}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            {item.free ? "Скачать" : "Получить"}
                          </a>
                        ) : (
                          <button
                            onClick={() => open()}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            {item.free ? "Запросить" : "Получить"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-4">Нужен индивидуальный буклет?</h2>
          <p className="text-white/70 mb-8">
            Разработаем буклет АГР для вашего объекта «под ключ» — от эскиза до согласования в Москомархитектуре.
          </p>
          <button
            onClick={() => open()}
            className="inline-block px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Заказать разработку
          </button>
        </div>
      </section>

      {/* IFC 3D Viewer Modal */}
      {ifcViewer && (
        <Suspense fallback={null}>
          <IfcViewer
            fileUrl={ifcViewer.url}
            title={ifcViewer.title}
            onClose={() => setIfcViewer(null)}
          />
        </Suspense>
      )}
    </>
  );
}
