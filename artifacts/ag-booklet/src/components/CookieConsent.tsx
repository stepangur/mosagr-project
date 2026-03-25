import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100]"
          role="dialog"
          aria-label="Уведомление об использовании файлов cookie"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm mb-1">
                  Мы используем файлы cookie
                </p>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Сайт использует cookie для корректной работы и анализа посещаемости.
                  Продолжая использование сайта, вы соглашаетесь с{" "}
                  <Link
                    href="/privacy"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Политикой конфиденциальности
                  </Link>{" "}
                  и обработкой данных в соответствии с&nbsp;152-ФЗ.
                </p>
              </div>
              <button
                onClick={decline}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 -mt-1 -mr-1"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 bg-primary text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-primary/90 transition-colors"
              >
                Принять все
              </button>
              <button
                onClick={decline}
                className="flex-1 bg-slate-100 text-slate-700 text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Отклонить
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
