import { useState } from "react";
import { Building2, Lock, Loader2 } from "lucide-react";
import { useAdminLogin } from "@/hooks/use-admin-auth";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const login = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      login.mutate(password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-black/5 p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-900">МосАГР Проект</h1>
          <p className="text-sm text-slate-500 mt-1">Панель администратора</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Пароль доступа
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                placeholder="Введите пароль..."
                required
              />
            </div>
            {login.isError && (
              <p className="text-sm text-rose-500 mt-2">Неверный пароль. Попробуйте еще раз.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {login.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Войти в систему"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
