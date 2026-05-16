import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent } from "@/original/components/ui/card";
import { Switch } from "@/original/components/ui/switch";
import { Progress } from "@/original/components/ui/progress";
import {
  exportAllData,
  exportToFile,
  importAllData,
  validateBackupFile,
  parseBackupFile,
  getBackupStats,
  getCachedImageCount,
  getCachedAudioCount,
  getFullExportStats,
  exportEverything,
  BackupData,
  FullExportStats,
  FullExportPhase,
  ImportOptions,
} from "@/original/lib/backupUtils";
import { Checkbox } from "@/original/components/ui/checkbox";
import {
  Download,
  Upload,
  Loader2,
  AlertCircle,
  FileJson,
  HardDrive,
  Calendar,
  Database,
  Image,
  Volume2,
  Archive,
  RefreshCw,
  Package,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { useToast } from "@/original/hooks/use-toast";
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

interface BackupRestoreSectionProps {
  onDataChanged?: () => void;
}

export function BackupRestoreSection({ onDataChanged }: BackupRestoreSectionProps) {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [compressBackup, setCompressBackup] = useState(true);
  const [cachedImageCount, setCachedImageCount] = useState(0);
  const [cachedAudioCount, setCachedAudioCount] = useState(0);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    phase: string;
  } | null>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    phase: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [importInfo, setImportInfo] = useState<{
    date: string;
    items: number;
    tables: string[];
    includesImages?: boolean;
    imageCount?: number;
    includesAudio?: boolean;
    audioCount?: number;
    tableBreakdown?: { name: string; count: number }[];
  } | null>(null);
  const [currentStats, setCurrentStats] = useState<{
    totalItems: number;
    tables: { name: string; count: number }[];
    imageCount?: number;
    audioCount?: number;
  } | null>(null);

  const [isRefreshingCounts, setIsRefreshingCounts] = useState(false);
  const [isFullExporting, setIsFullExporting] = useState(false);
  const [fullExportProgress, setFullExportProgress] = useState<{
    current: number;
    total: number;
    phase: string;
  } | null>(null);
  const [fullExportStats, setFullExportStats] = useState<FullExportStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Selective restore state
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [importImages, setImportImages] = useState(true);
  const [importAudio, setImportAudio] = useState(true);

  const refreshCacheCounts = async () => {
    setIsRefreshingCounts(true);
    try {
      const [imgCount, audioCount] = await Promise.all([
        getCachedImageCount(),
        getCachedAudioCount(),
      ]);
      setCachedImageCount(imgCount);
      setCachedAudioCount(audioCount);
    } finally {
      setIsRefreshingCounts(false);
    }
  };

  const loadFullExportStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await getFullExportStats();
      setFullExportStats(stats);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    refreshCacheCounts();
    loadFullExportStats();
  }, []);

  const tableLabels: Record<string, { en: string; ar: string }> = {
    pokemon: { en: "Pokémon", ar: "البوكيمونات" },
    moves: { en: "Moves", ar: "الحركات" },
    items: { en: "Items", ar: "الأدوات" },
    locations: { en: "Locations", ar: "المواقع" },
    encounters: { en: "Encounters", ar: "اللقاءات" },
    gyms: { en: "Gyms", ar: "الصالات" },
    gym_roster: { en: "Gym Roster", ar: "فرق الصالات" },
    npcs: { en: "NPCs", ar: "الشخصيات" },
    learnsets: { en: "Learnsets", ar: "الحركات المتعلمة" },
    evolution_nodes: { en: "Evolutions", ar: "التطورات" },
    games: { en: "Games", ar: "الألعاب" },
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(null);
    try {
      const stats = await getBackupStats();

      if (stats.totalItems === 0) {
        toast({
          title: t("No data to export", "لا توجد بيانات للتصدير"),
          description: t(
            "Download some data first before creating a backup.",
            "قم بتحميل بعض البيانات أولاً قبل إنشاء نسخة احتياطية.",
          ),
          variant: "destructive",
        });
        return;
      }

      // تحذير إذا كان المستخدم يريد تضمين الصور لكن لا توجد صور مخزنة
      if (includeImages && cachedImageCount === 0) {
        toast({
          title: t("No images to export", "لا توجد صور للتصدير"),
          description: t(
            "No cached images found. Download images first or disable the images option.",
            "لم يتم العثور على صور مخزنة. قم بتحميل الصور أولاً أو قم بإلغاء خيار الصور.",
          ),
          variant: "destructive",
        });
        return;
      }

      // تحذير إذا كان المستخدم يريد تضمين الأصوات لكن لا توجد أصوات مخزنة
      if (includeAudio && cachedAudioCount === 0) {
        toast({
          title: t("No audio to export", "لا توجد أصوات للتصدير"),
          description: t(
            "No cached audio found. Download audio first or disable the audio option.",
            "لم يتم العثور على أصوات مخزنة. قم بتحميل الأصوات أولاً أو قم بإلغاء خيار الأصوات.",
          ),
          variant: "destructive",
        });
        return;
      }

      const backup = await exportAllData(
        { includeImages, includeAudio },
        (current, total, phase) => {
          const phaseLabel =
            phase === "images"
              ? t("Exporting images...", "جارٍ تصدير الصور...")
              : t("Exporting audio...", "جارٍ تصدير الأصوات...");
          setExportProgress({ current, total, phase: phaseLabel });
        },
      );
      await exportToFile(backup, compressBackup);

      const extras: string[] = [];
      if (includeImages && backup.metadata.imageCount) {
        extras.push(
          t(`${backup.metadata.imageCount} images`, `${backup.metadata.imageCount} صورة`),
        );
      }
      if (includeAudio && backup.metadata.audioCount) {
        extras.push(
          t(`${backup.metadata.audioCount} audio files`, `${backup.metadata.audioCount} ملف صوتي`),
        );
      }
      const extrasMsg = extras.length > 0 ? ` (${extras.join(", ")})` : "";

      toast({
        title: t("Backup created!", "تم إنشاء النسخة الاحتياطية!"),
        description:
          t(
            `Exported ${backup.metadata.totalItems} items.`,
            `تم تصدير ${backup.metadata.totalItems} عنصر.`,
          ) + extrasMsg,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("Export failed", "فشل التصدير"),
        description: t("Could not create backup file.", "تعذر إنشاء ملف النسخة الاحتياطية."),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseBackupFile(file);
      const validation = validateBackupFile(data);

      if (!validation.valid) {
        toast({
          title: t("Invalid backup file", "ملف نسخة احتياطية غير صالح"),
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }

      // Get current stats to show comparison
      const stats = await getBackupStats();
      const [imgCount, audioCount] = await Promise.all([
        getCachedImageCount(),
        getCachedAudioCount(),
      ]);
      setCurrentStats({ ...stats, imageCount: imgCount, audioCount: audioCount });

      // Calculate table breakdown from backup
      const backupData = data as BackupData;
      const tableBreakdown = Object.entries(backupData.data).map(([name, items]) => ({
        name,
        count: Array.isArray(items) ? items.length : 0,
      }));

      // Set pending import and show confirmation
      setPendingImport(backupData);
      setImportInfo({
        date: new Date(validation.info!.exportDate).toLocaleDateString(
          language === "ar" ? "ar-SA" : "en-US",
          { year: "numeric", month: "long", day: "numeric" },
        ),
        items: validation.info!.totalItems,
        tables: validation.info!.tables,
        includesImages: validation.info!.includesImages,
        imageCount: validation.info!.imageCount,
        includesAudio: validation.info!.includesAudio,
        audioCount: validation.info!.audioCount,
        tableBreakdown,
      });

      // Initialize all tables as selected by default
      setSelectedTables(new Set(tableBreakdown.filter((t) => t.count > 0).map((t) => t.name)));
      setImportImages(!!validation.info!.includesImages && (validation.info!.imageCount || 0) > 0);
      setImportAudio(!!validation.info!.includesAudio && (validation.info!.audioCount || 0) > 0);

      setShowConfirmDialog(true);
    } catch (error) {
      console.error("File parse error:", error);
      toast({
        title: t("Invalid file", "ملف غير صالح"),
        description: t("Could not read the backup file.", "تعذرت قراءة ملف النسخة الاحتياطية."),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;

    setIsImporting(true);
    setShowConfirmDialog(false);
    setImportProgress(null);

    // Build import options based on selections
    const importOptions: ImportOptions = {
      selectedTables: Array.from(selectedTables),
      includeImages: importImages,
      includeAudio: importAudio,
    };

    try {
      const result = await importAllData(
        pendingImport,
        (current, total, phase) => {
          let phaseLabel = t("Importing data...", "جارٍ استيراد البيانات...");
          if (phase === "images") phaseLabel = t("Importing images...", "جارٍ استيراد الصور...");
          if (phase === "audio") phaseLabel = t("Importing audio...", "جارٍ استيراد الأصوات...");
          setImportProgress({ current, total, phase: phaseLabel });
        },
        importOptions,
      );

      if (result.success) {
        const extras: string[] = [];
        if (result.imagesImported > 0) {
          extras.push(t(`${result.imagesImported} images`, `${result.imagesImported} صورة`));
        }
        if (result.audioImported > 0) {
          extras.push(t(`${result.audioImported} audio files`, `${result.audioImported} ملف صوتي`));
        }
        const extrasMsg = extras.length > 0 ? ` (${extras.join(", ")})` : "";

        toast({
          title: t("Restore complete!", "اكتملت الاستعادة!"),
          description:
            t(`Imported ${result.imported} items`, `تم استيراد ${result.imported} عنصر`) +
            extrasMsg +
            t(" successfully.", " بنجاح."),
        });
        onDataChanged?.();
        getCachedImageCount().then(setCachedImageCount);
        getCachedAudioCount().then(setCachedAudioCount);
      } else {
        toast({
          title: t("Restore partially failed", "فشلت الاستعادة جزئياً"),
          description: t(
            `Imported ${result.imported} items with some errors.`,
            `تم استيراد ${result.imported} عنصر مع بعض الأخطاء.`,
          ),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: t("Restore failed", "فشلت الاستعادة"),
        description: t("Could not restore backup.", "تعذرت استعادة النسخة الاحتياطية."),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setPendingImport(null);
      setImportInfo(null);
      setImportProgress(null);
      setSelectedTables(new Set());
    }
  };

  const handleCancelImport = () => {
    setShowConfirmDialog(false);
    setPendingImport(null);
    setImportInfo(null);
  };

  const phaseLabels: Record<FullExportPhase, { en: string; ar: string }> = {
    data: { en: "Exporting database...", ar: "جارٍ تصدير قاعدة البيانات..." },
    "static-images": { en: "Exporting static images...", ar: "جارٍ تصدير الصور العادية..." },
    "animated-images": { en: "Exporting animated images...", ar: "جارٍ تصدير الصور المتحركة..." },
    audio: { en: "Exporting audio files...", ar: "جارٍ تصدير ملفات الصوت..." },
    compressing: { en: "Compressing...", ar: "جارٍ الضغط..." },
  };

  const handleFullExport = async () => {
    setIsFullExporting(true);
    setFullExportProgress(null);

    try {
      await exportEverything((current, total, phase) => {
        const label = phaseLabels[phase];
        setFullExportProgress({
          current,
          total,
          phase: language === "ar" ? label.ar : label.en,
        });
      });

      toast({
        title: t("Full backup created!", "تم إنشاء النسخة الاحتياطية الشاملة!"),
        description: t(
          "All data, images, and audio exported successfully.",
          "تم تصدير جميع البيانات والصور والأصوات بنجاح.",
        ),
      });
    } catch (error) {
      console.error("Full export error:", error);
      toast({
        title: t("Export failed", "فشل التصدير"),
        description: t("Could not create full backup.", "تعذر إنشاء النسخة الاحتياطية الشاملة."),
        variant: "destructive",
      });
    } finally {
      setIsFullExporting(false);
      setFullExportProgress(null);
    }
  };

  return (
    <>
      {/* Full Export Card - Primary Action */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 mb-4">
        <CardContent className="p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
            <Package className="w-5 h-5 text-primary" />
            {t("Complete Backup", "نسخة احتياطية شاملة")}
            <Sparkles className="w-4 h-4 text-primary" />
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            {t(
              "Export everything in one click: all database data, images (static & animated), and audio files.",
              "صدّر كل شيء بضغطة واحدة: جميع بيانات قاعدة البيانات، الصور (العادية والمتحركة)، وملفات الصوت.",
            )}
          </p>

          {/* Stats Preview */}
          {fullExportStats && !isLoadingStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-background/60 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-primary">
                  {fullExportStats.pokemon.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{t("Pokémon", "بوكيمون")}</div>
              </div>
              <div className="bg-background/60 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-primary">
                  {fullExportStats.moves.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{t("Moves", "حركات")}</div>
              </div>
              <div className="bg-background/60 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-primary">
                  {(fullExportStats.staticImages + fullExportStats.animatedImages).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{t("Images", "صور")}</div>
              </div>
              <div className="bg-background/60 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-primary">
                  {fullExportStats.audioFiles.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{t("Audio", "صوت")}</div>
              </div>
            </div>
          )}

          {isLoadingStats && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {/* Estimated Size */}
          {fullExportStats && fullExportStats.estimatedSizeMB > 0 && (
            <div className="text-xs text-muted-foreground mb-3 text-center">
              {t(
                `Estimated size: ~${fullExportStats.estimatedSizeMB} MB (compressed)`,
                `الحجم التقديري: ~${fullExportStats.estimatedSizeMB} ميجابايت (مضغوط)`,
              )}
            </div>
          )}

          {/* Full Export Progress */}
          {fullExportProgress && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fullExportProgress.phase}</span>
                <span>
                  {fullExportProgress.current} / {fullExportProgress.total}
                </span>
              </div>
              <Progress value={(fullExportProgress.current / fullExportProgress.total) * 100} />
            </div>
          )}

          <Button
            onClick={handleFullExport}
            disabled={
              isFullExporting || isExporting || isImporting || fullExportStats?.pokemon === 0
            }
            className="w-full gap-2 h-12 text-base"
            size="lg"
          >
            {isFullExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Package className="w-5 h-5" />
            )}
            {isFullExporting
              ? t("Exporting everything...", "جارٍ تصدير كل شيء...")
              : t("📦 Export Everything (A-Z)", "📦 تصدير كل شيء (من أ إلى ي)")}
          </Button>
        </CardContent>
      </Card>

      {/* Regular Backup Card */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
            <HardDrive className="w-4 h-4 text-primary" />
            {t("Custom Backup", "نسخة احتياطية مخصصة")}
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            {t(
              "Create a custom backup with selected options, or restore from an existing backup.",
              "أنشئ نسخة احتياطية مخصصة مع خيارات محددة، أو استعد من نسخة احتياطية موجودة.",
            )}
          </p>

          {/* Refresh Cache Counts Button */}
          <div className="flex items-center justify-end mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshCacheCounts}
              disabled={isRefreshingCounts}
              className="text-xs"
            >
              {isRefreshingCounts ? (
                <Loader2 className="w-3 h-3 animate-spin me-1" />
              ) : (
                <RefreshCw className="w-3 h-3 me-1" />
              )}
              {t("Refresh counts", "تحديث العدد")}
            </Button>
          </div>

          {/* Include Images Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t("Include cached images", "تضمين الصور المخزنة")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cachedImageCount > 0
                    ? t(`${cachedImageCount} images available`, `${cachedImageCount} صورة متاحة`)
                    : t(
                        "No images cached - download images first",
                        "لا توجد صور مخزنة - قم بتحميل الصور أولاً",
                      )}
                </p>
              </div>
            </div>
            <Switch checked={includeImages} onCheckedChange={setIncludeImages} />
          </div>

          {/* Include Audio Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t("Include cached audio", "تضمين الأصوات المخزنة")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cachedAudioCount > 0
                    ? t(
                        `${cachedAudioCount} audio files available`,
                        `${cachedAudioCount} ملف صوتي متاح`,
                      )
                    : t(
                        "No audio cached - download audio first",
                        "لا توجد أصوات مخزنة - قم بتحميل الأصوات أولاً",
                      )}
                </p>
              </div>
            </div>
            <Switch checked={includeAudio} onCheckedChange={setIncludeAudio} />
          </div>

          {/* Compress Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t("Compress backup", "ضغط النسخة الاحتياطية")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Reduces file size significantly", "يقلل حجم الملف بشكل كبير")}
                </p>
              </div>
            </div>
            <Switch checked={compressBackup} onCheckedChange={setCompressBackup} />
          </div>

          {(includeImages || includeAudio) && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t(
                  "⚠️ Including media files will increase the backup file size significantly. Compression is recommended.",
                  "⚠️ تضمين ملفات الوسائط سيزيد حجم ملف النسخة الاحتياطية بشكل ملحوظ. يُنصح بتفعيل الضغط.",
                )}
              </p>
            </div>
          )}

          {/* Export Progress */}
          {exportProgress && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{exportProgress.phase}</span>
                <span>
                  {exportProgress.current} / {exportProgress.total}
                </span>
              </div>
              <Progress value={(exportProgress.current / exportProgress.total) * 100} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting || isImporting}
              className="flex-1 gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting
                ? t("Exporting...", "جارٍ التصدير...")
                : t("Export Backup", "تصدير نسخة احتياطية")}
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || isExporting}
              className="flex-1 gap-2"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting
                ? t("Importing...", "جارٍ الاستيراد...")
                : t("Restore Backup", "استعادة نسخة احتياطية")}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.gz"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <FileJson className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                {t(
                  "Backup includes: Pokémon, Moves, Items, Locations, Encounters, Gyms, NPCs, Learnsets, Evolutions, and optionally cached images & audio.",
                  "النسخة الاحتياطية تشمل: البوكيمونات، الحركات، الأدوات، المواقع، اللقاءات، الصالات، الشخصيات، الحركات المتعلمة، التطورات، واختيارياً الصور والأصوات المخزنة.",
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog with Detailed Comparison */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg max-h-[90vh]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {t("Confirm Restore", "تأكيد الاستعادة")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t(
                    "This will replace all your current offline data with the backup.",
                    "سيؤدي هذا إلى استبدال جميع بياناتك الحالية بالنسخة الاحتياطية.",
                  )}
                </p>

                {importInfo && (
                  <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {t("Backup date:", "تاريخ النسخة:")} {importInfo.date}
                      </span>
                    </div>
                  </div>
                )}

                {/* Selective Restore - Detailed Comparison Table with Checkboxes */}
                {importInfo?.tableBreakdown && currentStats && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted px-3 py-2 text-xs font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all-tables"
                          checked={
                            selectedTables.size ===
                            importInfo.tableBreakdown.filter((t) => t.count > 0).length
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTables(
                                new Set(
                                  importInfo
                                    .tableBreakdown!.filter((t) => t.count > 0)
                                    .map((t) => t.name),
                                ),
                              );
                            } else {
                              setSelectedTables(new Set());
                            }
                          }}
                        />
                        <label htmlFor="select-all-tables" className="cursor-pointer">
                          {t("Select All Tables", "تحديد جميع الجداول")}
                        </label>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{t("Current", "الحالي")}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{t("Backup", "النسخة")}</span>
                      </div>
                    </div>
                    <ScrollArea className="max-h-48">
                      <div className="divide-y divide-border">
                        {importInfo.tableBreakdown.map((backupTable) => {
                          const currentTable = currentStats.tables.find(
                            (t) => t.name === backupTable.name,
                          );
                          const currentCount = currentTable?.count || 0;
                          const backupCount = backupTable.count;
                          const diff = backupCount - currentCount;
                          const label = tableLabels[backupTable.name] || {
                            en: backupTable.name,
                            ar: backupTable.name,
                          };
                          const isSelected = selectedTables.has(backupTable.name);
                          const hasData = backupCount > 0;

                          return (
                            <div
                              key={backupTable.name}
                              className={`px-3 py-2 flex items-center justify-between text-sm ${
                                isSelected ? "bg-primary/5" : ""
                              } ${!hasData ? "opacity-50" : ""}`}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`table-${backupTable.name}`}
                                  checked={isSelected}
                                  disabled={!hasData}
                                  onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedTables);
                                    if (checked) {
                                      newSelected.add(backupTable.name);
                                    } else {
                                      newSelected.delete(backupTable.name);
                                    }
                                    setSelectedTables(newSelected);
                                  }}
                                />
                                <label
                                  htmlFor={`table-${backupTable.name}`}
                                  className={`cursor-pointer ${isSelected ? "text-foreground font-medium" : "text-muted-foreground"}`}
                                >
                                  {language === "ar" ? label.ar : label.en}
                                </label>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground w-12 text-end">
                                  {currentCount.toLocaleString()}
                                </span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-foreground w-12 text-end font-medium">
                                  {backupCount.toLocaleString()}
                                </span>
                                <span
                                  className={`w-16 text-end text-xs flex items-center justify-end gap-1 ${
                                    diff > 0
                                      ? "text-green-600"
                                      : diff < 0
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {diff > 0 ? (
                                    <>
                                      <TrendingUp className="w-3 h-3" />+{diff}
                                    </>
                                  ) : diff < 0 ? (
                                    <>
                                      <TrendingDown className="w-3 h-3" />
                                      {diff}
                                    </>
                                  ) : (
                                    <>
                                      <Minus className="w-3 h-3" />0
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Images comparison with checkbox */}
                        {importInfo.imageCount && importInfo.imageCount > 0 && (
                          <div
                            className={`px-3 py-2 flex items-center justify-between text-sm ${importImages ? "bg-primary/5" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="import-images"
                                checked={importImages}
                                onCheckedChange={(checked) => setImportImages(!!checked)}
                              />
                              <label
                                htmlFor="import-images"
                                className="cursor-pointer flex items-center gap-2"
                              >
                                <Image className="w-3 h-3 text-primary" />
                                {t("Images", "الصور")}
                              </label>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground w-12 text-end">
                                {(currentStats.imageCount || 0).toLocaleString()}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground w-12 text-end font-medium">
                                {(importInfo.imageCount || 0).toLocaleString()}
                              </span>
                              {(() => {
                                const diff =
                                  (importInfo.imageCount || 0) - (currentStats.imageCount || 0);
                                return (
                                  <span
                                    className={`w-16 text-end text-xs flex items-center justify-end gap-1 ${
                                      diff > 0
                                        ? "text-green-600"
                                        : diff < 0
                                          ? "text-red-500"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {diff > 0 ? (
                                      <>
                                        <TrendingUp className="w-3 h-3" />+{diff}
                                      </>
                                    ) : diff < 0 ? (
                                      <>
                                        <TrendingDown className="w-3 h-3" />
                                        {diff}
                                      </>
                                    ) : (
                                      <>
                                        <Minus className="w-3 h-3" />0
                                      </>
                                    )}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Audio comparison with checkbox */}
                        {importInfo.audioCount && importInfo.audioCount > 0 && (
                          <div
                            className={`px-3 py-2 flex items-center justify-between text-sm ${importAudio ? "bg-primary/5" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="import-audio"
                                checked={importAudio}
                                onCheckedChange={(checked) => setImportAudio(!!checked)}
                              />
                              <label
                                htmlFor="import-audio"
                                className="cursor-pointer flex items-center gap-2"
                              >
                                <Volume2 className="w-3 h-3 text-primary" />
                                {t("Audio", "الصوت")}
                              </label>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground w-12 text-end">
                                {(currentStats.audioCount || 0).toLocaleString()}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground w-12 text-end font-medium">
                                {(importInfo.audioCount || 0).toLocaleString()}
                              </span>
                              {(() => {
                                const diff =
                                  (importInfo.audioCount || 0) - (currentStats.audioCount || 0);
                                return (
                                  <span
                                    className={`w-16 text-end text-xs flex items-center justify-end gap-1 ${
                                      diff > 0
                                        ? "text-green-600"
                                        : diff < 0
                                          ? "text-red-500"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {diff > 0 ? (
                                      <>
                                        <TrendingUp className="w-3 h-3" />+{diff}
                                      </>
                                    ) : diff < 0 ? (
                                      <>
                                        <TrendingDown className="w-3 h-3" />
                                        {diff}
                                      </>
                                    ) : (
                                      <>
                                        <Minus className="w-3 h-3" />0
                                      </>
                                    )}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Summary - Selected items only */}
                    <div className="bg-muted px-3 py-2 text-xs flex items-center justify-between border-t border-border">
                      <span className="font-medium">
                        {t("Selected to restore", "المحدد للاستعادة")}
                      </span>
                      <span className="text-primary font-medium">
                        {selectedTables.size} {t("tables", "جداول")}
                        {importImages && importInfo.imageCount ? ` + ${t("images", "صور")}` : ""}
                        {importAudio && importInfo.audioCount ? ` + ${t("audio", "صوت")}` : ""}
                      </span>
                    </div>
                  </div>
                )}

                {selectedTables.size > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-sm text-amber-600 dark:text-amber-400">
                    {t(
                      `Warning: Data in the ${selectedTables.size} selected tables will be replaced with backup data.`,
                      `تحذير: سيتم استبدال البيانات في الجداول المحددة (${selectedTables.size}) ببيانات النسخة الاحتياطية.`,
                    )}
                  </div>
                )}

                {selectedTables.size === 0 && !importImages && !importAudio && (
                  <div className="bg-destructive/10 p-3 rounded-lg text-sm text-destructive">
                    {t(
                      "Please select at least one table, images, or audio to restore.",
                      "يرجى تحديد جدول واحد على الأقل أو الصور أو الصوت للاستعادة.",
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelImport}>
              {t("Cancel", "إلغاء")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              disabled={selectedTables.size === 0 && !importImages && !importAudio}
            >
              {t("Restore Selected", "استعادة المحدد")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
