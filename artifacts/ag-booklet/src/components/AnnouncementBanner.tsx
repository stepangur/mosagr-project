import { X } from "lucide-react";
import { useBanner } from "@/contexts/BannerContext";

const colorMap: Record<string, string> = {
  primary: "bg-primary",
  amber: "bg-amber-500",
  red: "bg-red-600",
  green: "bg-green-600",
};

export function AnnouncementBanner() {
  const { bannerVisible, bannerText, bannerUrl, bannerColor, dismiss } = useBanner();

  if (!bannerVisible) return null;

  const bg = colorMap[bannerColor] ?? "bg-primary";

  const inner = (
    <div className={`${bg} text-white text-sm font-medium flex items-center justify-center gap-3 px-4 py-2.5 h-10`}>
      <span className="flex-1 text-center leading-snug">{bannerText}</span>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
        className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Закрыть"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (bannerUrl) {
    return (
      <a href={bannerUrl} target="_blank" rel="noopener noreferrer" className="block w-full cursor-pointer hover:opacity-95 transition-opacity">
        {inner}
      </a>
    );
  }

  return <div className="w-full">{inner}</div>;
}
