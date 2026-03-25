import { useAdminTemplates, useAdminDeleteTemplate } from "@/hooks/use-admin-templates";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "wouter";

export default function AdminTemplates() {
  const { data: templates, isLoading } = useAdminTemplates();
  const deleteTemplate = useAdminDeleteTemplate();

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <Link href="/admin/templates/new" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить шаблон
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Название</th>
              <th className="px-6 py-4 font-semibold">Категория</th>
              <th className="px-6 py-4 font-semibold">Доступ</th>
              <th className="px-6 py-4 font-semibold">Формат</th>
              <th className="px-6 py-4 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates?.map((tpl) => (
              <tr key={tpl.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{tpl.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{format(new Date(tpl.createdAt), "dd.MM.yyyy")}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tpl.tagColor || 'bg-slate-100 text-slate-700'}`}>
                    {tpl.tag}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${tpl.free ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {tpl.free ? "Бесплатно" : "Платно"}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-600">
                  {tpl.type}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/templates/${tpl.id}/edit`} className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Удалить этот шаблон навсегда?")) deleteTemplate.mutate(tpl.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {templates?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Нет шаблонов</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
