import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";

export interface AdminNewsArticle {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  tagColor: string;
  image?: string;
  readTime: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

export type AdminCreateNewsInput = Omit<AdminNewsArticle, "id" | "createdAt" | "publishedAt">;

export function useAdminNews() {
  return useQuery({
    queryKey: ["/api/admin/news"],
    queryFn: () => adminFetch<AdminNewsArticle[]>("/admin/news"),
  });
}

export function useAdminNewsById(id: number | null) {
  return useQuery({
    queryKey: ["/api/admin/news", id],
    queryFn: () => adminFetch<AdminNewsArticle>(`/admin/news/${id}`),
    enabled: !!id,
  });
}

export function useAdminCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateNewsInput) =>
      adminFetch<AdminNewsArticle>("/admin/news", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
    },
  });
}

export function useAdminUpdateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminCreateNewsInput }) =>
      adminFetch<AdminNewsArticle>(`/admin/news/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
    },
  });
}

export function useAdminDeleteNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/admin/news/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
    },
  });
}
