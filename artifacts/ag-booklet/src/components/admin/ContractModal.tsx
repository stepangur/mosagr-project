import { useState, useEffect, useRef } from "react";
import { X, FileDown, Send, Building2, User, CreditCard, MapPin, FileText, DollarSign, Loader2, ChevronDown, CheckCircle2 } from "lucide-react";

interface ContractFormData {
  contractNumber: string;
  contractDate: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  director: string;
  bankAccount: string;
  bankName: string;
  bik: string;
  corrAccount: string;
  objectAddress: string;
  subject: string;
  amount: string;
  prepayment: string;
  deadline: string;
  notes: string;
  orderId?: number;
}

export interface ContractPrefill extends Partial<ContractFormData> {}

interface Props {
  clientName?: string;
  clientEmail?: string;
  orderId?: number;
  prefill?: ContractPrefill;
  onClose: () => void;
}

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

function today(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function genContractNumber(): string {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const rd = String(Math.floor(Math.random() * 900) + 100);
  return `ДГ-${yr}${mo}-${rd}`;
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider pt-2 pb-1 border-b border-slate-100">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  half,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  half?: boolean;
}) {
  return (
    <div className={half ? "w-[48%]" : "w-full"}>
      <label className="block text-xs font-semibold text-slate-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none"
      />
    </div>
  );
}

export function ContractModal({ clientName = "", clientEmail = "", orderId, prefill, onClose }: Props) {
  const [form, setForm] = useState<ContractFormData>({
    contractNumber: genContractNumber(),
    contractDate: today(),
    clientName,
    clientEmail,
    companyName: "",
    inn: "",
    kpp: "",
    ogrn: "",
    legalAddress: "",
    director: "",
    bankAccount: "",
    bankName: "",
    bik: "",
    corrAccount: "",
    objectAddress: "",
    subject: "Разработка буклета АГР в соответствии с требованиями Москомархитектуры",
    amount: "",
    prepayment: "50%",
    deadline: "",
    notes: "",
    orderId,
    ...prefill,
  });

  const [loading, setLoading] = useState(false);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [dadataQuery, setDadataQuery] = useState("");
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

  function set(field: keyof ContractFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function searchDadata(query: string) {
    setDadataQuery(query);
    clearTimeout(ddTimer.current ?? undefined);
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
    setForm(prev => ({
      ...prev,
      companyName: s.data.name?.full_with_opf ?? s.value,
      inn: s.data.inn ?? "",
      kpp: s.data.kpp ?? "",
      ogrn: s.data.ogrn ?? "",
      legalAddress: s.data.address?.unrestricted_value ?? "",
      director: s.data.management?.name ?? "",
    }));
    setDadataQuery(s.data.name?.full_with_opf ?? s.value);
    setDadataSuggestions([]);
    setShowSuggestions(false);
  }

  async function downloadPdf() {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") ?? "";
      const res = await fetch("/api/admin/contracts/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { alert("Ошибка генерации PDF"); return; }
      const { id } = await res.json() as { id: number };
      window.location.href = `/api/admin/contracts/${id}/pdf?token=${encodeURIComponent(token)}`;
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocx() {
    setLoadingDocx(true);
    try {
      const token = localStorage.getItem("admin_token") ?? "";
      const res = await fetch("/api/admin/contracts/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { alert("Ошибка генерации DOCX"); return; }
      const { id } = await res.json() as { id: number };
      window.location.href = `/api/admin/contracts/${id}/docx?token=${encodeURIComponent(token)}`;
      onClose();
    } finally {
      setLoadingDocx(false);
    }
  }

  async function sendEmail() {
    setSending(true);
    setSendError(null);
    try {
      const token = localStorage.getItem("admin_token") ?? "";
      const res = await fetch("/api/admin/contracts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSendError(json.error ?? "Ошибка отправки");
        return;
      }
      setSent(true);
      setTimeout(() => onClose(), 2000);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Создать договор</h2>
            <p className="text-xs text-slate-500 mt-0.5">Заполните реквизиты — PDF сгенерируется автоматически</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Номер и дата */}
          <div className="flex gap-4">
            <Field label="Номер договора" value={form.contractNumber} onChange={v => set("contractNumber", v)} required half />
            <Field label="Дата договора" value={form.contractDate} onChange={v => set("contractDate", v)} placeholder="01.01.2026" required half />
          </div>

          {/* Контакт */}
          <SectionHeader icon={User} label="Контактное лицо" />
          <div className="flex gap-4">
            <Field label="ФИО" value={form.clientName} onChange={v => set("clientName", v)} placeholder="Иванов Иван Иванович" required half />
            <Field label="Email" value={form.clientEmail} onChange={v => set("clientEmail", v)} type="email" placeholder="ivan@company.ru" half />
          </div>

          {/* Организация */}
          <SectionHeader icon={Building2} label="Организация заказчика" />

          {/* DaData поиск */}
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Поиск по ИНН или названию</label>
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

          <Field label="Наименование организации" value={form.companyName} onChange={v => set("companyName", v)} placeholder='ООО «Название»' />
          <div className="flex gap-4">
            <Field label="ИНН" value={form.inn} onChange={v => set("inn", v)} placeholder="7700000000" half />
            <Field label="КПП" value={form.kpp} onChange={v => set("kpp", v)} placeholder="770001001" half />
          </div>
          <div className="flex gap-4">
            <Field label="ОГРН" value={form.ogrn} onChange={v => set("ogrn", v)} placeholder="1030000000000" half />
            <Field label="Директор" value={form.director} onChange={v => set("director", v)} placeholder="Иванов И. И." half />
          </div>
          <Field label="Юридический адрес" value={form.legalAddress} onChange={v => set("legalAddress", v)} placeholder="117997, г. Москва, ул. Примерная, д. 1" />

          {/* Банковские реквизиты */}
          <SectionHeader icon={CreditCard} label="Банковские реквизиты заказчика" />
          <Field label="Расчётный счёт" value={form.bankAccount} onChange={v => set("bankAccount", v)} placeholder="40702810000000000000" />
          <div className="flex gap-4">
            <Field label="Банк" value={form.bankName} onChange={v => set("bankName", v)} placeholder='АО «Сбербанк»' half />
            <Field label="БИК" value={form.bik} onChange={v => set("bik", v)} placeholder="044525225" half />
          </div>
          <Field label="Корр. счёт" value={form.corrAccount} onChange={v => set("corrAccount", v)} placeholder="30101810400000000225" />

          {/* Объект */}
          <SectionHeader icon={MapPin} label="Объект и предмет договора" />
          <Field label="Адрес объекта" value={form.objectAddress} onChange={v => set("objectAddress", v)} placeholder="г. Москва, ул. Примерная, д. 1" />
          <TextAreaField label="Предмет договора" value={form.subject} onChange={v => set("subject", v)} placeholder="Разработка буклета АГР..." rows={2} />

          {/* Финансы */}
          <SectionHeader icon={DollarSign} label="Финансовые условия" />
          <div className="flex gap-4">
            <Field label="Стоимость" value={form.amount} onChange={v => set("amount", v)} placeholder="150 000 ₽" required half />
            <Field label="Предоплата" value={form.prepayment} onChange={v => set("prepayment", v)} placeholder="50%" half />
          </div>
          <Field label="Срок выполнения" value={form.deadline} onChange={v => set("deadline", v)} placeholder="45 рабочих дней" />

          {/* Примечания */}
          <SectionHeader icon={FileText} label="Дополнительно" />
          <TextAreaField label="Примечания" value={form.notes} onChange={v => set("notes", v)} placeholder="Особые условия..." rows={2} />
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          {/* Error */}
          {sendError && (
            <div className="w-full px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
              {sendError}
            </div>
          )}
          {/* Success */}
          {sent && (
            <div className="w-full flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Договор отправлен на {form.clientEmail}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              Отмена
            </button>
            <div className="flex gap-2">
              <button
                onClick={sendEmail}
                disabled={sending || loading || sent || !form.clientName || !form.contractNumber || !form.clientEmail}
                title={!form.clientEmail ? "Укажите email получателя" : ""}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Отправить на email
              </button>
              <button
                onClick={downloadDocx}
                disabled={loadingDocx || loading || sending || !form.clientName || !form.contractNumber}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Скачать DOCX
              </button>
              <button
                onClick={downloadPdf}
                disabled={loading || loadingDocx || sending || !form.clientName || !form.contractNumber}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Скачать PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
