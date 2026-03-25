import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";

export interface AdminService {
  id: number;
  title: string;
  description: string;
  price: string;
  features: string;
  highlighted: boolean;
  badge?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export type AdminCreateServiceInput = Omit<AdminService, "id" | "createdAt">;

export function useAdminServices() {
  return useQuery({
    queryKey: ["/api/admin/services"],
    queryFn: () => adminFetch<AdminService[]>("/admin/services"),
  });
}

export function useAdminServiceById(id: number | null) {
  return useQuery({
    queryKey: ["/api/admin/services", id],
    queryFn: () => adminFetch<AdminService>(`/admin/services/${id}`),
    enabled: !!id,
  });
}

export function useAdminCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateServiceInput) =>
      adminFetch<AdminService>("/admin/services", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/services"] });
    },
  });
}

export function useAdminUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminCreateServiceInput }) =>
      adminFetch<AdminService>(`/admin/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/services"] });
    },
  });
}

export function useAdminDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/admin/services/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/services"] });
    },
  });
}
