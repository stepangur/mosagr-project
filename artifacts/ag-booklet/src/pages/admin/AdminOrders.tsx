import { useAdminOrders, useAdminUpdateOrder, useAdminDeleteOrder } from "@/hooks/use-admin-orders";
import { Loader2, Trash2, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const STATUS_OPTIONS = [
  { value: "pending", label: "Новая", color: "bg-yellow-100 text-yellow-800" },
  { value: "in_progress", label: "В работе", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Завершена", color: "bg-emerald-100 text-emerald-800" },
  { value: "cancelled", label: "Отменена", color: "bg-rose-100 text-rose-800" },
];

const SERVICE_LABELS: Record<string, string> = {
  booklet_ag:   "Буклет АГР",
  consultation: "Консультация",
  full_package: "Полный пакет",
};

function serviceLabel(raw: string): string {
  return SERVICE_LABELS[raw] ?? raw;
}

export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminOrders();
  const updateOrder = useAdminUpdateOrder();
  const deleteOrder = useAdminDeleteOrder();

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Дата</th>
              <th className="px-6 py-4 font-semibold">Клиент</th>
              <th className="px-6 py-4 font-semibold">Услуга / Объект</th>
              <th className="px-6 py-4 font-semibold">Статус</th>
              <th className="px-6 py-4 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                  {format(new Date(order.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{order.name}</div>
                  <div className="text-slate-500 text-xs mt-1">{order.phone}</div>
                  <div className="text-slate-500 text-xs">{order.email}</div>
                  {order.companyName && (
                    <div className="flex items-start gap-1 mt-1.5">
                      <Building2 className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-blue-600 font-medium">{order.companyName}</span>
                        {order.inn && <span className="text-xs text-slate-400 ml-1">ИНН {order.inn}</span>}
                        {order.companyDirector && <div className="text-xs text-slate-400">{order.companyDirector}</div>}
                        {order.companyPhone && <div className="text-xs text-slate-400">{order.companyPhone}</div>}
                        {order.companyEmail && <div className="text-xs text-slate-400">{order.companyEmail}</div>}
                        {order.companyWebsite && (
                          <a
                            href={order.companyWebsite.startsWith("http") ? order.companyWebsite : `https://${order.companyWebsite}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline block"
                          >
                            {order.companyWebsite}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="font-medium text-slate-800">{serviceLabel(order.serviceType)}</div>
                  <div className="text-slate-500 text-xs mt-1 truncate" title={order.address}>{order.address}</div>
                  {order.notes && <div className="text-slate-400 text-xs mt-1 italic truncate">"{order.notes}"</div>}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder.mutate({ id: order.id, status: e.target.value })}
                    disabled={updateOrder.isPending}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all ${
                      STATUS_OPTIONS.find(o => o.value === order.status)?.color || "bg-slate-100"
                    }`}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      if (confirm("Вы уверены, что хотите удалить эту заявку?")) {
                        deleteOrder.mutate(order.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {orders?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Нет заявок</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
