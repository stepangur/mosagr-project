import { useAdminOrders } from "@/hooks/use-admin-orders";
import { useAdminContacts } from "@/hooks/use-admin-contacts";
import { useAdminNews } from "@/hooks/use-admin-news";
import { useAdminTemplates } from "@/hooks/use-admin-templates";
import { Loader2, ShoppingCart, Users, Newspaper, FileCode2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "wouter";

const SERVICE_LABELS: Record<string, string> = {
  booklet_ag:   "Буклет АГР",
  consultation: "Консультация",
  full_package: "Полный пакет",
};
const STATUS_LABELS: Record<string, string> = {
  pending:     "Новая",
  in_progress: "В работе",
  completed:   "Завершена",
  cancelled:   "Отменена",
};
const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed:   "bg-emerald-100 text-emerald-800",
  cancelled:   "bg-rose-100 text-rose-800",
};

export default function AdminDashboard() {
  const { data: orders, isLoading: loadingOrders } = useAdminOrders();
  const { data: contacts, isLoading: loadingContacts } = useAdminContacts();
  const { data: news, isLoading: loadingNews } = useAdminNews();
  const { data: templates, isLoading: loadingTemplates } = useAdminTemplates();

  const isLoading = loadingOrders || loadingContacts || loadingNews || loadingTemplates;

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;

  const stats = [
    { label: "Всего заявок", value: orders?.length || 0, sub: `${pendingOrders} новых`, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Обращения", value: contacts?.length || 0, sub: "За все время", icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Статьи", value: news?.length || 0, sub: "Опубликовано", icon: Newspaper, color: "text-violet-600", bg: "bg-violet-100" },
    { label: "Шаблоны", value: templates?.length || 0, sub: "В базе", icon: FileCode2, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/admin/news/new" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
          + Добавить статью
        </Link>
        <Link href="/admin/templates/new" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
          + Добавить шаблон
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{s.label}</p>
                <h3 className="text-3xl font-display font-bold text-slate-900">{s.value}</h3>
                <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-800">Последние заявки</h3>
            <Link href="/admin/clients" className="text-sm font-semibold text-accent hover:text-accent/80 flex items-center gap-1">
              Все <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {orders?.slice(-5).reverse().map(order => (
              <div key={order.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-800">{order.name}</p>
                  <p className="text-xs text-slate-500">{SERVICE_LABELS[order.serviceType] ?? order.serviceType}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-800"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    {format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: ru })}
                  </p>
                </div>
              </div>
            ))}
            {orders?.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Нет заявок</div>}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-800">Новые обращения</h3>
            <Link href="/admin/clients" className="text-sm font-semibold text-accent hover:text-accent/80 flex items-center gap-1">
              Все <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {contacts?.slice(-5).reverse().map(contact => (
              <div key={contact.id} className="p-4 px-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-800">{contact.name}</p>
                  <span className="text-xs text-slate-400">
                    {format(new Date(contact.createdAt), "dd MMM", { locale: ru })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{contact.message}</p>
              </div>
            ))}
            {contacts?.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Нет обращений</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
