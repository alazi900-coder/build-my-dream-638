import { useDownload } from "@/original/contexts/DownloadContext";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Progress } from "@/original/components/ui/progress";
import { Download, Database, Image, Volume2 } from "lucide-react";

export function DownloadProgressBar() {
  const { progress } = useDownload();
  const { t, language } = useLanguage();

  if (!progress.isActive) return null;

  const overall = progress.overallProgress;
  const overallPercentage = overall?.overallPercentage ?? 0;

  const getPhaseIcon = () => {
    if (!overall) return <Download className="w-4 h-4 text-primary animate-bounce" />;
    switch (overall.currentPhase) {
      case "tables":
        return <Database className="w-4 h-4 text-primary animate-pulse" />;
      case "images":
        return <Image className="w-4 h-4 text-primary animate-pulse" />;
      case "sounds":
        return <Volume2 className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <Download className="w-4 h-4 text-primary animate-bounce" />;
    }
  };

  const phaseName = overall
    ? language === "ar"
      ? overall.phaseNameAr
      : overall.phaseName
    : progress.section;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 space-y-3">
        {/* Header with phase info and percentage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">{getPhaseIcon()}</div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("Downloading", "جارٍ التحميل")} {phaseName}
              </p>
              {overall && (
                <p className="text-xs text-muted-foreground">
                  {t("Phase", "المرحلة")} {overall.completedPhases + 1}/{overall.totalPhases}
                </p>
              )}
            </div>
          </div>
          <span className="text-2xl font-bold text-primary tabular-nums">
            {Math.round(overallPercentage)}%
          </span>
        </div>

        {/* Overall progress bar */}
        <Progress value={overallPercentage} className="h-2.5" />

        {/* Current item details */}
        {overall && overall.currentItemTotal > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {overall.currentItemDone} / {overall.currentItemTotal} {t("items", "عنصر")}
            </span>
            <span className="text-primary/70">
              {Math.round((overall.currentItemDone / overall.currentItemTotal) * 100)}%{" "}
              {t("of phase", "من المرحلة")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
