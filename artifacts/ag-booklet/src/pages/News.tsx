import { motion } from "framer-motion";
import { Calendar, ArrowRight, Clock, Loader2, Newspaper, Rss, FileText, Scale } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  tag: string;
  tagColor: string;
  image?: string;
  readTime: string;
  publishedAt?: string;
  createdAt: string;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return format(new Date(iso), "d MMMM yyyy", { locale: ru });
  } catch {
    return "";
  }
}

export default function News() {
  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/public/news"],
    queryFn: async () => {
      const res = await fetch("/api/public/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
  });

  const [featured, ...rest] = news;

  return (
    <>
      <Seo
        title="Новости и статьи об АГР в Москве"
        description="Актуальные новости об изменениях требований Москомархитектуры, практические руководства по разработке буклета АГР и согласованию архитектурно-градостроительного облика в Москве."
        keywords="новости АГР Москва, изменения Москомархитектура, руководство по АГР, статьи об архитектурном облике"
        path="/news"
        breadcrumbs={[{ name: "Новости", path: "/news" }]}
      />
      <Breadcrumb items={[{ name: "Новости и статьи об АГР", path: "/news" }]} />
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-96 h-96 rounded-full bg-cyan-600/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[250px] rounded-full bg-blue-500/10 blur-3xl" />
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/10">
              <Rss className="w-4 h-4" />
              Актуальная информация
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5 leading-tight">
              Новости и статьи
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-12">
              Изменения в законодательстве, практические руководства и актуальные новости по разработке и согласованию буклетов АГР в Москве.
            </p>

            {/* Topic pills */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex gap-3 overflow-x-auto pb-1 justify-start md:justify-center scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
            >
              {[
                { icon: Scale, label: "Законодательство" },
                { icon: FileText, label: "Практические руководства" },
                { icon: Newspaper, label: "Новости Москомархитектуры" },
                { icon: Clock, label: "Сроки и дедлайны" },
              ].map((pill, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.07] border border-white/10 text-sm text-slate-300 backdrop-blur-sm"
                >
                  <pill.icon className="w-3.5 h-3.5 text-blue-400" />
                  {pill.label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Новостей пока нет</p>
            </div>
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-14"
                >
                  <Link href={`/news/${featured.id}`} className="block group">
                    <div className="grid md:grid-cols-2 gap-0 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow duration-300">
                      <div className="relative h-64 md:h-auto bg-gradient-to-br from-primary/10 to-blue-100 overflow-hidden">
                        <img
                          src={featured.image}
                          alt={featured.title}
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <div className="p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${featured.tagColor}`}>
                            {featured.tag}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(featured.publishedAt || featured.createdAt)}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {featured.readTime}
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-3 leading-tight group-hover:text-primary transition-colors">
                          {featured.title}
                        </h2>
                        <p className="text-slate-500 leading-relaxed mb-6">{featured.excerpt}</p>
                        <span className="self-start flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                          Читать полностью <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((item, i) => (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.07 }}
                    >
                      <Link href={`/news/${item.id}`} className="block group h-full">
                        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                          <div className="relative h-44 bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.tagColor}`}>
                                {item.tag}
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">{item.excerpt}</p>
                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(item.publishedAt || item.createdAt)}
                              </span>
                              <span className="flex items-center gap-1 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
                                Читать <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-4">Остались вопросы?</h2>
          <p className="text-white/70 mb-8">
            Проконсультируем по требованиям Москомархитектуры и поможем с разработкой буклета АГР.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Связаться с нами
          </Link>
        </div>
      </section>
    </>
  );
}
