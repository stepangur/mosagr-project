import { useState } from "react";
import { useAdminServices, useAdminDeleteService } from "@/hooks/use-admin-services";
import { Loader2, Plus, Edit2, Trash2, Star, Download, CheckCircle2, Link2, Copy, Check } from "lucide-react";
import { Link } from "wouter";

const FEED_URL = "https://razrabotka-agr.ru/api/public/feed.yml";

export default function AdminServices() {
  const { data: services, isLoading } = useAdminServices();
  const deleteService = useAdminDeleteService();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FEED_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportYml = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/services/export/yml", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `services-${new Date().toISOString().slice(0, 10)}.yml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch {
      alert("Ошибка при выгрузке YML");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportYml}
            disabled={exporting}
            className={`px-5 py-2.5 font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
              exported
                ? "bg-green-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exported ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exported ? "Файл скачан!" : "Выгрузить YML"}
          </button>
          <span className="text-xs text-slate-400">для Яндекс Бизнес / Карты</span>
        </div>
        <Link
          href="/admin/services/new"
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Добавить услугу
        </Link>
      </div>

      {/* Public YML feed URL */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Link2 className="w-4 h-4 text-blue-500 shrink-0 hidden sm:block" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 sm:hidden" />
            Публичная ссылка на YML-фид (для Яндекс Бизнес)
          </p>
          <p className="text-xs text-blue-500 break-all font-mono">{FEED_URL}</p>
          <p className="text-xs text-blue-400 mt-1">Обновляется автоматически при изменении услуг</p>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            copied ? "bg-green-500 text-white" : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Скопировано!" : "Копировать"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Услуга</th>
              <th className="px-6 py-4 font-semibold">Цена</th>
              <th className="px-6 py-4 font-semibold">Порядок</th>
              <th className="px-6 py-4 font-semibold">Статус</th>
              <th className="px-6 py-4 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services?.map((svc) => (
              <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{svc.title}</span>
                    {svc.highlighted && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                    {svc.badge && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                        {svc.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{svc.description}</div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">{svc.price}</td>
                <td className="px-6 py-4 text-slate-500">{svc.sortOrder}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${svc.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {svc.active ? "Активна" : "Скрыта"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/services/${svc.id}/edit`}
                      className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Удалить эту услугу навсегда?")) deleteService.mutate(svc.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Нет услуг. Нажмите «Добавить услугу».</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
