import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";
import { useToast } from "@/hooks/use-toast";
import { Save, Building2, Home, Megaphone, Search, KeyRound, Eye, EyeOff, ShieldCheck, Share2, Bell, Send, CheckCircle2, Mail, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Settings = Record<string, string>;

const TABS = [
  { id: "company", label: "Компания", icon: Building2 },
  { id: "homepage", label: "Главная страница", icon: Home },
  { id: "banner", label: "Баннер", icon: Megaphone },
  { id: "seo", label: "SEO", icon: Search },
  { id: "social", label: "Соц. сети", icon: Share2 },
  { id: "notifications", label: "Уведомления", icon: Bell },
];

function Field({ label, value, onChange, type = "text", placeholder = "", hint = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-700 font-medium">{label}</Label>
      {type === "textarea" ? (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="resize-none min-h-[80px]"
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Toggle({ enabled, onToggle, label, hint }: { enabled: boolean; onToggle: () => void; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div>
        <p className="font-medium text-slate-800 text-sm">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? "bg-primary" : "bg-slate-300"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.FC<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <div>
        <h3 className="font-display font-bold text-base text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function TestButton({ status, onClick, disabled, label = "Отправить тест", okLabel = "Отправлено!" }: {
  status: "idle" | "sending" | "ok" | "error"; onClick: () => void; disabled: boolean; label?: string; okLabel?: string;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={status === "sending" || disabled} className="gap-2 border-slate-200">
      {status === "sending"
        ? <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
        : status === "ok"
        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
        : <Send className="w-4 h-4" />}
      {status === "sending" ? "Отправка..." : status === "ok" ? okLabel : label}
    </Button>
  );
}

function NotificationsTab({ s, set, save, isPending, local }: {
  s: (key: string, def?: string) => string;
  set: (key: string, value: string) => void;
  save: () => void;
  isPending: boolean;
  local: Settings;
}) {
  const { toast } = useToast();
  const [tgStatus, setTgStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [fetchingChatId, setFetchingChatId] = useState(false);

  const fetchChatId = async () => {
    const botToken = local["notify.telegram.bot_token"] ?? "";
    if (!botToken) { toast({ title: "Сначала введите токен бота", variant: "destructive" }); return; }
    setFetchingChatId(true);
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=10&offset=-10`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.description ?? "Ошибка Telegram API");
      const updates: any[] = data.result ?? [];
      const chatId = updates.length > 0
        ? (updates[updates.length - 1].message?.chat?.id
           ?? updates[updates.length - 1].channel_post?.chat?.id
           ?? null)
        : null;
      if (chatId == null) {
        toast({
          title: "Сообщений не найдено",
          description: "Напишите любое сообщение боту (или в канал/группу), затем нажмите снова.",
          variant: "destructive",
        });
      } else {
        set("notify.telegram.chat_id", String(chatId));
        toast({ title: `✅ Chat ID определён: ${chatId}`, description: "Значение вставлено в поле автоматически." });
      }
    } catch (err: any) {
      toast({ title: "Ошибка получения Chat ID", description: err?.message ?? "Неизвестная ошибка", variant: "destructive" });
    } finally {
      setFetchingChatId(false);
    }
  };

  // Email recipients as array
  const [recipientInput, setRecipientInput] = useState("");
  const recipients = (s("notify.email.recipients") || "")
    .split(",")
    .map(e => e.trim())
    .filter(Boolean);

  const addRecipient = () => {
    const email = recipientInput.trim();
    if (!email || recipients.includes(email)) { setRecipientInput(""); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Некорректный email", variant: "destructive" }); return;
    }
    set("notify.email.recipients", [...recipients, email].join(","));
    setRecipientInput("");
  };

  const removeRecipient = (email: string) => {
    set("notify.email.recipients", recipients.filter(e => e !== email).join(","));
  };

  const parseApiError = (err: any): string => {
    let msg = err?.message ?? "Неизвестная ошибка";
    try { const p = JSON.parse(msg); if (p?.error) msg = p.error; } catch { /* plain */ }
    return msg;
  };

  const sendTgTest = async () => {
    const botToken = local["notify.telegram.bot_token"] ?? "";
    const chatId = local["notify.telegram.chat_id"] ?? "";
    if (!botToken || !chatId) { toast({ title: "Заполните токен бота и Chat ID", variant: "destructive" }); return; }
    setTgStatus("sending");
    try {
      const res = await adminFetch<{ ok: boolean; error?: string }>("/admin/notify/test", {
        method: "POST",
        body: JSON.stringify({ botToken, chatId }),
      });
      if (res.ok) {
        setTgStatus("ok");
        toast({ title: "✅ Тест Telegram отправлен", description: "Проверьте чат." });
      } else {
        throw new Error(res.error ?? "Ошибка");
      }
    } catch (err) {
      setTgStatus("error");
      toast({ title: "Ошибка отправки в Telegram", description: parseApiError(err), variant: "destructive" });
    } finally {
      setTimeout(() => setTgStatus("idle"), 3000);
    }
  };

  const sendEmailTest = async () => {
    const host = local["notify.email.smtp_host"] ?? "";
    const user = local["notify.email.smtp_user"] ?? "";
    const pass = local["notify.email.smtp_pass"] ?? "";
    const from = local["notify.email.from"] ?? "";
    const recipientsNow = (local["notify.email.recipients"] ?? "").split(",").map(e => e.trim()).filter(Boolean);
    if (!host || !user || !pass || !from || !recipientsNow.length) {
      toast({ title: "Заполните все SMTP-поля и добавьте хотя бы один адрес", variant: "destructive" }); return;
    }
    setEmailStatus("sending");
    try {
      const res = await adminFetch<{ ok: boolean; error?: string }>("/admin/notify/email/test", {
        method: "POST",
        body: JSON.stringify({
          host,
          port: parseInt(local["notify.email.smtp_port"] ?? "587", 10) || 587,
          user,
          pass,
          from,
          recipients: recipientsNow,
          secure: local["notify.email.smtp_secure"] === "1",
        }),
      });
      if (res.ok) {
        setEmailStatus("ok");
        toast({ title: "✅ Тестовое письмо отправлено", description: `Проверьте: ${recipientsNow.join(", ")}` });
      } else {
        throw new Error(res.error ?? "Ошибка");
      }
    } catch (err) {
      setEmailStatus("error");
      toast({ title: "Ошибка отправки письма", description: parseApiError(err), variant: "destructive" });
    } finally {
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-10 max-w-xl">

      {/* ── Telegram ───────────────────────────────────────── */}
      <div className="space-y-5">
        <SectionHeader
          icon={Bell as any}
          title="Telegram-уведомления"
          description="При поступлении заявки бот пришлёт сообщение в чат или канал."
        />

        <Toggle
          enabled={s("notify.telegram.enabled") === "1"}
          onToggle={() => set("notify.telegram.enabled", s("notify.telegram.enabled") === "1" ? "" : "1")}
          label="Включить Telegram-уведомления"
          hint="Отправлять сообщение в Telegram при каждой новой заявке"
        />

        <Field
          label="Токен бота"
          value={s("notify.telegram.bot_token")}
          onChange={v => set("notify.telegram.bot_token", v)}
          placeholder="123456789:AABBCCDDEEFFaabbccddeeff..."
          hint="Получите у @BotFather командой /newbot"
        />
        <div className="space-y-1.5">
          <Field
            label="Chat ID"
            value={s("notify.telegram.chat_id")}
            onChange={v => set("notify.telegram.chat_id", v)}
            placeholder="-100123456789"
            hint="ID чата, группы или канала. Для канала начинается с -100"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchChatId}
            disabled={fetchingChatId}
            className="text-xs gap-1.5"
          >
            {fetchingChatId ? "Определяю…" : "⚡ Определить Chat ID автоматически"}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5"><Bell className="w-4 h-4" /> Как настроить:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs leading-relaxed">
            <li>Создайте бота через <strong>@BotFather</strong> → скопируйте токен</li>
            <li>Добавьте бота в чат/канал с правами администратора</li>
            <li>Напишите боту любое сообщение, затем нажмите «Определить Chat ID автоматически»</li>
            <li>Нажмите «Отправить тест» для проверки</li>
          </ol>
        </div>

        <TestButton status={tgStatus} onClick={sendTgTest} disabled={isPending} label="Отправить тест в Telegram" />
      </div>

      {/* ── Email ──────────────────────────────────────────── */}
      <div className="space-y-5">
        <SectionHeader
          icon={Mail as any}
          title="Email-уведомления"
          description="Отправка HTML-письма на несколько адресов при каждой новой заявке."
        />

        <Toggle
          enabled={s("notify.email.enabled") === "1"}
          onToggle={() => set("notify.email.enabled", s("notify.email.enabled") === "1" ? "" : "1")}
          label="Включить Email-уведомления"
          hint="Отправлять письмо с деталями заявки на указанные адреса"
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="SMTP-сервер"
            value={s("notify.email.smtp_host")}
            onChange={v => set("notify.email.smtp_host", v)}
            placeholder="smtp.yandex.ru"
          />
          <div className="space-y-1.5">
            <Label className="text-slate-700 font-medium">Порт</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={s("notify.email.smtp_port") || "587"}
                onChange={e => set("notify.email.smtp_port", e.target.value)}
                placeholder="587"
                className="w-24 flex-shrink-0"
              />
              <button
                type="button"
                onClick={() => set("notify.email.smtp_secure", s("notify.email.smtp_secure") === "1" ? "" : "1")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg border transition-colors px-3 ${
                  s("notify.email.smtp_secure") === "1"
                    ? "bg-green-50 border-green-300 text-green-700 font-medium"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                SSL/TLS
              </button>
            </div>
            <p className="text-xs text-slate-400">587 — STARTTLS, 465 — SSL/TLS</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Логин (SMTP)"
            value={s("notify.email.smtp_user")}
            onChange={v => set("notify.email.smtp_user", v)}
            placeholder="noreply@razrabotka-agr.ru"
          />
          <Field
            label="Пароль (SMTP)"
            value={s("notify.email.smtp_pass")}
            onChange={v => set("notify.email.smtp_pass", v)}
            type="password"
            placeholder="••••••••"
          />
        </div>

        <Field
          label="Имя и адрес отправителя (From)"
          value={s("notify.email.from")}
          onChange={v => set("notify.email.from", v)}
          placeholder='МосАГРПроект <noreply@razrabotka-agr.ru>'
          hint='Формат: Название <email@example.ru> или просто email@example.ru'
        />

        {/* Recipients */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium">Получатели</Label>
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipients.map(email => (
                <span key={email} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full">
                  {email}
                  <button type="button" onClick={() => removeRecipient(email)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="email"
              value={recipientInput}
              onChange={e => setRecipientInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }}
              placeholder="manager@company.ru"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addRecipient} className="gap-1.5 border-slate-200 flex-shrink-0">
              <Plus className="w-4 h-4" /> Добавить
            </Button>
          </div>
          <p className="text-xs text-slate-400">Нажмите Enter или кнопку «Добавить». Можно указать несколько адресов.</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Популярные SMTP-серверы:</p>
          <ul className="space-y-0.5 text-amber-700">
            <li><strong>Яндекс Почта:</strong> smtp.yandex.ru, порт 587 (или 465 + SSL)</li>
            <li><strong>Mail.ru:</strong> smtp.mail.ru, порт 587</li>
            <li><strong>Gmail:</strong> smtp.gmail.com, порт 587 (нужен App Password)</li>
          </ul>
        </div>

        <TestButton status={emailStatus} onClick={sendEmailTest} disabled={isPending} label="Отправить тестовое письмо" />
      </div>

    </div>
  );
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("company");
  const [local, setLocal] = useState<Settings>({});
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();

  // Password change state
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => adminFetch<Settings>("/admin/settings"),
  });

  useEffect(() => {
    if (settings) setLocal({ ...settings });
  }, [settings]);

  const set = (key: string, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => adminFetch("/admin/settings", { method: "PUT", body: JSON.stringify(local), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/settings"] });
      setDirty(false);
      toast({ title: "Настройки сохранены", description: "Изменения применены на сайте." });
    },
    onError: () => toast({ title: "Ошибка", description: "Не удалось сохранить настройки.", variant: "destructive" }),
  });

  const { mutate: changePassword, isPending: isPwPending } = useMutation({
    mutationFn: () => adminFetch("/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      headers: { "Content-Type": "application/json" },
    }),
    onSuccess: () => {
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 4000);
      toast({ title: "Пароль изменён", description: "Новый пароль вступил в силу." });
    },
    onError: (err: Error) => {
      let msg = "Не удалось изменить пароль.";
      try { msg = (JSON.parse(err.message) as { error: string }).error || msg; } catch { msg = err.message || msg; }
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    },
  });

  const pwValid = pwNew.length >= 6 && pwNew === pwConfirm && pwCurrent.length > 0;

  const s = (key: string) => local[key] ?? "";

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Настройки сайта</h2>
          <p className="text-slate-500 text-sm mt-1">Управляйте содержимым и параметрами сайта</p>
        </div>
        <Button
          onClick={() => save()}
          disabled={!dirty || isPending}
          className="gap-2 bg-accent hover:bg-accent/90"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Сохраняю..." : "Сохранить"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

        {/* Company */}
        {activeTab === "company" && (
          <div className="space-y-6 max-w-xl">
            <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Контакты компании</h3>
            <Field label="Телефон" value={s("company.phone")} onChange={v => set("company.phone", v)} placeholder="+7 (495) 000-00-00" />
            <Field label="Email" value={s("company.email")} onChange={v => set("company.email", v)} placeholder="info@example.ru" type="email" />
            <Field label="Адрес" value={s("company.address")} onChange={v => set("company.address", v)} placeholder="Москва, ул. Примерная, д. 1" />
            <Field label="Режим работы" value={s("company.hours")} onChange={v => set("company.hours", v)} placeholder="Пн–Пт: 9:00–18:00" />

            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="w-4 h-4 text-slate-500" />
                <h3 className="font-display font-bold text-lg text-slate-800">Смена пароля</h3>
              </div>

              {pwSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium mb-4">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Пароль успешно изменён
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-medium">Текущий пароль</Label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={pwCurrent}
                      onChange={e => setPwCurrent(e.target.value)}
                      placeholder="Введите текущий пароль"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-medium">Новый пароль</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={pwNew}
                      onChange={e => setPwNew(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-medium">Повторите новый пароль</Label>
                  <Input
                    type="password"
                    value={pwConfirm}
                    onChange={e => setPwConfirm(e.target.value)}
                    placeholder="Повторите новый пароль"
                  />
                  {pwConfirm && pwNew !== pwConfirm && (
                    <p className="text-xs text-red-500">Пароли не совпадают</p>
                  )}
                </div>
                <Button
                  onClick={() => changePassword()}
                  disabled={!pwValid || isPwPending}
                  className="gap-2 bg-slate-800 hover:bg-slate-700 w-fit"
                >
                  <KeyRound className="w-4 h-4" />
                  {isPwPending ? "Сохраняю..." : "Изменить пароль"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Homepage */}
        {activeTab === "homepage" && (
          <div className="space-y-8 max-w-2xl">
            <div className="space-y-5">
              <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Герой-секция</h3>
              <Field label="Бейдж (строка над заголовком)" value={s("hero.badge")} onChange={v => set("hero.badge", v)} placeholder="Профессиональное проектирование в Москве" />
              <Field label="Заголовок" value={s("hero.title")} onChange={v => set("hero.title", v)} placeholder="Разработка и согласование Буклета АГР" />
              <Field label="Подзаголовок / описание" value={s("hero.subtitle")} onChange={v => set("hero.subtitle", v)} type="textarea" placeholder="Подготовим Архитектурно-градостроительный облик..." />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Кнопка 1 (основная)" value={s("hero.cta1")} onChange={v => set("hero.cta1", v)} placeholder="Оставить заявку" />
                <Field label="Кнопка 2 (дополнительная)" value={s("hero.cta2")} onChange={v => set("hero.cta2", v)} placeholder="Смотреть услуги" />
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Блок статистики</h3>
              <p className="text-sm text-slate-500">Цифры в тёмной полосе под героем (4 счётчика)</p>
              <div className="grid grid-cols-2 gap-6">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="space-y-3 p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Счётчик {i + 1}</p>
                    <Field label="Значение" value={s(`stats.${i}.value`)} onChange={v => set(`stats.${i}.value`, v)} placeholder="95%" />
                    <Field label="Подпись" value={s(`stats.${i}.label`)} onChange={v => set(`stats.${i}.label`, v)} placeholder="проектов с первого раза" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Banner */}
        {activeTab === "banner" && (
          <div className="space-y-6 max-w-xl">
            <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Анонс-баннер</h3>
            <p className="text-sm text-slate-500">Баннер отображается поверх сайта с важным объявлением.</p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => set("banner.enabled", s("banner.enabled") === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${s("banner.enabled") === "true" ? "bg-accent" : "bg-slate-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${s("banner.enabled") === "true" ? "translate-x-7" : "translate-x-1"}`} />
              </button>
              <Label>{s("banner.enabled") === "true" ? "Баннер активен" : "Баннер скрыт"}</Label>
            </div>

            <Field
              label="Текст баннера"
              value={s("banner.text")}
              onChange={v => set("banner.text", v)}
              type="textarea"
              placeholder="⚡ Важная информация для посетителей сайта"
            />
            <Field
              label="Ссылка (необязательно)"
              value={s("banner.url")}
              onChange={v => set("banner.url", v)}
              placeholder="https://example.ru/page"
              hint="Если заполнено — весь баннер станет кликабельным"
            />
            <div className="space-y-1.5">
              <Label>Цвет баннера</Label>
              <div className="flex gap-3">
                {[
                  { value: "primary", label: "Синий", bg: "bg-primary" },
                  { value: "amber", label: "Жёлтый", bg: "bg-amber-500" },
                  { value: "red", label: "Красный", bg: "bg-red-600" },
                  { value: "green", label: "Зелёный", bg: "bg-green-600" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set("banner.color", opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      s("banner.color") === opt.value ? "border-slate-900 scale-105" : "border-transparent"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${opt.bg}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {s("banner.enabled") === "true" && !s("banner.text").trim() && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm font-medium">
                ⚠️ Баннер включён, но текст не заполнен — он не будет отображаться на сайте. Введите текст ниже.
              </div>
            )}

            {s("banner.enabled") === "true" && s("banner.text").trim() && (
              <div className={`rounded-xl p-4 text-white text-sm font-medium ${
                s("banner.color") === "amber" ? "bg-amber-500" :
                s("banner.color") === "red" ? "bg-red-600" :
                s("banner.color") === "green" ? "bg-green-600" : "bg-primary"
              }`}>
                Предпросмотр: {s("banner.text")}
              </div>
            )}
          </div>
        )}

        {/* SEO */}
        {activeTab === "seo" && (
          <div className="space-y-6 max-w-xl">
            <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">SEO по умолчанию</h3>
            <p className="text-sm text-slate-500">Используются как запасные значения, если страница не задаёт свои meta-теги.</p>
            <Field
              label="Описание сайта (meta description)"
              value={s("seo.description")}
              onChange={v => set("seo.description", v)}
              type="textarea"
              placeholder="МосАГРПроект — профессиональная разработка буклета АГР..."
            />
            <Field
              label="Ключевые слова (meta keywords)"
              value={s("seo.keywords")}
              onChange={v => set("seo.keywords", v)}
              type="textarea"
              placeholder="буклет АГР, Москомархитектура, разработка АГР Москва"
              hint="Через запятую"
            />
          </div>
        )}

        {/* Social networks */}
        {activeTab === "social" && (
          <div className="space-y-6 max-w-xl">
            <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Социальные сети</h3>
            <p className="text-sm text-slate-500">Заполненные поля будут показаны в виде иконок в футере сайта.</p>
            <Field
              label="ВКонтакте"
              value={s("social.vk")}
              onChange={v => set("social.vk", v)}
              placeholder="https://vk.com/yourpage"
              hint="Ссылка на страницу или группу ВКонтакте"
            />
            <Field
              label="Telegram"
              value={s("social.telegram")}
              onChange={v => set("social.telegram", v)}
              placeholder="https://t.me/yourchannel"
              hint="Ссылка на канал или бота в Telegram"
            />
            <Field
              label="MAX (бывший Mail.ru)"
              value={s("social.max")}
              onChange={v => set("social.max", v)}
              placeholder="https://max.ru/yourpage"
              hint="Ссылка на страницу в MAX"
            />
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <NotificationsTab s={s} set={set} save={save} isPending={isPending} local={local} />
        )}
      </div>

      {dirty && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <p className="text-sm text-amber-700 font-medium">Есть несохранённые изменения</p>
          <Button onClick={() => save()} disabled={isPending} size="sm" className="gap-1 bg-amber-600 hover:bg-amber-700">
            <Save className="w-3.5 h-3.5" /> Сохранить
          </Button>
        </div>
      )}

    </div>
  );
}
