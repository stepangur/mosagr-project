import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";
import { useOrderModal } from "@/contexts/OrderModalContext";

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
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

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function renderTables(content: string): React.ReactNode {
  const tableRegex = /(\|.+\|\n)+/g;
  const tables: React.ReactNode[] = [];
  let match;
  let tableIndex = 0;
  while ((match = tableRegex.exec(content)) !== null) {
    const rows = match[0].trim().split("\n");
    const headers = rows[0].split("|").filter((c) => c.trim());
    const bodyRows = rows.slice(2).map((r) => r.split("|").filter((c) => c.trim()));
    tables.push(
      <div key={tableIndex++} className="overflow-x-auto my-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 text-left border border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 border border-slate-200 text-slate-600">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return tables;
}

export default function NewsArticle() {
  const { open } = useOrderModal();
  const { id } = useParams<{ id: string }>();

  const { data: allNews = [], isLoading: listLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/public/news"],
    queryFn: async () => {
      const res = await fetch("/api/public/news");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: article, isLoading: articleLoading } = useQuery<NewsItem>({
    queryKey: ["/api/public/news", id],
    queryFn: async () => {
      const res = await fetch(`/api/public/news/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  const isLoading = listLoading || articleLoading;

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Статья не найдена</h1>
            <Link href="/news" className="text-primary underline">← Вернуться к новостям</Link>
          </div>
        </div>
      </>
    );
  }

  const currentIndex = allNews.findIndex((n) => n.id === article.id);
  const prev = allNews[currentIndex - 1];
  const next = allNews[currentIndex + 1];

  const paragraphs = article.content.trim().split("\n");

  return (
    <>
      <Seo
        title={article.title}
        description={article.excerpt}
        keywords={`${article.tag}, буклет АГР, Москомархитектура, архитектурно-градостроительный облик`}
        path={`/news/${article.id}`}
        ogImage={article.image || "/opengraph.jpg"}
        ogType="article"
        publishedTime={article.publishedAt || article.createdAt}
        breadcrumbs={[{ name: "Новости", path: "/news" }, { name: article.title, path: `/news/${article.id}` }]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": article.title,
          "description": article.excerpt,
          "image": article.image || "/opengraph.jpg",
          "datePublished": article.publishedAt || article.createdAt,
          "author": {
            "@type": "Organization",
            "name": "МосАГРПроект",
            "url": "https://razrabotka-agr.ru"
          },
          "publisher": {
            "@type": "Organization",
            "name": "МосАГРПроект",
            "logo": { "@type": "ImageObject", "url": "https://razrabotka-agr.ru/favicon.svg" }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://razrabotka-agr.ru/news/${article.id}`
          }
        }}
      />
      <Breadcrumb items={[
        { name: "Новости", path: "/news" },
        { name: article.title, path: `/news/${article.id}` },
      ]} />
      {/* Hero */}
      <section className="pt-32 pb-0 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link href="/news" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-6 hover:gap-2.5 transition-all">
              <ArrowLeft className="w-4 h-4" /> Все новости
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${article.tagColor}`}>
                {article.tag}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(article.publishedAt || article.createdAt)}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 leading-tight mb-6">
              {article.title}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed border-l-4 border-primary pl-4 mb-8">
              {article.excerpt}
            </p>
          </motion.div>
        </div>

        {/* Cover image */}
        {article.image && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-64 md:h-80 rounded-t-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-blue-100">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover opacity-85"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Article body */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose prose-slate prose-lg max-w-none
              prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-slate-600
              prose-li:text-slate-600
              prose-strong:text-slate-800
              prose-a:text-primary
              prose-table:text-sm
              prose-th:bg-slate-50 prose-th:font-semibold prose-th:text-slate-700
              prose-td:text-slate-600
              prose-blockquote:border-primary prose-blockquote:text-slate-500
              prose-hr:border-slate-200
            "
          >
            {paragraphs.map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i}>{line.replace("## ", "")}</h2>;
              if (line.startsWith("### ")) return <h3 key={i}>{line.replace("### ", "")}</h3>;
              if (line.startsWith("---")) return <hr key={i} />;
              if (line.startsWith("| ")) return null;
              if (line.startsWith("- ")) return <li key={i}>{parseBold(line.replace("- ", ""))}</li>;
              if (/^\d+\. /.test(line)) return <li key={i}>{parseBold(line.replace(/^\d+\. /, ""))}</li>;
              if (line.trim() === "") return <br key={i} />;
              return <p key={i}>{parseBold(line)}</p>;
            })}
            {article.content.includes("| ") && renderTables(article.content)}
          </motion.div>

          {/* Navigation between articles */}
          <div className="mt-16 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
            {prev ? (
              <Link
                href={`/news/${prev.id}`}
                className="group flex flex-col gap-1 p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Предыдущая
                </span>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors line-clamp-2">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/news/${next.id}`}
                className="group flex flex-col gap-1 p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:shadow-sm transition-all text-right ml-auto w-full"
              >
                <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                  Следующая <ArrowRight className="w-3 h-3" />
                </span>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors line-clamp-2">
                  {next.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-4">Нужна помощь с буклетом АГР?</h2>
          <p className="text-white/70 mb-8">
            Наши специалисты разработают документацию и сопроводят до получения согласования.
          </p>
          <button
            onClick={() => open()}
            className="inline-block px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Заказать разработку
          </button>
        </div>
      </section>
    </>
  );
}
