import { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Send, Loader2, FileText, Download, ChevronDown } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { useToast } from "@/hooks/use-toast";

interface DadataSuggestion {
  value: string;
  data: {
    inn?: string;
    kpp?: string;
    ogrn?: string;
    address?: { unrestricted_value?: string };
    management?: { name?: string };
    name?: { full_with_opf?: string };
  };
}

async function downloadPdf(form: ProposalFormData): Promise<void> {
  const token = localStorage.getItem("admin_token") ?? "";
  const res = await fetch("/api/admin/proposals/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Ошибка генерации PDF");
  }
  const { id } = await res.json() as { id: number };
  window.location.href = `/api/admin/proposals/${id}/pdf?token=${encodeURIComponent(token)}`;
}

interface ProposalItem {
  name: string;
  description: string;
  price: string;
}

interface ProposalFormData {
  clientName: string;
  clientEmail: string;
  companyName: string;
  inn: string;
  kpp: string;
  services: ProposalItem[];
  totalPrice: string;
  discountAmount: string;
  validDays: number;
  deadline: string;
  managerName: string;
  managerPhone: string;
  notes: string;
  orderId?: number;
}

interface ProposalPrefill {
  clientName?: string;
  clientEmail?: string;
  companyName?: string;
  inn?: string;
  kpp?: string;
  services?: ProposalItem[];
  totalPrice?: string;
  discountAmount?: string;
  validDays?: number;
  deadline?: string;
  managerName?: string;
  managerPhone?: string;
  notes?: string;
  orderId?: number;
}

interface ProposalModalProps {
  clientName: string;
  clientEmail: string;
  companyName?: string;
  inn?: string;
  kpp?: string;
  orderId?: number;
  prefill?: ProposalPrefill;
  onClose: () => void;
}

const DEFAULT_SERVICES: ProposalItem[] = [
  {
    name: "Разработка буклета АГР",
    description: "Подготовка архитектурно-градостроительного решения в соответствии с требованиями Москомархитектуры",
    price: "от 250 000 ₽",
  },
];

export function ProposalModal({ clientName, clientEmail, companyName, inn, kpp, orderId, prefill, onClose }: ProposalModalProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // DaData search state
  const [dadataQuery, setDadataQuery] = useState(prefill?.companyName ?? companyName ?? "");
  const [dadataSuggestions, setDadataSuggestions] = useState<DadataSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ddTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function searchDadata(query: string) {
    setDadataQuery(query);
    if (ddTimer.current) clearTimeout(ddTimer.current);
    if (!query.trim() || query.length < 2) { setDadataSuggestions([]); setShowSuggestions(false); return; }
    ddTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/dadata/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) return;
        const json = await res.json();
        setDadataSuggestions(json.suggestions ?? []);
        setShowSuggestions(true);
      } catch {}
    }, 400);
  }

  function applyDadata(s: DadataSuggestion) {
    setForm(f => ({
      ...f,
      companyName: s.data.name?.full_with_opf ?? s.value,
      inn: s.data.inn ?? "",
      kpp: s.data.kpp ?? "",
    }));
    setDadataQuery(s.data.name?.full_with_opf ?? s.value);
    setDadataSuggestions([]);
    setShowSuggestions(false);
  }

  const [form, setForm] = useState<ProposalFormData>({
    clientName: prefill?.clientName ?? clientName,
    clientEmail: prefill?.clientEmail ?? clientEmail,
    companyName: prefill?.companyName ?? companyName ?? "",
    inn: prefill?.inn ?? inn ?? "",
    kpp: prefill?.kpp ?? kpp ?? "",
    services: prefill?.services ?? DEFAULT_SERVICES,
    discountAmount: prefill?.discountAmount ?? "",
    orderId: prefill?.orderId ?? orderId,
    totalPrice: prefill?.totalPrice ?? "от 250 000 ₽",
    validDays: prefill?.validDays ?? 30,
    deadline: prefill?.deadline ?? "60 рабочих дней",
    managerName: prefill?.managerName ?? "",
    managerPhone: prefill?.managerPhone ?? "+7 (495) 568-18-77",
    notes: prefill?.notes ?? "",
  });

  function setField<K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function updateService(idx: number, field: keyof ProposalItem, value: string) {
    setForm(f => ({
      ...f,
      services: f.services.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));
  }

  function addService() {
    setForm(f => ({
      ...f,
      services: [...f.services, { name: "", description: "", price: "" }],
    }));
  }

  function removeService(idx: number) {
    setForm(f => ({ ...f, services: f.services.filter((_, i) => i !== idx) }));
  }

  async function handleDownload() {
    if (form.services.length === 0) {
      toast({ title: "Добавьте хотя бы одну услугу", variant: "destructive" }); return;
    }
    if (form.services.some(s => !s.name.trim())) {
      toast({ title: "Заполните названия всех услуг", variant: "destructive" }); return;
    }
    setDownloading(true);
    try {
      await downloadPdf(form);
      toast({ title: "PDF успешно скачан" });
    } catch (err: any) {
      toast({ title: "Ошибка генерации PDF", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  async function handleSend() {
    if (!form.clientEmail.trim()) {
      toast({ title: "Укажите email клиента", variant: "destructive" }); return;
    }
    if (form.services.length === 0) {
      toast({ title: "Добавьте хотя бы одну услугу", variant: "destructive" }); return;
    }
    if (form.services.some(s => !s.name.trim())) {
      toast({ title: "Заполните названия всех услуг", variant: "destructive" }); return;
    }

    setSending(true);
    try {
      const result = await adminFetch<{ ok: boolean; error?: string }>("/admin/proposals/send", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!result.ok) throw new Error(result.error ?? "Ошибка отправки");
      toast({ title: "КП успешно отправлено!", description: `Письмо отправлено на ${form.clientEmail}` });
      onClose();
    } catch (err: any) {
      toast({ title: "Ошибка отправки", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent p-2 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Коммерческое предложение</h2>
              <p className="text-xs text-slate-500 mt-0.5">Заполните и отправьте клиенту на email</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Client info */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Получатель</h3>
            <div className="space-y-3">

              {/* DaData поиск по ИНН */}
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Поиск по ИНН или названию</label>
                <div className="relative">
                  <input
                    value={dadataQuery}
                    onChange={e => searchDadata(e.target.value)}
                    placeholder="Начните вводить название или ИНН..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                  <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {showSuggestions && dadataSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {dadataSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onMouseDown={() => applyDadata(s)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div className="font-semibold text-sm text-slate-900">{s.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {[s.data.inn && `ИНН: ${s.data.inn}`, s.data.ogrn && `ОГРН: ${s.data.ogrn}`, s.data.address?.unrestricted_value].filter(Boolean).join("  ·  ")}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Наименование организации</label>
                <input
                  value={form.companyName}
                  onChange={e => setField("companyName", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="ООО «Название компании»"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ИНН</label>
                  <input
                    value={form.inn}
                    onChange={e => setField("inn", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">КПП</label>
                  <input
                    value={form.kpp}
                    onChange={e => setField("kpp", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="123456789"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Контактное лицо *</label>
                  <input
                    value={form.clientName}
                    onChange={e => setField("clientName", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email клиента *</label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={e => setField("clientEmail", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="client@example.ru"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Состав услуг</h3>
              <button
                onClick={addService}
                className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить строку
              </button>
            </div>
            <div className="space-y-2">
              {form.services.map((svc, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex gap-2 mb-2">
                    <input
                      value={svc.name}
                      onChange={e => updateService(idx, "name", e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white"
                      placeholder="Название услуги *"
                    />
                    <input
                      value={svc.price}
                      onChange={e => updateService(idx, "price", e.target.value)}
                      className="w-36 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white text-right"
                      placeholder="Стоимость"
                    />
                    <button
                      onClick={() => removeService(idx)}
                      disabled={form.services.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={svc.description}
                    onChange={e => updateService(idx, "description", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white resize-none"
                    placeholder="Описание (необязательно)"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Total & Terms */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Итог и сроки</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Итоговая стоимость</label>
                <input
                  value={form.totalPrice}
                  onChange={e => setField("totalPrice", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="от 250 000 ₽"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Скидка <span className="text-slate-400 font-normal">(необязательно)</span>
                </label>
                <input
                  value={form.discountAmount}
                  onChange={e => setField("discountAmount", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 text-emerald-700 placeholder:text-slate-400"
                  placeholder="например: 25 000 ₽ или 10%"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Срок выполнения</label>
                <input
                  value={form.deadline}
                  onChange={e => setField("deadline", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="60 рабочих дней"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">КП действует (дней)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.validDays}
                  onChange={e => setField("validDays", Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>
          </section>

          {/* Manager */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Менеджер</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ФИО менеджера</label>
                <input
                  value={form.managerName}
                  onChange={e => setField("managerName", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="Иванова А.П."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Телефон менеджера</label>
                <input
                  value={form.managerPhone}
                  onChange={e => setField("managerPhone", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="+7 (495) 568-18-77"
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Примечания</label>
            <textarea
              value={form.notes}
              onChange={e => setField("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder="Дополнительные условия, особенности объекта…"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl shrink-0">
          <p className="text-xs text-slate-400">
            Письмо будет отправлено через SMTP, настроенный в разделе «Настройки сайта»
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading || sending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Генерация…" : "Скачать PDF"}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || downloading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Отправка…" : "Отправить КП"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
