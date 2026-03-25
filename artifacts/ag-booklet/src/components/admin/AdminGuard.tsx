import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminMe } from "@/hooks/use-admin-auth";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("admin_token");
  const { data, isLoading, isError } = useAdminMe();

  useEffect(() => {
    if (!token || isError) {
      setLocation("/admin/login");
    }
  }, [token, isError, setLocation]);

  if (!token || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  if (data?.ok) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return null;
}
