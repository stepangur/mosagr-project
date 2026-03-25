import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";

interface AdminLoginResponse {
  ok: boolean;
  token: string;
}

export function useAdminLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      return res.json() as Promise<AdminLoginResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem("admin_token", data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      window.location.href = "/admin/dashboard";
    },
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await adminFetch("/admin/logout", { method: "POST" });
    },
    onSettled: () => {
      localStorage.removeItem("admin_token");
      queryClient.clear();
      window.location.href = "/admin/login";
    },
  });
}

export function useAdminMe() {
  const token = localStorage.getItem("admin_token");
  return useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: () => adminFetch<AdminLoginResponse>("/admin/me"),
    enabled: !!token,
    retry: false,
  });
}
