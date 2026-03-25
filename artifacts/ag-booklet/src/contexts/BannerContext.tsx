import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

type Settings = Record<string, string>;

interface BannerContextValue {
  bannerVisible: boolean;
  bannerText: string;
  bannerUrl: string;
  bannerColor: string;
  dismiss: () => void;
}

const BannerContext = createContext<BannerContextValue>({
  bannerVisible: false,
  bannerText: "",
  bannerUrl: "",
  bannerColor: "primary",
  dismiss: () => {},
});

export function BannerProvider({ children }: { children: ReactNode }) {
  const [dismissed, setDismissed] = useState(false);

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/public/settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/settings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  // Re-show banner if settings change (e.g. new text published)
  useEffect(() => {
    if (settings?.["banner.text"]?.trim()) setDismissed(false);
  }, [settings?.["banner.text"]]);

  const enabled = settings?.["banner.enabled"] === "true";
  const text = settings?.["banner.text"]?.trim() ?? "";
  const bannerVisible = enabled && !!text && !dismissed;

  return (
    <BannerContext.Provider
      value={{
        bannerVisible,
        bannerText: text,
        bannerUrl: settings?.["banner.url"] ?? "",
        bannerColor: settings?.["banner.color"] ?? "primary",
        dismiss: () => setDismissed(true),
      }}
    >
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  return useContext(BannerContext);
}
