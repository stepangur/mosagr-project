import { useAdminContacts, useAdminDeleteContact } from "@/hooks/use-admin-contacts";
import { Loader2, Trash2, Mail } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function AdminContacts() {
  const { data: contacts, isLoading } = useAdminContacts();
  const deleteContact = useAdminDeleteContact();

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Дата</th>
              <th className="px-6 py-4 font-semibold">Отправитель</th>
              <th className="px-6 py-4 font-semibold">Сообщение</th>
              <th className="px-6 py-4 font-semibold text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts?.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 align-top">
                  {format(new Date(contact.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                </td>
                <td className="px-6 py-4 align-top min-w-[200px]">
                  <div className="font-semibold text-slate-900">{contact.name}</div>
                  {contact.phone && <div className="text-slate-500 text-xs mt-1">{contact.phone}</div>}
                  <a href={`mailto:${contact.email}`} className="text-accent hover:underline text-xs flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" /> {contact.email}
                  </a>
                </td>
                <td className="px-6 py-4 max-w-lg">
                  <p className="text-slate-700 whitespace-pre-wrap">{contact.message}</p>
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <button
                    onClick={() => {
                      if (confirm("Вы уверены, что хотите удалить это обращение?")) {
                        deleteContact.mutate(contact.id);
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
            {contacts?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Нет обращений</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
