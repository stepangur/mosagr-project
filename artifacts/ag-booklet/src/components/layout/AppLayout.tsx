import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion } from "framer-motion";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { CookieConsent } from "@/components/CookieConsent";
import { BannerProvider, useBanner } from "@/contexts/BannerContext";

function AppLayoutInner({ children }: { children: ReactNode }) {
  const { bannerVisible } = useBanner();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed header: banner + navbar stacked */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex flex-col`}>
        <AnnouncementBanner />
        <Navbar />
      </div>

      {/* Push content below the fixed header */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className={`flex-grow flex flex-col ${bannerVisible ? "pt-[120px]" : "pt-20"} transition-[padding] duration-300`}
      >
        {children}
      </motion.main>

      <Footer />
      <CookieConsent />
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <BannerProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </BannerProvider>
  );
}
