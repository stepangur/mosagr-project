import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { adminFetch } from "@/lib/admin-fetch";
import { ProposalModal } from "@/components/admin/ProposalModal";
import { FileText, Send, Download, Building2, User, Tag, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useState } from "react";

interface ProposalService {
  name: string;
  description?: string;
  price: string;
}

interface ProposalRecord {
  id: number;
  orderId: number | null;
  clientName: string;
  clientEmail: string;
  companyName: string | null;
  inn: string | null;
  kpp: string | null;
  services: string;
  totalPrice: string;
  discountAmount: string | null;
  deadline: string;
  validDays: number;
  managerName: string | null;
  managerPhone: string | null;
  notes: string | null;
  action: string;
  createdAt: string;
}

function parseServices(raw: string): ProposalService[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function useProposals() {
  return useQuery<ProposalRecord[]>({
    queryKey: ["admin-proposals"],
    queryFn: () => adminFetch<ProposalRecord[]>("/admin/proposals"),
    staleTime: 30_000,
  });
}

function ServicesPopover({ services }: { services: string }) {
  const [open, setOpen] = useState(false);
  const parsed = parseServices(services);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
      >
        {parsed.length} {parsed.length === 1 ? "услуга" : parsed.length < 5 ? "услуги" : "услуг"}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-6 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
          {parsed.map((s, i) => (
            <div key={i} className="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{s.price}</span>
              </div>
              {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalRow({
  p,
  onRepeat,
}: {
  p: ProposalRecord;
  onRepeat: (p: ProposalRecord) => void;
}) {
  const isSent = p.action === "sent";

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-xs align-top">
        {format(new Date(p.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
      </td>
      <td className="px-5 py-4 align-top">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
          isSent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
        }`}>
          {isSent ? <Send className="w-2.5 h-2.5" /> : <Download className="w-2.5 h-2.5" />}
          {isSent ? "Отправлено" : "Скачано"}
        </span>
      </td>
      <td className="px-5 py-4 align-top min-w-[200px]">
        <div className="flex items-start gap-2">
          <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900 text-sm">{p.clientName}</div>
            <div className="text-xs text-slate-500">{p.clientEmail}</div>
          </div>
        </div>
        {p.companyName && (
          <div className="flex items-start gap-2 mt-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-medium text-slate-700">{p.companyName}</div>
              {(p.inn || p.kpp) && (
                <div className="text-xs text-slate-400">
                  {[p.inn && `ИНН: ${p.inn}`, p.kpp && `КПП: ${p.kpp}`].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>
        )}
      </td>
      <td className="px-5 py-4 align-top">
        <ServicesPopover services={p.services} />
      </td>
      <td className="px-5 py-4 align-top">
        <div className="font-bold text-slate-900 text-sm">{p.totalPrice}</div>
        {p.discountAmount && (
          <div className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
            <Tag className="w-3 h-3" /> −{p.discountAmount}
          </div>
        )}
      </td>
      <td className="px-5 py-4 align-top text-sm text-slate-600">
        {p.deadline}
      </td>
      <td className="px-5 py-4 align-top text-sm text-slate-600">
        {p.managerName || <span className="text-slate-400">—</span>}
      </td>
      <td className="px-5 py-4 align-top text-right">
        <button
          onClick={() => onRepeat(p)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors"
          title="Создать КП на основе этого"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Создать КП
        </button>
      </td>
    </tr>
  );
}

export default function AdminProposals() {
  const { data: proposals, isLoading } = useProposals();
  const [repeatProposal, setRepeatProposal] = useState<ProposalRecord | null>(null);

  const sentCount = proposals?.filter(p => p.action === "sent").length ?? 0;
  const downloadedCount = proposals?.filter(p => p.action === "downloaded").length ?? 0;

  function handleRepeat(p: ProposalRecord) {
    setRepeatProposal(p);
  }

  function buildPrefill(p: ProposalRecord) {
    return {
      clientName: p.clientName,
      clientEmail: p.clientEmail,
      companyName: p.companyName ?? undefined,
      inn: p.inn ?? undefined,
      kpp: p.kpp ?? undefined,
      services: parseServices(p.services).map(s => ({ ...s, description: s.description ?? "" })),
      totalPrice: p.totalPrice,
      discountAmount: p.discountAmount ?? undefined,
      deadline: p.deadline,
      validDays: p.validDays,
      managerName: p.managerName ?? undefined,
      managerPhone: p.managerPhone ?? undefined,
      notes: p.notes ?? undefined,
      orderId: p.orderId ?? undefined,
    };
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-slate-900">{proposals?.length ?? 0}</div>
            <div className="text-sm text-slate-500 mt-1">Всего КП</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-emerald-600">{sentCount}</div>
            <div className="text-sm text-slate-500 mt-1">Отправлено по email</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-slate-600">{downloadedCount}</div>
            <div className="text-sm text-slate-500 mt-1">Скачано PDF</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 font-semibold whitespace-nowrap">Дата</th>
                    <th className="px-5 py-4 font-semibold">Действие</th>
                    <th className="px-5 py-4 font-semibold">Получатель</th>
                    <th className="px-5 py-4 font-semibold">Услуги</th>
                    <th className="px-5 py-4 font-semibold">Стоимость</th>
                    <th className="px-5 py-4 font-semibold">Срок</th>
                    <th className="px-5 py-4 font-semibold">Менеджер</th>
                    <th className="px-5 py-4 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {proposals?.map(p => (
                    <ProposalRow key={p.id} p={p} onRepeat={handleRepeat} />
                  ))}
                  {proposals?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">История КП пуста</p>
                        <p className="text-slate-400 text-xs mt-1">Отправьте или скачайте первое КП — оно появится здесь</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {repeatProposal && (
        <ProposalModal
          clientName={repeatProposal.clientName}
          clientEmail={repeatProposal.clientEmail}
          prefill={buildPrefill(repeatProposal)}
          onClose={() => setRepeatProposal(null)}
        />
      )}
    </>
  );
}
