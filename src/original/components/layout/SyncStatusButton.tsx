import { useState } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useDownload } from "@/original/contexts/DownloadContext";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import { useOfflineDownload } from "@/original/hooks/useOfflineDownload";
import { Button } from "@/original/components/ui/button";
import { Progress } from "@/original/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/original/components/ui/popover";
import { RefreshCw, WifiOff, Check, Download, Clock, CloudDownload } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { toast } from "sonner";

export function SyncStatusButton() {
  const { t, language } = useLanguage();
  const { progress, lastSyncTime, setProgress, setLastSyncTime } = useDownload();
  const isOnline = useOnlineStatus();
  const [isOpen, setIsOpen] = useState(false);
  const { downloadAllData, isDownloading, getLastDownloadDate } = useOfflineDownload();

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return null;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return language === "ar" ? "الآن" : "Just now";
    } else if (diffMins < 60) {
      return language === "ar" ? `${diffMins} دقيقة` : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return language === "ar" ? `${diffHours} ساعة` : `${diffHours}h ago`;
    } else {
      return language === "ar" ? `${diffDays} يوم` : `${diffDays}d ago`;
    }
  };

  const handleDownloadAll = async () => {
    if (!isOnline) {
      toast.error(t("Cannot download while offline", "لا يمكن التحميل بدون اتصال"));
      return;
    }

    toast.info(t("Starting download...", "جارٍ بدء التحميل..."));

    const success = await downloadAllData((progressData) => {
      setProgress({
        isActive: true,
        section: progressData.phaseNameAr || progressData.phaseName,
        done: progressData.currentItemDone,
        total: progressData.currentItemTotal,
      });
    });

    if (success) {
      setProgress({ isActive: false, section: "", done: 0, total: 0 });
      setLastSyncTime(new Date());
      toast.success(
        t(
          "Download complete! App ready for offline use.",
          "اكتمل التحميل! التطبيق جاهز للاستخدام بدون اتصال.",
        ),
      );
    } else {
      setProgress({ isActive: false, section: "", done: 0, total: 0 });
      toast.error(t("Download failed", "فشل التحميل"));
    }
  };

  const getStatusIcon = () => {
    if (progress.isActive || isDownloading) {
      return <Download className="w-4 h-4 animate-pulse" />;
    }
    if (!isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    if (lastSyncTime || getLastDownloadDate()) {
      return <Check className="w-4 h-4" />;
    }
    return <RefreshCw className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (progress.isActive || isDownloading) return "text-blue-500";
    if (!isOnline) return "text-amber-500";
    if (lastSyncTime || getLastDownloadDate()) return "text-green-500";
    return "text-muted-foreground";
  };

  const effectiveLastSync = lastSyncTime || getLastDownloadDate();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 relative", getStatusColor())}
          aria-label={t("Sync status", "حالة المزامنة")}
        >
          {getStatusIcon()}
          {(progress.isActive || isDownloading) && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div
              className={cn("p-1.5 rounded-full", isOnline ? "bg-green-500/20" : "bg-amber-500/20")}
            >
              {isOnline ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <span className="text-sm font-medium">
              {isOnline ? t("Online", "متصل") : t("Offline", "غير متصل")}
            </span>
          </div>

          {/* Download Progress */}
          {(progress.isActive || isDownloading) && (
            <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("Downloading", "جارٍ التحميل")} {progress.section}
                </span>
                <span className="font-mono text-foreground">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <Progress
                value={progress.total > 0 ? (progress.done / progress.total) * 100 : 0}
                className="h-1.5"
              />
            </div>
          )}

          {/* Last Sync */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {effectiveLastSync
                ? `${t("Last sync:", "آخر مزامنة:")} ${formatRelativeTime(effectiveLastSync)}`
                : t("Never synced", "لم تتم المزامنة")}
            </span>
          </div>

          {/* Download Button */}
          {!progress.isActive && !isDownloading && isOnline && (
            <Button onClick={handleDownloadAll} className="w-full gap-2" size="sm">
              <CloudDownload className="w-4 h-4" />
              {effectiveLastSync
                ? t("Update offline data", "تحديث البيانات المحفوظة")
                : t("Download for offline use", "تحميل للاستخدام بدون اتصال")}
            </Button>
          )}

          {/* Offline hint */}
          {!isOnline && (
            <p className="text-[10px] text-amber-500/80 leading-relaxed">
              {t("Connect to internet to download data.", "اتصل بالإنترنت لتحميل البيانات.")}
            </p>
          )}

          {/* Success hint */}
          {effectiveLastSync && !progress.isActive && !isDownloading && (
            <p className="text-[10px] text-green-500/80 leading-relaxed">
              {t("✓ App ready for offline use", "✓ التطبيق جاهز للاستخدام بدون اتصال")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
