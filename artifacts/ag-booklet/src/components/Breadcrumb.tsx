import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const all = [{ name: "Главная", path: "/" }, ...items];

  return (
    <nav
      aria-label="Навигационная цепочка"
      className="w-full bg-slate-50 border-b border-slate-100"
      itemScope
      itemType="https://schema.org/BreadcrumbList"
    >
      <ol className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-1 py-2.5 text-sm">
        {all.map((item, i) => {
          const isLast = i === all.length - 1;
          return (
            <li
              key={i}
              className="flex items-center gap-1"
              itemScope
              itemProp="itemListElement"
              itemType="https://schema.org/ListItem"
            >
              {i > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  className="text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path!}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
                  itemProp="item"
                >
                  {i === 0 && <Home className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(i + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
