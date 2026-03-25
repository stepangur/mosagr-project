import { useState, useRef, useEffect, useCallback } from "react";
import { useAdminOrders, useAdminUpdateOrder, useAdminDeleteOrder, useOrderProposals, useOrderContracts, downloadDoc, type AdminOrder } from "@/hooks/use-admin-orders";
import { useAdminContacts, useAdminDeleteContact } from "@/hooks/use-admin-contacts";
import { Loader2, Trash2, Mail, MessageCircle, Phone, Send, FileText, Building2, PlusCircle, Pencil, X, Check, ScrollText, Download, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ProposalModal } from "@/components/admin/ProposalModal";
import { ContractModal } from "@/components/admin/ContractModal";

const STATUS_OPTIONS = [
  { value: "pending",     label: "Новая",      color: "bg-yellow-100 text-yellow-800" },
  { value: "in_progress", label: "В работе",   color: "bg-blue-100 text-blue-800" },
  { value: "signed",      label: "Заключено",  color: "bg-violet-100 text-violet-800" },
  { value: "completed",   label: "Исполнено",  color: "bg-emerald-100 text-emerald-800" },
  { value: "cancelled",   label: "Отменена",   color: "bg-rose-100 text-rose-800" },
];

const SERVICE_LABELS: Record<string, string> = {
  booklet_ag:   "Буклет АГР",
  consultation: "Консультация",
  full_package: "Полный пакет",
};

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function ContactButtons({ email, phone }: { email?: string; phone?: string }) {
  const digits = phone ? phoneDigits(phone) : "";
  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
      {email && (
        <a
          href={`mailto:${email}`}
          title={`Написать на ${email}`}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Mail className="w-3 h-3" /> E-mail
        </a>
      )}
      {digits && (
        <a
          href={`https://wa.me/${digits}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Написать в WhatsApp"
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="w-3 h-3" /> WhatsApp
        </a>
      )}
      {digits && (
        <a
          href={`https://t.me/+${digits}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Написать в Telegram"
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
        >
          <Send className="w-3 h-3" /> Telegram
        </a>
      )}
      {phone && (
        <a
          href={`tel:${digits}`}
          title="Позвонить"
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <Phone className="w-3 h-3" /> Позвонить
        </a>
      )}
    </div>
  );
}

interface DadataSuggestion {
  value: string;
  data: {
    inn: string;
    kpp?: string;
    ogrn?: string;
    name: { short_with_opf: string; full_with_opf: string };
    address?: { value: string };
    management?: { name: string };
    phones?: Array<{ value: string }>;
    emails?: Array<{ value: string }>;
    site?: string;
  };
}

interface CompanyData {
  inn: string;
  companyName: string;
  companyFullName: string;
  companyKpp: string;
  companyOgrn: string;
  companyLegalAddress: string;
  companyDirector: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyBankAccount: string;
  companyBankName: string;
  companyBik: string;
  companyCorrAccount: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function InnSearchPanel({
  orderId,
  existing,
  onSave,
  onClose,
  isSaving,
}: {
  orderId: number;
  existing: CompanyData | null;
  onSave: (company: CompanyData) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const emptyCompany: CompanyData = {
    inn: "", companyName: "", companyFullName: "", companyKpp: "",
    companyOgrn: "", companyLegalAddress: "", companyDirector: "",
    companyPhone: "", companyEmail: "", companyWebsite: "",
    companyBankAccount: "", companyBankName: "", companyBik: "", companyCorrAccount: "",
  };
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DadataSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "edit">(existing ? "edit" : "search");
  const [draft, setDraft] = useState<CompanyData>(existing ?? emptyCompany);
  const debouncedQuery = useDebounce(query, 350);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function setField(field: keyof CompanyData, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setIsOpen(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/dadata/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, count: 7 }),
      });
      if (!res.ok) return;
      const data = await res.json() as { suggestions: DadataSuggestion[] };
      setSuggestions(data.suggestions ?? []);
      setIsOpen((data.suggestions ?? []).length > 0);
    } catch { setSuggestions([]); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchSuggestions(debouncedQuery); }, [debouncedQuery, fetchSuggestions]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(s: DadataSuggestion) {
    const company: CompanyData = {
      inn: s.data.inn,
      companyName: s.data.name.short_with_opf,
      companyFullName: s.data.name.full_with_opf,
      companyKpp: s.data.kpp ?? "",
      companyOgrn: s.data.ogrn ?? "",
      companyLegalAddress: s.data.address?.value ?? "",
      companyDirector: s.data.management?.name ?? "",
      companyPhone: s.data.phones?.[0]?.value ?? "",
      companyEmail: s.data.emails?.[0]?.value ?? "",
      companyWebsite: s.data.site ?? "",
      companyBankAccount: draft.companyBankAccount ?? "",
      companyBankName: draft.companyBankName ?? "",
      companyBik: draft.companyBik ?? "",
      companyCorrAccount: draft.companyCorrAccount ?? "",
    };
    setDraft(company);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setMode("edit");
  }

  const inputCls = "w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-300";

  return (
    <div className="p-4 bg-blue-50/60 border-t border-blue-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> Юридическое лицо
        </p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {mode === "search" ? (
        <div className="space-y-2">
          <div ref={wrapperRef} className="relative">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                placeholder="Введите ИНН или название компании..."
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-300 pr-8"
                autoComplete="off"
                autoFocus
              />
              {isLoading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
            </div>
            {isOpen && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.data.inn}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div className="font-medium text-sm text-slate-800">{s.data.name.short_with_opf}</div>
                    <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                      <span>ИНН {s.data.inn}</span>
                      {s.data.address?.value && <span className="truncate max-w-xs">{s.data.address.value}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setDraft(emptyCompany); setMode("edit"); }}
            className="text-xs text-slate-500 hover:text-blue-600 underline"
          >
            Ввести вручную
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-white rounded-lg border border-blue-200 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">ИНН</label>
                <input value={draft.inn} onChange={(e) => setField("inn", e.target.value)} className={inputCls} placeholder="ИНН" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">КПП</label>
                <input value={draft.companyKpp} onChange={(e) => setField("companyKpp", e.target.value)} className={inputCls} placeholder="КПП" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-0.5 block">Краткое наименование</label>
              <input value={draft.companyName} onChange={(e) => setField("companyName", e.target.value)} className={inputCls} placeholder='ООО "Название"' />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-0.5 block">Полное наименование</label>
              <input value={draft.companyFullName} onChange={(e) => setField("companyFullName", e.target.value)} className={inputCls} placeholder="Полное юридическое наименование" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">ОГРН</label>
                <input value={draft.companyOgrn} onChange={(e) => setField("companyOgrn", e.target.value)} className={inputCls} placeholder="ОГРН" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">Руководитель</label>
                <input value={draft.companyDirector} onChange={(e) => setField("companyDirector", e.target.value)} className={inputCls} placeholder="ФИО" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-0.5 block">Юридический адрес</label>
              <input value={draft.companyLegalAddress} onChange={(e) => setField("companyLegalAddress", e.target.value)} className={inputCls} placeholder="Юридический адрес" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">Телефон</label>
                <input value={draft.companyPhone} onChange={(e) => setField("companyPhone", e.target.value)} className={inputCls} placeholder="+7..." />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-0.5 block">Email</label>
                <input value={draft.companyEmail} onChange={(e) => setField("companyEmail", e.target.value)} className={inputCls} placeholder="email@company.ru" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-0.5 block">Сайт</label>
              <input value={draft.companyWebsite} onChange={(e) => setField("companyWebsite", e.target.value)} className={inputCls} placeholder="company.ru" />
            </div>
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Банковские реквизиты</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-400 mb-0.5 block">Расчётный счёт</label>
                  <input value={draft.companyBankAccount} onChange={(e) => setField("companyBankAccount", e.target.value)} className={inputCls} placeholder="40702810000000000000" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 mb-0.5 block">Банк</label>
                    <input value={draft.companyBankName} onChange={(e) => setField("companyBankName", e.target.value)} className={inputCls} placeholder='АО «Сбербанк»' />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-0.5 block">БИК</label>
                    <input value={draft.companyBik} onChange={(e) => setField("companyBik", e.target.value)} className={inputCls} placeholder="044525225" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-0.5 block">Корр. счёт</label>
                  <input value={draft.companyCorrAccount} onChange={(e) => setField("companyCorrAccount", e.target.value)} className={inputCls} placeholder="30101810400000000225" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(draft)}
              disabled={isSaving || !draft.inn}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => { setQuery(""); setMode("search"); }}
              className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Найти по ИНН
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDocumentsRow({ orderId }: { orderId: number }) {
  const { data: proposals, isLoading: pLoading } = useOrderProposals(orderId);
  const { data: contracts, isLoading: cLoading } = useOrderContracts(orderId);

  const isLoading = pLoading || cLoading;
  const hasProposals = (proposals?.length ?? 0) > 0;
  const hasContracts = (contracts?.length ?? 0) > 0;
  const isEmpty = !isLoading && !hasProposals && !hasContracts;

  return (
    <tr>
      <td colSpan={5} className="p-0">
        <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100">
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Загрузка документов...
            </div>
          ) : isEmpty ? (
            <p className="text-xs text-slate-400 py-1">Нет созданных КП и договоров для этой заявки</p>
          ) : (
            <div className="space-y-3">
              {hasProposals && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Коммерческие предложения</p>
                  <div className="space-y-1">
                    {proposals!.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-4 bg-white border border-slate-100 rounded-lg px-3 py-2">
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-slate-700">
                            КП от {format(new Date(p.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                          </span>
                          <span className="ml-2 text-xs text-slate-400">
                            {p.totalPrice}
                            {p.companyName && ` · ${p.companyName}`}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadDoc("proposals", p.id, `КП_${p.clientName.replace(/\s+/g, "_")}.pdf`)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Скачать PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hasContracts && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Договоры</p>
                  <div className="space-y-2">
                    {/* Group by contractNumber */}
                    {Object.entries(
                      contracts!.reduce<Record<string, typeof contracts>>((acc, c) => {
                        (acc[c.contractNumber] ??= []).push(c);
                        return acc;
                      }, {})
                    ).map(([contractNumber, versions]) => {
                      const sorted = [...versions!].sort((a, b) => (b.version ?? 1) - (a.version ?? 1));
                      const latest = sorted[0];
                      const hasMultiple = sorted.length > 1;
                      return (
                        <div key={contractNumber} className="border border-slate-100 rounded-lg overflow-hidden">
                          {/* Header row — latest version */}
                          <div className="flex items-center justify-between gap-4 bg-white px-3 py-2">
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-slate-700">
                                № {latest.contractNumber}
                              </span>
                              <span className="ml-2 text-xs font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                v{latest.version ?? 1}
                              </span>
                              <span className="ml-2 text-xs text-slate-400">
                                от {latest.contractDate}
                                {latest.amount && ` · ${latest.amount} ₽`}
                                {latest.companyName && ` · ${latest.companyName}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => downloadDoc("contracts", latest.id, `Договор_${latest.contractNumber}_v${latest.version ?? 1}.docx`, "docx")}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Word
                              </button>
                              <button
                                onClick={() => downloadDoc("contracts", latest.id, `Договор_${latest.contractNumber}_v${latest.version ?? 1}.pdf`, "pdf")}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                PDF
                              </button>
                            </div>
                          </div>
                          {/* Older versions */}
                          {hasMultiple && sorted.slice(1).map((c) => (
                            <div key={c.id} className="flex items-center justify-between gap-4 bg-slate-50 border-t border-slate-100 px-3 py-1.5">
                              <div className="min-w-0">
                                <span className="text-xs text-slate-400 font-medium">
                                  v{c.version ?? 1}
                                </span>
                                <span className="ml-2 text-xs text-slate-400">
                                  от {c.contractDate}
                                  {c.amount && ` · ${c.amount} ₽`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => downloadDoc("contracts", c.id, `Договор_${c.contractNumber}_v${c.version ?? 1}.docx`, "docx")}
                                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  Word
                                </button>
                                <button
                                  onClick={() => downloadDoc("contracts", c.id, `Договор_${c.contractNumber}_v${c.version ?? 1}.pdf`, "pdf")}
                                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  PDF
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function OrderRow({
  order,
  onProposal,
  onContract,
}: {
  order: AdminOrder;
  onProposal: (name: string, email: string, companyName?: string, inn?: string, kpp?: string, orderId?: number) => void;
  onContract: (order: AdminOrder) => void;
}) {
  const [showInn, setShowInn] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const updateOrder = useAdminUpdateOrder();
  const deleteOrder = useAdminDeleteOrder();

  const existing: CompanyData | null = order.companyName
    ? {
        inn: order.inn ?? "",
        companyName: order.companyName ?? "",
        companyFullName: order.companyFullName ?? "",
        companyKpp: order.companyKpp ?? "",
        companyOgrn: order.companyOgrn ?? "",
        companyLegalAddress: order.companyLegalAddress ?? "",
        companyDirector: order.companyDirector ?? "",
        companyPhone: order.companyPhone ?? "",
        companyEmail: order.companyEmail ?? "",
        companyWebsite: order.companyWebsite ?? "",
        companyBankAccount: order.companyBankAccount ?? "",
        companyBankName: order.companyBankName ?? "",
        companyBik: order.companyBik ?? "",
        companyCorrAccount: order.companyCorrAccount ?? "",
      }
    : null;

  function handleSaveCompany(company: CompanyData) {
    updateOrder.mutate(
      { id: order.id, ...company },
      { onSuccess: () => setShowInn(false) }
    );
  }

  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap text-slate-500 align-top">
          {format(new Date(order.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
        </td>
        <td className="px-6 py-4 align-top">
          <div className="font-semibold text-slate-900">{order.name}</div>
          <div className="text-slate-500 text-xs mt-0.5">{order.phone}</div>
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
          <ContactButtons email={order.email} phone={order.phone} />
        </td>
        <td className="px-6 py-4 max-w-xs align-top">
          <div className="font-medium text-slate-800">{SERVICE_LABELS[order.serviceType] ?? order.serviceType}</div>
          <div className="text-slate-500 text-xs mt-1 truncate" title={order.address}>{order.address}</div>
          {order.notes && <div className="text-slate-400 text-xs mt-1 italic truncate">"{order.notes}"</div>}
        </td>
        <td className="px-6 py-4 align-top">
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
        <td className="px-6 py-4 text-right align-top">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setShowInn((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                order.companyName
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                  : "text-slate-500 bg-slate-100 hover:bg-slate-200"
              }`}
              title={order.companyName ? "Изменить юридическое лицо" : "Добавить юридическое лицо"}
            >
              {order.companyName
                ? <><Pencil className="w-3 h-3" /> ЮЛ</>
                : <><PlusCircle className="w-3 h-3" /> ЮЛ</>
              }
            </button>
            <button
              onClick={() => onProposal(order.name, order.email, order.companyName ?? undefined, order.inn ?? undefined, order.companyKpp ?? undefined, order.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Создать КП"
            >
              <FileText className="w-3.5 h-3.5" /> КП
            </button>
            <button
              onClick={() => onContract(order)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
              title="Создать договор"
            >
              <ScrollText className="w-3.5 h-3.5" /> Договор
            </button>
            <button
              onClick={() => setShowDocs((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                showDocs ? "text-sky-700 bg-sky-100" : "text-slate-600 bg-slate-100 hover:bg-slate-200"
              }`}
              title="Документы (КП и договоры)"
            >
              {showDocs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Документы
            </button>
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
          </div>
        </td>
      </tr>
      {showInn && (
        <tr>
          <td colSpan={5} className="p-0">
            <InnSearchPanel
              orderId={order.id}
              existing={existing}
              onSave={handleSaveCompany}
              onClose={() => setShowInn(false)}
              isSaving={updateOrder.isPending}
            />
          </td>
        </tr>
      )}
      {showDocs && <OrderDocumentsRow orderId={order.id} />}
    </>
  );
}

function OrdersTab({
  onProposal,
  onContract,
}: {
  onProposal: (name: string, email: string, companyName?: string, inn?: string, kpp?: string, orderId?: number) => void;
  onContract: (order: AdminOrder) => void;
}) {
  const { data: orders, isLoading } = useAdminOrders();
  const [search, setSearch] = useState("");
  const [hideInactive, setHideInactive] = useState(false);

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const INACTIVE_STATUSES = ["completed", "cancelled"];
  const q = search.trim().toLowerCase();
  const filtered = (orders ?? []).filter((o) => {
    if (hideInactive && INACTIVE_STATUSES.includes(o.status)) return false;
    if (!q) return true;
    return (
      o.name.toLowerCase().includes(q) ||
      (o.email ?? "").toLowerCase().includes(q) ||
      (o.inn ?? "").toLowerCase().includes(q) ||
      (o.companyName ?? "").toLowerCase().includes(q)
    );
  });

  const hiddenCount = hideInactive
    ? (orders ?? []).filter((o) => INACTIVE_STATUSES.includes(o.status)).length
    : 0;

  return (
    <div>
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, ИНН или компании…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
          <div
            onClick={() => setHideInactive((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${hideInactive ? "bg-accent" : "bg-slate-200"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hideInactive ? "translate-x-4" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm text-slate-600 whitespace-nowrap">
            Только активные
          </span>
          {hideInactive && hiddenCount > 0 && (
            <span className="text-xs text-slate-400">
              (скрыто: {hiddenCount})
            </span>
          )}
        </label>
        {q && (
          <p className="text-xs text-slate-400 w-full -mt-1">
            Найдено: {filtered.length} из {orders?.length ?? 0}
          </p>
        )}
      </div>
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
            {filtered.map((order) => (
              <OrderRow key={order.id} order={order} onProposal={onProposal} onContract={onContract} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  {q
                    ? `По запросу «${search}» ничего не найдено`
                    : hideInactive
                    ? "Нет активных заявок"
                    : "Нет заявок"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactsTab({ onProposal }: { onProposal: (name: string, email: string, companyName?: string, inn?: string, kpp?: string, orderId?: number) => void }) {
  const { data: contacts, isLoading } = useAdminContacts();
  const deleteContact = useAdminDeleteContact();

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
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
              <td className="px-6 py-4 align-top min-w-[220px]">
                <div className="font-semibold text-slate-900">{contact.name}</div>
                {contact.phone && <div className="text-slate-500 text-xs mt-0.5">{contact.phone}</div>}
                <div className="text-slate-500 text-xs">{contact.email}</div>
                <ContactButtons email={contact.email} phone={contact.phone} />
              </td>
              <td className="px-6 py-4 max-w-lg align-top">
                <p className="text-slate-700 whitespace-pre-wrap">{contact.message}</p>
              </td>
              <td className="px-6 py-4 text-right align-top">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onProposal(contact.name, contact.email)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="Отправить КП"
                  >
                    <FileText className="w-3.5 h-3.5" /> КП
                  </button>
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
                </div>
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
  );
}

export default function AdminClients() {
  const [tab, setTab] = useState<"orders" | "contacts">("orders");
  const [proposal, setProposal] = useState<{ name: string; email: string; companyName?: string; inn?: string; kpp?: string; orderId?: number } | null>(null);
  const [contractOrder, setContractOrder] = useState<AdminOrder | null>(null);
  const { data: orders } = useAdminOrders();
  const { data: contacts } = useAdminContacts();

  const ordersCount = orders?.length ?? 0;
  const contactsCount = contacts?.length ?? 0;
  const inProgressCount = orders?.filter(o => o.status === "in_progress").length ?? 0;
  const signedCount = orders?.filter(o => o.status === "signed").length ?? 0;
  const completedCount = orders?.filter(o => o.status === "completed").length ?? 0;

  function openProposal(name: string, email: string, companyName?: string, inn?: string, kpp?: string, orderId?: number) {
    setProposal({ name, email, companyName, inn, kpp, orderId });
  }

  function openContract(order: AdminOrder) {
    setContractOrder(order);
  }

  return (
    <>
      {/* Сводная статистика */}
      <div className="grid grid-cols-4 gap-4 mb-4 animate-in fade-in duration-500">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Всего заявок</p>
          <p className="text-3xl font-bold text-slate-800">{ordersCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-1">В работе</p>
          <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-violet-400 font-medium uppercase tracking-wide mb-1">Заключено</p>
          <p className="text-3xl font-bold text-violet-600">{signedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide mb-1">Исполнено</p>
          <p className="text-3xl font-bold text-emerald-600">{completedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
        <div className="flex items-center gap-1 border-b border-slate-200 px-6 pt-4">
          <button
            onClick={() => setTab("orders")}
            className={`relative px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              tab === "orders"
                ? "text-accent border-b-2 border-accent"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Заявки
          </button>
          <button
            onClick={() => setTab("contacts")}
            className={`relative px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              tab === "contacts"
                ? "text-accent border-b-2 border-accent"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Обращения
            {contactsCount > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">
                {contactsCount}
              </span>
            )}
          </button>
        </div>

        {tab === "orders"
          ? <OrdersTab onProposal={openProposal} onContract={openContract} />
          : <ContactsTab onProposal={openProposal} />
        }
      </div>

      {proposal && (
        <ProposalModal
          clientName={proposal.name}
          clientEmail={proposal.email}
          companyName={proposal.companyName}
          inn={proposal.inn}
          kpp={proposal.kpp}
          orderId={proposal.orderId}
          onClose={() => setProposal(null)}
        />
      )}

      {contractOrder && (
        <ContractModal
          clientName={contractOrder.name}
          clientEmail={contractOrder.email}
          orderId={contractOrder.id}
          prefill={{
            companyName: contractOrder.companyName ?? undefined,
            inn: contractOrder.inn ?? undefined,
            kpp: contractOrder.companyKpp ?? undefined,
            ogrn: contractOrder.companyOgrn ?? undefined,
            legalAddress: contractOrder.companyLegalAddress ?? undefined,
            director: contractOrder.companyDirector ?? undefined,
            objectAddress: contractOrder.address ?? undefined,
            bankAccount: contractOrder.companyBankAccount ?? undefined,
            bankName: contractOrder.companyBankName ?? undefined,
            bik: contractOrder.companyBik ?? undefined,
            corrAccount: contractOrder.companyCorrAccount ?? undefined,
          }}
          onClose={() => setContractOrder(null)}
        />
      )}
    </>
  );
}
