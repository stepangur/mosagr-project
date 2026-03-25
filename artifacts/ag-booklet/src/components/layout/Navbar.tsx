import { Link, useRoute } from "wouter";
import { Building2, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrderModal } from "@/contexts/OrderModalContext";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/requirements", label: "Требования" },
  { href: "/templates", label: "Шаблоны" },
  { href: "/news", label: "Новости" },
  { href: "/services", label: "Услуги" },
  { href: "/contact", label: "Контакты" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { open } = useOrderModal();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`w-full transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-white p-2 rounded-xl group-hover:bg-accent transition-colors">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-primary">
            МосАГР<span className="text-accent">Проект</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const [isActive] = useRoute(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  isActive ? "text-accent font-semibold" : "text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => open()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            Заказать буклет
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl border-t md:hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setIsOpen(false); open(); }}
                className="p-3 text-center bg-primary text-white rounded-lg font-medium mt-2"
              >
                Заказать буклет
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
