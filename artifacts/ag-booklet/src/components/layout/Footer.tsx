import { Building2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

type Settings = Record<string, string>;

function VkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z"/>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function MaxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1000 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.785 0 375.947 171.001 375.947 381.604.707 207.346-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574Z" />
    </svg>
  );
}

export function Footer() {
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/public/settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const vk = settings?.["social.vk"] || "";
  const telegram = settings?.["social.telegram"] || "";
  const max = settings?.["social.max"] || "";
  const hasSocial = vk || telegram || max;

  return (
    <footer className="bg-primary text-primary-foreground py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-white/10 p-2 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                МосАГР<span className="text-accent">Проект</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 max-w-md mt-4">
              Профессиональная разработка и согласование Архитектурно-градостроительного облика (АГР) объектов капитального строительства в Москве.
            </p>
            {hasSocial && (
              <div className="flex items-center gap-3 mt-5">
                {vk && (
                  <a
                    href={vk}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="ВКонтакте"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <VkIcon className="w-4 h-4 text-white" />
                  </a>
                )}
                {telegram && (
                  <a
                    href={telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <TelegramIcon className="w-4 h-4 text-white" />
                  </a>
                )}
                {max && (
                  <a
                    href={max}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="MAX"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <MaxIcon className="w-4 h-4 text-white" />
                  </a>
                )}
              </div>
            )}
            <div className="mt-5">
              <iframe
                src="https://yandex.ru/sprav/widget/rating-badge/199357602152?type=rating"
                width="150"
                height="50"
                frameBorder="0"
                title="Рейтинг на Яндексе"
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-primary-foreground/70 hover:text-white transition-colors">Главная</Link></li>
              <li><Link href="/requirements" className="text-primary-foreground/70 hover:text-white transition-colors">Требования АГР</Link></li>
              <li><Link href="/templates" className="text-primary-foreground/70 hover:text-white transition-colors">Шаблоны</Link></li>
              <li><Link href="/news" className="text-primary-foreground/70 hover:text-white transition-colors">Новости</Link></li>
              <li><Link href="/services" className="text-primary-foreground/70 hover:text-white transition-colors">Стоимость услуг</Link></li>
              <li><Link href="/contact" className="text-primary-foreground/70 hover:text-white transition-colors">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Контакты</h3>
            <ul className="space-y-2 text-primary-foreground/70">
              <li>ул. Выборгская, д. 22, Москва, 125130</li>
              <li>+7 (495) 568-18-77</li>
              <li>office@razrabotka-agr.ru</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-primary-foreground/50 text-sm">
          <span>© {new Date().getFullYear()} МосАГРПроект. Все права защищены. Не является публичной офертой.</span>
          <Link href="/privacy" className="hover:text-white transition-colors underline underline-offset-2 whitespace-nowrap">
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  );
}
