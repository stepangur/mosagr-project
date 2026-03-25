import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";

export interface AdminTemplate {
  id: number;
  title: string;
  category: string;
  type: string;
  tag: string;
  tagColor: string;
  description: string;
  free: boolean;
  image?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

export type AdminCreateTemplateInput = Omit<AdminTemplate, "id" | "createdAt">;

export function useAdminTemplates() {
  return useQuery({
    queryKey: ["/api/admin/templates"],
    queryFn: () => adminFetch<AdminTemplate[]>("/admin/templates"),
  });
}

export function useAdminTemplateById(id: number | null) {
  return useQuery({
    queryKey: ["/api/admin/templates", id],
    queryFn: () => adminFetch<AdminTemplate>(`/admin/templates/${id}`),
    enabled: !!id,
  });
}

export function useAdminCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateTemplateInput) =>
      adminFetch<AdminTemplate>("/admin/templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
    },
  });
}

export function useAdminUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminCreateTemplateInput }) =>
      adminFetch<AdminTemplate>(`/admin/templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
    },
  });
}

export function useAdminDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/admin/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/templates"] });
    },
  });
}
