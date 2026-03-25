const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  "/admin/dashboard":    { title: "Дашборд" },
  "/admin/clients":      { title: "Клиенты", subtitle: "Заявки и обращения" },
  "/admin/contracts":    { title: "Договора", subtitle: "Генерация договоров и управление шаблоном" },
  "/admin/news":         { title: "Новости и статьи" },
  "/admin/news/new":     { title: "Создание новости" },
  "/admin/templates":    { title: "Шаблоны и материалы" },
  "/admin/templates/new":{ title: "Добавление шаблона" },
  "/admin/services":     { title: "Услуги и тарифы" },
  "/admin/services/new": { title: "Создание услуги" },
  "/admin/reviews":      { title: "Отзывы клиентов" },
  "/admin/faq":          { title: "Частые вопросы" },
  "/admin/settings":     { title: "Настройки сайта" },
};

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({ title: titleProp, subtitle: subtitleProp }: AdminHeaderProps = {}) {
  const path = window.location.pathname;

  let title = titleProp ?? "Панель управления";
  let subtitle = subtitleProp;

  if (!titleProp) {
    for (const route of Object.keys(routeTitles)) {
      if (path === route || path.startsWith(route + "/edit")) {
        const match = routeTitles[route];
        title = path.includes("/edit") ? "Редактирование" : match.title;
        subtitle = subtitleProp ?? match.subtitle;
        break;
      }
    }
  }

  return (
    <header className="min-h-16 bg-white border-b border-slate-200 shadow-sm flex items-center px-8 py-3 sticky top-0 z-40">
      <div>
        <h1 className="font-display font-bold text-xl text-slate-800 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 leading-none">{subtitle}</p>
        )}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
          A
        </div>
      </div>
    </header>
  );
}
