import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";

export interface OrderProposal {
  id: number;
  orderId?: number;
  clientName: string;
  clientEmail: string;
  companyName?: string;
  inn?: string;
  totalPrice: string;
  deadline: string;
  validDays: number;
  action: string;
  createdAt: string;
}

export interface OrderContract {
  id: number;
  orderId?: number;
  contractNumber: string;
  version: number;
  contractDate: string;
  clientName: string;
  companyName?: string;
  amount?: string;
  createdAt: string;
}

export function useOrderProposals(orderId: number) {
  return useQuery({
    queryKey: ["/api/admin/orders", orderId, "proposals"],
    queryFn: () => adminFetch<OrderProposal[]>(`/admin/orders/${orderId}/proposals`),
    enabled: orderId > 0,
  });
}

export function useOrderContracts(orderId: number) {
  return useQuery({
    queryKey: ["/api/admin/orders", orderId, "contracts"],
    queryFn: () => adminFetch<OrderContract[]>(`/admin/orders/${orderId}/contracts`),
    enabled: orderId > 0,
  });
}

export function downloadDoc(type: "proposals" | "contracts", id: number, _filename: string, forceExt?: "pdf" | "docx") {
  const token = localStorage.getItem("admin_token") ?? "";
  const ext = forceExt ?? (type === "contracts" ? "docx" : "pdf");
  // Navigate to GET URL — server responds with Content-Disposition: attachment → download
  window.location.href = `/api/admin/${type}/${id}/${ext}?token=${encodeURIComponent(token)}`;
}

/** @deprecated use downloadDoc */
export const downloadDocPdf = downloadDoc;

export interface AdminOrder {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  status: string;
  notes?: string;
  createdAt: string;
  inn?: string;
  companyName?: string;
  companyFullName?: string;
  companyKpp?: string;
  companyOgrn?: string;
  companyLegalAddress?: string;
  companyDirector?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyBankAccount?: string;
  companyBankName?: string;
  companyBik?: string;
  companyCorrAccount?: string;
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ["/api/admin/orders"],
    queryFn: () => adminFetch<AdminOrder[]>("/admin/orders"),
  });
}

export interface UpdateOrderPayload {
  id: number;
  status?: string;
  notes?: string;
  inn?: string;
  companyName?: string;
  companyFullName?: string;
  companyKpp?: string;
  companyOgrn?: string;
  companyLegalAddress?: string;
  companyDirector?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyBankAccount?: string;
  companyBankName?: string;
  companyBik?: string;
  companyCorrAccount?: string;
}

export function useAdminUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: UpdateOrderPayload) =>
      adminFetch<AdminOrder>(`/admin/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(rest),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
  });
}

export function useAdminDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/admin/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
  });
}
