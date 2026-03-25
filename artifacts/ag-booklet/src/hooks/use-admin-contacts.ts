import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";

export interface AdminContact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
}

export function useAdminContacts() {
  return useQuery({
    queryKey: ["/api/admin/contacts"],
    queryFn: () => adminFetch<AdminContact[]>("/admin/contacts"),
  });
}

export function useAdminDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/admin/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
    },
  });
}
