import { useAdminNews, useAdminDeleteNews, useAdminUpdateNews } from "@/hooks/use-admin-news";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "wouter";

export default function AdminNews() {
  const { data: news, isLoading } = useAdminNews();
  const deleteNews = useAdminDeleteNews();
  const updateNews = useAdminUpdateNews();

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <Link href="/admin/news/new" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Создать статью
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Дата</th>
              <th className="px-6 py-4 font-semibold">Заголовок</th>
              <th className="px-6 py-4 font-semibold">Тег</th>
              <th className="px-6 py-4 font-semibold">Статус</th>
              <th className="px-6 py-4 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {news?.map((article) => (
              <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                  {format(new Date(article.createdAt), "dd.MM.yyyy", { locale: ru })}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 max-w-md truncate" title={article.title}>{article.title}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${article.tagColor || 'bg-slate-100 text-slate-700'}`}>
                    {article.tag}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => updateNews.mutate({ id: article.id, data: { ...article, published: !article.published } })}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      article.published 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {article.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {article.published ? "Опубликовано" : "Черновик"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/news/${article.id}/edit`} className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Удалить эту статью навсегда?")) deleteNews.mutate(article.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {news?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Нет статей</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
