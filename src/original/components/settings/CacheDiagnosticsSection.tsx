import { useState } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent } from "@/original/components/ui/card";
import { Progress } from "@/original/components/ui/progress";
import {
  diagnoseCaches,
  CacheDiagnostics,
  exportAnimatedImages,
  exportStaticImages,
  getAnimatedImageCount,
  getStaticImageCount,
  exportToFile,
} from "@/original/lib/backupUtils";
import {
  Search,
  Loader2,
  HardDrive,
  Image,
  Film,
  Volume2,
  Database,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/original/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/original/components/ui/collapsible";

export function CacheDiagnosticsSection() {
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<CacheDiagnostics | null>(null);
  const [expandedCaches, setExpandedCaches] = useState<Set<string>>(new Set());
  const [isExportingAnimated, setIsExportingAnimated] = useState(false);
  const [isExportingStatic, setIsExportingStatic] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [animatedCount, setAnimatedCount] = useState(0);
  const [staticCount, setStaticCount] = useState(0);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await diagnoseCaches();
      setDiagnostics(result);

      // Get separate counts
      const [animated, staticImg] = await Promise.all([
        getAnimatedImageCount(),
        getStaticImageCount(),
      ]);
      setAnimatedCount(animated);
      setStaticCount(staticImg);

      toast({
        title: t("Scan complete", "اكتمل الفحص"),
        description: t(
          `Found ${result.summary.totalImages} images and ${result.summary.audioFiles} audio files`,
          `تم العثور على ${result.summary.totalImages} صورة و ${result.summary.audioFiles} ملف صوتي`,
        ),
      });
    } catch (error) {
      console.error("Scan error:", error);
      toast({
        title: t("Scan failed", "فشل الفحص"),
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportAnimated = async () => {
    setIsExportingAnimated(true);
    setExportProgress(null);
    try {
      const images = await exportAnimatedImages((current, total) => {
        setExportProgress({ current, total });
      });

      const imageCount = Object.keys(images).length;

      if (imageCount === 0) {
        toast({
          title: t("No animated images", "لا توجد صور متحركة"),
          description: t(
            "No animated images found in cache",
            "لم يتم العثور على صور متحركة في الكاش",
          ),
          variant: "destructive",
        });
        return;
      }

      // Create a minimal backup with only animated images
      const backup = {
        version: "1.2",
        exportDate: new Date().toISOString(),
        appVersion: "1.2.0",
        data: {
          pokemon: [],
          moves: [],
          items: [],
          locations: [],
          encounters: [],
          gyms: [],
          gym_roster: [],
          npcs: [],
          learnsets: [],
          evolution_nodes: [],
          games: [],
        },
        images,
        metadata: {
          totalItems: 0,
          tables: [],
          includesImages: true,
          imageCount,
          type: "animated-images-only",
        },
      };

      await exportToFile(backup as any, true);

      toast({
        title: t("Export complete", "اكتمل التصدير"),
        description: t(
          `Exported ${imageCount} animated images`,
          `تم تصدير ${imageCount} صورة متحركة`,
        ),
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("Export failed", "فشل التصدير"),
        variant: "destructive",
      });
    } finally {
      setIsExportingAnimated(false);
      setExportProgress(null);
    }
  };

  const handleExportStatic = async () => {
    setIsExportingStatic(true);
    setExportProgress(null);
    try {
      const images = await exportStaticImages((current, total) => {
        setExportProgress({ current, total });
      });

      const imageCount = Object.keys(images).length;

      if (imageCount === 0) {
        toast({
          title: t("No static images", "لا توجد صور ثابتة"),
          description: t("No static images found in cache", "لم يتم العثور على صور ثابتة في الكاش"),
          variant: "destructive",
        });
        return;
      }

      const backup = {
        version: "1.2",
        exportDate: new Date().toISOString(),
        appVersion: "1.2.0",
        data: {
          pokemon: [],
          moves: [],
          items: [],
          locations: [],
          encounters: [],
          gyms: [],
          gym_roster: [],
          npcs: [],
          learnsets: [],
          evolution_nodes: [],
          games: [],
        },
        images,
        metadata: {
          totalItems: 0,
          tables: [],
          includesImages: true,
          imageCount,
          type: "static-images-only",
        },
      };

      await exportToFile(backup as any, true);

      toast({
        title: t("Export complete", "اكتمل التصدير"),
        description: t(`Exported ${imageCount} static images`, `تم تصدير ${imageCount} صورة ثابتة`),
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("Export failed", "فشل التصدير"),
        variant: "destructive",
      });
    } finally {
      setIsExportingStatic(false);
      setExportProgress(null);
    }
  };

  const toggleCacheExpand = (cacheName: string) => {
    setExpandedCaches((prev) => {
      const next = new Set(prev);
      if (next.has(cacheName)) {
        next.delete(cacheName);
      } else {
        next.add(cacheName);
      }
      return next;
    });
  };

  const handleClearCache = async (cacheName: string) => {
    try {
      await caches.delete(cacheName);
      toast({
        title: t("Cache cleared", "تم مسح الكاش"),
        description: t(`Cleared ${cacheName}`, `تم مسح ${cacheName}`),
      });
      // Re-scan after clearing
      handleScan();
    } catch (error) {
      toast({
        title: t("Failed to clear cache", "فشل مسح الكاش"),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <h2 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
          <Search className="w-4 h-4 text-primary" />
          {t("Cache Diagnostics", "تشخيص الكاش")}
        </h2>

        <p className="text-sm text-muted-foreground mb-4">
          {t(
            "Scan and analyze cached images and audio files to diagnose storage issues.",
            "فحص وتحليل الصور والأصوات المخزنة لتشخيص مشاكل التخزين.",
          )}
        </p>

        {/* Scan Button */}
        <Button onClick={handleScan} disabled={isScanning} className="w-full mb-4">
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin me-2" />
          ) : (
            <Search className="w-4 h-4 me-2" />
          )}
          {isScanning ? t("Scanning...", "جارٍ الفحص...") : t("Scan Caches", "فحص الكاش")}
        </Button>

        {/* Diagnostics Results */}
        {diagnostics && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Image className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{t("Static Images", "الصور الثابتة")}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{staticCount}</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Film className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{t("Animated", "متحركة")}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{animatedCount}</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{t("Audio", "أصوات")}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {diagnostics.summary.audioFiles}
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{t("Total Size", "الحجم الكلي")}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatSize(diagnostics.summary.totalSize)}
                </p>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                {t("Export Options", "خيارات التصدير")}
              </h3>

              {exportProgress && (
                <div className="mb-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("Exporting...", "جارٍ التصدير...")}</span>
                    <span>
                      {exportProgress.current} / {exportProgress.total}
                    </span>
                  </div>
                  <Progress value={(exportProgress.current / exportProgress.total) * 100} />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAnimated}
                  disabled={isExportingAnimated || isExportingStatic || animatedCount === 0}
                  className="flex-1"
                >
                  {isExportingAnimated ? (
                    <Loader2 className="w-4 h-4 animate-spin me-1" />
                  ) : (
                    <Film className="w-4 h-4 me-1" />
                  )}
                  {t("Animated Only", "المتحركة فقط")} ({animatedCount})
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportStatic}
                  disabled={isExportingAnimated || isExportingStatic || staticCount === 0}
                  className="flex-1"
                >
                  {isExportingStatic ? (
                    <Loader2 className="w-4 h-4 animate-spin me-1" />
                  ) : (
                    <Image className="w-4 h-4 me-1" />
                  )}
                  {t("Static Only", "الثابتة فقط")} ({staticCount})
                </Button>
              </div>
            </div>

            {/* Cache Details */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                {t("Cache Details", "تفاصيل الكاش")}
              </h3>

              {diagnostics.caches.map((cache) => (
                <Collapsible
                  key={cache.name}
                  open={expandedCaches.has(cache.name)}
                  onOpenChange={() => toggleCacheExpand(cache.name)}
                >
                  <div className="border border-border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{cache.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({cache.itemCount} {t("items", "عنصر")})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatSize(cache.estimatedSize)}
                          </span>
                          {expandedCaches.has(cache.name) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-3 border-t border-border space-y-2">
                        {cache.itemCount === 0 ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            {t("Cache is empty", "الكاش فارغ")}
                          </div>
                        ) : (
                          <>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {cache.items.slice(0, 20).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs p-2 bg-muted/30 rounded flex justify-between"
                                >
                                  <span className="truncate flex-1 me-2" dir="ltr">
                                    {item.url.split("/").pop()}
                                  </span>
                                  <span className="text-muted-foreground shrink-0">
                                    {item.size ? formatSize(item.size) : "-"}
                                  </span>
                                </div>
                              ))}
                              {cache.items.length > 20 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  {t(
                                    `...and ${cache.items.length - 20} more`,
                                    `...و ${cache.items.length - 20} عنصر آخر`,
                                  )}
                                </p>
                              )}
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleClearCache(cache.name)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4 me-1" />
                              {t("Clear This Cache", "مسح هذا الكاش")}
                            </Button>
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
