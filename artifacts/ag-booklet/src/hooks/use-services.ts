import { useQuery } from "@tanstack/react-query";

export interface PublicService {
  id: number;
  title: string;
  price: string | null;
  description: string | null;
  highlighted: boolean;
  badge: string | null;
  sortOrder: number;
}

export function usePublicServices() {
  return useQuery<PublicService[]>({
    queryKey: ["/api/public/services"],
    queryFn: async () => {
      const res = await fetch("/api/public/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
