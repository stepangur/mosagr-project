import { Link, useRoute } from "wouter";
import { LayoutDashboard, Users, Newspaper, FileCode2, LogOut, Building2, Briefcase, Settings, HelpCircle, Star, ScrollText, LucideIcon } from "lucide-react";
import { useAdminLogout } from "@/hooks/use-admin-auth";

const menuItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/admin/dashboard",  icon: LayoutDashboard, label: "Дашборд" },
  { href: "/admin/clients",    icon: Users,           label: "Клиенты" },
  { href: "/admin/contracts",  icon: ScrollText,      label: "Договора" },
  { href: "/admin/news",       icon: Newspaper,       label: "Новости" },
  { href: "/admin/templates",  icon: FileCode2,       label: "Шаблоны" },
  { href: "/admin/services",   icon: Briefcase,       label: "Услуги" },
  { href: "/admin/reviews",    icon: Star,            label: "Отзывы" },
  { href: "/admin/faq",        icon: HelpCircle,      label: "FAQ" },
  { href: "/admin/settings",   icon: Settings,        label: "Настройки сайта" },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  const [isActive] = useRoute(href + "/*?");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        isActive
          ? "bg-accent text-white shadow-lg shadow-accent/20"
          : "hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
      {label}
    </Link>
  );
}

export function AdminSidebar() {
  const logout = useAdminLogout();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-white group">
          <div className="bg-primary-foreground text-primary p-1.5 rounded-lg group-hover:bg-accent group-hover:text-white transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            МосАГР<span className="text-slate-400">Админ</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto admin-scrollbar">
        {menuItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
