import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { adminFetch } from "@/lib/admin-fetch";
import { ContractModal, ContractPrefill } from "@/components/admin/ContractModal";
import {
  FilePlus2, FileText, Building2, User, RotateCcw,
  FileDown, Save, Eye, EyeOff, Info, Search, X as XIcon,
} from "lucide-react";

interface ContractRecord {
  id: number;
  orderId: number | null;
  contractNumber: string;
  version: number;
  contractDate: string;
  clientName: string;
  clientEmail: string | null;
  companyName: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  director: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bik: string | null;
  corrAccount: string | null;
  objectAddress: string | null;
  subject: string | null;
  amount: string | null;
  prepayment: string | null;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
}

const DEFAULT_TEMPLATE = `ДОГОВОР № {{НОМЕР_ДОГОВОРА}}
г. Москва                                                                   {{ДАТА_ДОГОВОРА}}

ООО «Минерал», именуемое в дальнейшем «Исполнитель», в лице директора Гурцкая Степана Сергеевича, действующего на основании Устава, с одной стороны, и
{{НАИМЕНОВАНИЕ}}, именуемое в дальнейшем «Заказчик», в лице {{ДИРЕКТОР}}, действующего на основании Устава, с другой стороны, заключили настоящий договор о следующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Заказчик поручает, а Исполнитель принимает на себя обязательство выполнить: {{ПРЕДМЕТ}}.
1.2. Адрес объекта: {{АДРЕС_ОБЪЕКТА}}.

2. СТОИМОСТЬ И ПОРЯДОК РАСЧЁТОВ

2.1. Стоимость работ составляет: {{СТОИМОСТЬ}}.
2.2. Предоплата: {{ПРЕДОПЛАТА}} в течение 3 (трёх) банковских дней с момента подписания настоящего договора.
2.3. Оставшаяся часть оплачивается в течение 3 (трёх) банковских дней с момента сдачи работ.

3. СРОКИ ВЫПОЛНЕНИЯ РАБОТ

3.1. Срок выполнения работ: {{СРОК}}.
3.2. Срок исчисляется с даты поступления предоплаты на расчётный счёт Исполнителя.

4. РЕКВИЗИТЫ СТОРОН

Исполнитель:
ООО «Минерал»
ИНН 3234051013 / КПП 774301001
ОГРН 1033265025287
Директор: Гурцкая Степан Сергеевич

Заказчик:
{{НАИМЕНОВАНИЕ}}
ИНН {{ИНН}} / КПП {{КПП}}
ОГРН {{ОГРН}}
Юр. адрес: {{ЮР_АДРЕС}}
Директор: {{ДИРЕКТОР}}
Расч. счёт: {{РАСЧ_СЧЕТ}}
Банк: {{БАНК}}, БИК {{БИК}}
Корр. счёт: {{КОР_СЧЕТ}}

{{ПРИМЕЧАНИЯ}}
`;

const PLACEHOLDER_DOCS = [
  ["{{НОМЕР_ДОГОВОРА}}", "Номер договора"],
  ["{{ДАТА_ДОГОВОРА}}", "Дата договора"],
  ["{{КОНТАКТНОЕ_ЛИЦО}}", "ФИО контактного лица"],
  ["{{EMAIL}}", "Email"],
  ["{{НАИМЕНОВАНИЕ}}", "Наименование организации"],
  ["{{ИНН}}", "ИНН"],
  ["{{КПП}}", "КПП"],
  ["{{ОГРН}}", "ОГРН"],
  ["{{ЮР_АДРЕС}}", "Юридический адрес"],
  ["{{ДИРЕКТОР}}", "Директор"],
  ["{{РАСЧ_СЧЕТ}}", "Расчётный счёт"],
  ["{{БАНК}}", "Наименование банка"],
  ["{{БИК}}", "БИК"],
  ["{{КОР_СЧЕТ}}", "Корреспондентский счёт"],
  ["{{АДРЕС_ОБЪЕКТА}}", "Адрес объекта"],
  ["{{ПРЕДМЕТ}}", "Предмет договора"],
  ["{{СТОИМОСТЬ}}", "Стоимость"],
  ["{{ПРЕДОПЛАТА}}", "Предоплата"],
  ["{{СРОК}}", "Срок выполнения"],
  ["{{ПРИМЕЧАНИЯ}}", "Примечания"],
];

function useContracts() {
  return useQuery<ContractRecord[]>({
    queryKey: ["admin-contracts"],
    queryFn: () => adminFetch<ContractRecord[]>("/admin/contracts"),
    staleTime: 30_000,
  });
}

function useContractTemplate() {
  return useQuery<{ value: string }>({
    queryKey: ["admin-contract-template"],
    queryFn: () => adminFetch<{ value: string }>("/admin/settings/key/contract.template"),
    staleTime: 60_000,
  });
}

export default function AdminContracts() {
  const [tab, setTab] = useState<"history" | "template">("history");
  const [showModal, setShowModal] = useState(false);
  const [repeatData, setRepeatData] = useState<ContractPrefill | null>(null);
  const [templateText, setTemplateText] = useState<string | null>(null);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterInn, setFilterInn] = useState("");
  const qc = useQueryClient();

  const { data: contracts, isLoading } = useContracts();
  const { data: templateData } = useContractTemplate();

  const effectiveTemplate = templateText !== null ? templateText : (templateData?.value ?? DEFAULT_TEMPLATE);

  const saveTemplate = useMutation({
    mutationFn: async (text: string) => {
      const token = localStorage.getItem("admin_token") ?? "";
      const res = await fetch("/api/admin/settings/key/contract.template", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: text }),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      return res.json();
    },
    onSuccess: () => {
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 3000);
      qc.invalidateQueries({ queryKey: ["admin-contract-template"] });
    },
  });

  function openRepeat(c: ContractRecord) {
    setRepeatData({
      clientName: c.clientName,
      clientEmail: c.clientEmail ?? undefined,
      companyName: c.companyName ?? undefined,
      inn: c.inn ?? undefined,
      kpp: c.kpp ?? undefined,
      ogrn: c.ogrn ?? undefined,
      legalAddress: c.legalAddress ?? undefined,
      director: c.director ?? undefined,
      bankAccount: c.bankAccount ?? undefined,
      bankName: c.bankName ?? undefined,
      bik: c.bik ?? undefined,
      corrAccount: c.corrAccount ?? undefined,
      objectAddress: c.objectAddress ?? undefined,
      subject: c.subject ?? undefined,
      amount: c.amount ?? undefined,
      prepayment: c.prepayment ?? undefined,
      deadline: c.deadline ?? undefined,
      notes: c.notes ?? undefined,
      orderId: c.orderId ?? undefined,
    });
    setShowModal(true);
  }

  const filteredContracts = (contracts ?? []).filter(c => {
    const nameMatch = !filterName.trim() ||
      c.clientName.toLowerCase().includes(filterName.toLowerCase()) ||
      (c.companyName ?? "").toLowerCase().includes(filterName.toLowerCase());
    const innMatch = !filterInn.trim() ||
      (c.inn ?? "").includes(filterInn.trim());
    return nameMatch && innMatch;
  });

  function downloadAgain(c: ContractRecord) {
    const token = localStorage.getItem("admin_token") ?? "";
    window.location.href = `/api/admin/contracts/${c.id}/pdf?token=${encodeURIComponent(token)}`;
  }

  function downloadDocxAgain(c: ContractRecord) {
    const token = localStorage.getItem("admin_token") ?? "";
    window.location.href = `/api/admin/contracts/${c.id}/docx?token=${encodeURIComponent(token)}`;
  }

  // Group filtered contracts by contractNumber, latest version first
  const groupedContracts = Object.values(
    filteredContracts.reduce<Record<string, ContractRecord[]>>((acc, c) => {
      (acc[c.contractNumber] ??= []).push(c);
      return acc;
    }, {})
  ).map(versions => [...versions].sort((a, b) => (b.version ?? 1) - (a.version ?? 1)))
    .sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime());

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-5">

            {/* Stats + Action */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {new Set(contracts?.map(c => c.contractNumber)).size ?? 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Уникальных договоров</div>
                </div>
                {(contracts?.length ?? 0) > (new Set(contracts?.map(c => c.contractNumber)).size ?? 0) && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 text-center">
                    <div className="text-2xl font-bold text-violet-600">{contracts?.length ?? 0}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Всего редакций</div>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setRepeatData(null); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-bold text-sm rounded-xl hover:bg-accent/90 transition-colors shadow-sm"
              >
                <FilePlus2 className="w-4 h-4" />
                Создать договор
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm">
              {([["history", "История договоров"], ["template", "Шаблон договора"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-2 text-sm font-semibold rounded-xl transition-colors ${tab === key ? "bg-accent text-white" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* History Tab */}
            {tab === "history" && (
              <div className="space-y-3 animate-in fade-in duration-300">

                {/* Filter bar */}
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={filterName}
                      onChange={e => setFilterName(e.target.value)}
                      placeholder="Контрагент..."
                      className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    />
                    {filterName && (
                      <button onClick={() => setFilterName("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={filterInn}
                      onChange={e => setFilterInn(e.target.value)}
                      placeholder="ИНН..."
                      className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    />
                    {filterInn && (
                      <button onClick={() => setFilterInn("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {(filterName || filterInn) && (
                    <span className="text-xs text-slate-500">
                      Найдено: <span className="font-semibold text-slate-700">{groupedContracts.length}</span> из {new Set(contracts?.map(c => c.contractNumber)).size ?? 0}
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                      <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-4 font-semibold">Номер</th>
                            <th className="px-5 py-4 font-semibold">Дата</th>
                            <th className="px-5 py-4 font-semibold">Заказчик</th>
                            <th className="px-5 py-4 font-semibold">Стоимость</th>
                            <th className="px-5 py-4 font-semibold">Срок</th>
                            <th className="px-5 py-4 font-semibold">Создан</th>
                            <th className="px-5 py-4 font-semibold text-right"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedContracts.map(versions => {
                            const latest = versions[0];
                            const hasMultiple = versions.length > 1;
                            return (
                              <React.Fragment key={latest.contractNumber}>
                                {/* Latest version row */}
                                <tr key={`latest-${latest.id}`} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                                  <td className="px-5 py-4 align-top">
                                    <div className="font-mono font-bold text-slate-800 text-sm">{latest.contractNumber}</div>
                                    <span className="mt-1 inline-block text-xs font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                      v{latest.version ?? 1}
                                    </span>
                                    {hasMultiple && (
                                      <span className="ml-1 text-xs text-slate-400">
                                        (ред. {versions.length})
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-slate-600 text-sm">{latest.contractDate}</td>
                                  <td className="px-5 py-4 align-top">
                                    <div className="flex items-start gap-2">
                                      <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                      <div>
                                        <div className="font-semibold text-slate-900 text-sm">{latest.clientName}</div>
                                        {latest.clientEmail && <div className="text-xs text-slate-500">{latest.clientEmail}</div>}
                                      </div>
                                    </div>
                                    {latest.companyName && (
                                      <div className="flex items-start gap-2 mt-1">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                          <div className="text-xs font-medium text-slate-600">{latest.companyName}</div>
                                          {latest.inn && <div className="text-xs text-slate-400">ИНН: {latest.inn}</div>}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 font-bold text-slate-900 text-sm">{latest.amount || "—"}</td>
                                  <td className="px-5 py-4 text-slate-600 text-sm">{latest.deadline || "—"}</td>
                                  <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                                    {format(new Date(latest.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => downloadDocxAgain(latest)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Скачать DOCX (Word)">
                                        <FileText className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => downloadAgain(latest)} className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-lg transition-colors" title="Скачать PDF">
                                        <FileDown className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => openRepeat(latest)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors ml-1" title="Создать новую версию">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Создать
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {/* Older version rows */}
                                {hasMultiple && versions.slice(1).map(c => (
                                  <tr key={`old-${c.id}`} className="bg-slate-50/60 border-b border-slate-100/60 transition-colors">
                                    <td className="px-5 py-2 pl-8">
                                      <span className="text-xs text-slate-400 font-mono">v{c.version ?? 1}</span>
                                    </td>
                                    <td className="px-5 py-2 text-slate-400 text-xs">{c.contractDate}</td>
                                    <td className="px-5 py-2 text-slate-400 text-xs">{c.companyName || c.clientName}</td>
                                    <td className="px-5 py-2 text-slate-400 text-xs">{c.amount || "—"}</td>
                                    <td className="px-5 py-2 text-slate-400 text-xs">{c.deadline || "—"}</td>
                                    <td className="px-5 py-2 text-slate-400 text-xs whitespace-nowrap">
                                      {format(new Date(c.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                                    </td>
                                    <td className="px-5 py-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => downloadDocxAgain(c)} className="p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Word">
                                          <FileText className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => downloadAgain(c)} className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="PDF">
                                          <FileDown className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                          {groupedContracts.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-16 text-center">
                                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                {(filterName || filterInn) ? (
                                  <>
                                    <p className="text-slate-500 font-medium">Ничего не найдено</p>
                                    <p className="text-slate-400 text-xs mt-1">Попробуйте изменить условия поиска</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-slate-500 font-medium">Договоров пока нет</p>
                                    <p className="text-slate-400 text-xs mt-1">Создайте первый договор — он появится здесь</p>
                                  </>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Template Tab */}
            {tab === "template" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Шаблон договора</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Вставьте текст вашего договора и используйте переменные в двойных фигурных скобках <code className="bg-amber-100 px-1 rounded">{"{{ПЕРЕМЕННАЯ}}"}</code> — они будут автоматически заменены данными клиента при генерации PDF.
                    </p>
                  </div>
                </div>

                {/* Placeholders reference */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowPlaceholders(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {showPlaceholders ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      Список доступных переменных
                    </span>
                    <span className="text-xs text-slate-400">{showPlaceholders ? "скрыть" : "показать"}</span>
                  </button>
                  {showPlaceholders && (
                    <div className="px-5 pb-4 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                        {PLACEHOLDER_DOCS.map(([placeholder, description]) => (
                          <div key={placeholder} className="flex items-center gap-2">
                            <code className="text-xs bg-slate-100 text-accent font-mono px-1.5 py-0.5 rounded shrink-0">{placeholder}</code>
                            <span className="text-xs text-slate-500 truncate">{description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Template editor */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Текст договора</span>
                    <button
                      onClick={() => saveTemplate.mutate(effectiveTemplate)}
                      disabled={saveTemplate.isPending}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {templateSaved ? "Сохранено ✓" : "Сохранить"}
                    </button>
                  </div>
                  <textarea
                    value={effectiveTemplate}
                    onChange={e => setTemplateText(e.target.value)}
                    className="w-full px-5 py-4 font-mono text-xs text-slate-700 leading-relaxed resize-none focus:outline-none"
                    rows={30}
                    spellCheck={false}
                    placeholder="Вставьте текст договора с переменными в формате {{ПЕРЕМЕННАЯ}}..."
                  />
                </div>
              </div>
            )}
      </div>

      {showModal && (
        <ContractModal
          clientName=""
          clientEmail=""
          prefill={repeatData ?? undefined}
          onClose={() => { setShowModal(false); setRepeatData(null); qc.invalidateQueries({ queryKey: ["admin-contracts"] }); }}
        />
      )}
    </>
  );
}
