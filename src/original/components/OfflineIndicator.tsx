import { WifiOff, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { t, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setIsDismissed(false);
    } else {
      // Show "back online" briefly then hide
      if (isVisible) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, isVisible]);

  if (!isVisible && isOnline) return null;
  if (isDismissed) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-medium shadow-lg transition-all duration-300 animate-in slide-in-from-top",
        isOnline ? "bg-green-500/95 text-white" : "bg-amber-500/95 text-amber-950",
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
            <span>{t("Back online!", "عدت متصلاً!")}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>
              {language === "ar"
                ? "أنت غير متصل — جارٍ استخدام البيانات المخزنة"
                : "You're offline — using cached data"}
            </span>
          </>
        )}
      </div>

      {!isOnline && (
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-full hover:bg-amber-600/30 transition-colors"
          aria-label={t("Dismiss", "إغلاق")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
