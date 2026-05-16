import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useDownload } from "@/original/contexts/DownloadContext";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import { useOfflineDownload } from "@/original/hooks/useOfflineDownload";
import { useToast } from "@/original/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Progress } from "@/original/components/ui/progress";
import { Badge } from "@/original/components/ui/badge";
import { Separator } from "@/original/components/ui/separator";
import { Alert, AlertDescription } from "@/original/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/original/components/ui/alert-dialog";
import {
  getOfflinePackMeta,
  updatePackMetaCounts,
  clearOfflinePackMeta,
  OfflinePackMeta,
  clearAllCaches as clearMemoryCaches,
} from "@/original/lib/store/dataStore";
import { clearAllData as clearIndexedDB } from "@/original/lib/db";
import {
  Download,
  RefreshCw,
  Trash2,
  CheckCircle2,
  WifiOff,
  Loader2,
  HardDrive,
  Database,
  Image,
  Volume2,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface OfflinePackSectionProps {
  onComplete?: () => void;
}

export function OfflinePackSection({ onComplete }: OfflinePackSectionProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const { setProgress, setLastSyncTime } = useDownload();
  const {
    isDownloading,
    downloadAllData,
    clearAllOfflineData,
    getLastDownloadDate,
    getCachedImagesCount,
    getCachedSoundsCount,
  } = useOfflineDownload();

  const [packMeta, setPackMeta] = useState<OfflinePackMeta | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cachedImages, setCachedImages] = useState(0);
  const [cachedSounds, setCachedSounds] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<"tables" | "images" | "sounds" | null>(null);
  const [currentPhaseName, setCurrentPhaseName] = useState("");
  const [phaseProgress, setPhaseProgress] = useState({ done: 0, total: 0 });

  // Load pack metadata
  const refreshMeta = useCallback(async () => {
    await updatePackMetaCounts();
    setPackMeta(getOfflinePackMeta());
    setCachedImages(await getCachedImagesCount());
    setCachedSounds(await getCachedSoundsCount());
  }, [getCachedImagesCount, getCachedSoundsCount]);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  const isPackInstalled = packMeta?.installed ?? false;
  const lastDownload = getLastDownloadDate();

  // Handle download/update
  const handleDownload = async () => {
    if (!isOnline) {
      toast({
        title: language === "ar" ? "غير متصل" : "Offline",
        description:
          language === "ar" ? "يجب الاتصال بالإنترنت للتحميل" : "You must be online to download",
        variant: "destructive",
      });
      return;
    }

    setOverallProgress(0);
    setCurrentPhase("tables");

    const success = await downloadAllData((progress) => {
      setOverallProgress(progress.overallPercentage);
      setCurrentPhase(progress.currentPhase as "tables" | "images" | "sounds");
      setCurrentPhaseName(language === "ar" ? progress.phaseNameAr : progress.phaseName);
      setPhaseProgress({
        done: progress.currentItemDone,
        total: progress.currentItemTotal,
      });

      // Also update global context
      setProgress({
        isActive: true,
        section: language === "ar" ? progress.phaseNameAr : progress.phaseName,
        done: progress.currentItemDone,
        total: progress.currentItemTotal,
      });
    });

    setProgress({ isActive: false, section: "", done: 0, total: 0 });
    setCurrentPhase(null);

    if (success) {
      setLastSyncTime(new Date());
      await refreshMeta();
      toast({
        title: language === "ar" ? "اكتمل التحميل!" : "Download Complete!",
        description:
          language === "ar" ? "التطبيق جاهز للاستخدام بدون اتصال" : "App is ready for offline use",
      });
      onComplete?.();
    } else {
      toast({
        title: language === "ar" ? "فشل التحميل" : "Download Failed",
        description:
          language === "ar"
            ? "حدث خطأ أثناء التحميل. حاول مرة أخرى."
            : "An error occurred during download. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);

    try {
      await clearAllOfflineData();
      await clearIndexedDB();
      clearOfflinePackMeta();
      clearMemoryCaches();
      await refreshMeta();

      toast({
        title: language === "ar" ? "تم الحذف" : "Deleted",
        description:
          language === "ar" ? "تم حذف جميع البيانات المحلية" : "All offline data has been deleted",
      });
    } catch (err) {
      toast({
        title: language === "ar" ? "فشل الحذف" : "Delete Failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format last download date
  const formatLastDownload = () => {
    if (!lastDownload) return null;

    const now = new Date();
    const diff = now.getTime() - lastDownload.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (language === "ar") {
      if (hours < 1) return "قبل أقل من ساعة";
      if (hours < 24) return `قبل ${hours} ساعة`;
      return `قبل ${days} يوم`;
    } else {
      if (hours < 1) return "less than an hour ago";
      if (hours < 24) return `${hours} hours ago`;
      return `${days} days ago`;
    }
  };

  // Total data count
  const totalDataCount = packMeta?.datasetCounts
    ? Object.values(packMeta.datasetCounts).reduce((sum, n) => sum + n, 0)
    : 0;

  // Phase icon
  const getPhaseIcon = () => {
    switch (currentPhase) {
      case "tables":
        return <Database className="w-4 h-4" />;
      case "images":
        return <Image className="w-4 h-4" />;
      case "sounds":
        return <Volume2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${isPackInstalled ? "bg-green-500/20" : "bg-primary/20"}`}
            >
              <HardDrive
                className={`w-6 h-6 ${isPackInstalled ? "text-green-500" : "text-primary"}`}
              />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === "ar" ? "حزمة الوضع دون اتصال" : "Offline Pack"}
              </CardTitle>
              <CardDescription>
                {isPackInstalled
                  ? language === "ar"
                    ? "التطبيق جاهز للعمل بدون اتصال"
                    : "App is ready for offline use"
                  : language === "ar"
                    ? "حمّل البيانات للاستخدام بدون إنترنت"
                    : "Download data for offline use"}
              </CardDescription>
            </div>
          </div>

          {isPackInstalled && (
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/30 gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {language === "ar" ? "مثبت" : "Installed"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status when installed */}
        {isPackInstalled && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Database className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{totalDataCount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "ar" ? "سجل" : "records"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Image className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{cachedImages.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "ar" ? "صورة" : "images"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{cachedSounds.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "ar" ? "صوت" : "sounds"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-xs">{formatLastDownload() || "-"}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "ar" ? "آخر تحديث" : "last update"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download progress */}
        {isDownloading && currentPhase && (
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium">
                {getPhaseIcon()}
                <span>{currentPhaseName}</span>
              </div>
              <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>

            <Progress value={overallProgress} className="h-2" />

            {phaseProgress.total > 0 && (
              <div className="text-xs text-center text-muted-foreground">
                {phaseProgress.done.toLocaleString()} / {phaseProgress.total.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Offline warning */}
        {!isOnline && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {language === "ar"
                ? "أنت غير متصل. اتصل بالإنترنت للتحميل أو التحديث."
                : "You are offline. Connect to download or update."}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Download / Update button */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading || !isOnline}
            variant={isPackInstalled ? "outline" : "default"}
            className="flex-1 min-w-[140px] gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === "ar" ? "جارٍ التحميل..." : "Downloading..."}
              </>
            ) : isPackInstalled ? (
              <>
                <RefreshCw className="w-4 h-4" />
                {language === "ar" ? "تحديث الحزمة" : "Update Pack"}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {language === "ar" ? "تحميل الحزمة الكاملة" : "Download Full Pack"}
              </>
            )}
          </Button>

          {/* Delete button (only if installed) */}
          {isPackInstalled && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDownloading || isDeleting}
              variant="outline"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {language === "ar" ? "حذف البيانات" : "Delete Data"}
            </Button>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          {language === "ar"
            ? "تحميل الحزمة الكاملة يتيح لك استخدام التطبيق بدون اتصال بالإنترنت."
            : "Downloading the full pack enables complete offline usage of the app."}
        </p>
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {language === "ar" ? "حذف البيانات المحلية؟" : "Delete Local Data?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "سيتم حذف جميع البيانات المحفوظة والصور والأصوات. ستحتاج إلى إعادة التحميل للاستخدام بدون اتصال."
                : "All saved data, images, and sounds will be deleted. You will need to re-download for offline use."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
