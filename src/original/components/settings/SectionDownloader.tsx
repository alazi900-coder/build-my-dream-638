import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useDownload } from "@/original/contexts/DownloadContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Progress } from "@/original/components/ui/progress";
import { Badge } from "@/original/components/ui/badge";
import {
  useOfflineDownload,
  SectionId,
  DOWNLOAD_SECTIONS,
} from "@/original/hooks/useOfflineDownload";
import { getStoreCount } from "@/original/lib/db";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import {
  Download,
  CheckCircle2,
  Loader2,
  WifiOff,
  RefreshCw,
  BookOpen,
  Zap,
  Package,
  Award,
  Map,
  Database,
  Wrench,
  Trash2,
  Volume2,
  Sparkles,
} from "lucide-react";
import {
  PokedexIcon,
  MovesIcon,
  ItemsIcon,
  GymIcon,
  MapIcon,
} from "@/original/components/icons/PokemonIcons";
import { useToast } from "@/original/hooks/use-toast";
import { getCachedAudioCount } from "@/original/lib/audioCache";

interface SectionConfig {
  id: SectionId;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  icon: React.ReactNode;
  color: string;
}

const SECTIONS_CONFIG: SectionConfig[] = [
  {
    id: "dex",
    labelEn: "Pokédex",
    labelAr: "الدليل",
    descEn: "All Pokémon data & sprites",
    descAr: "جميع بيانات وصور البوكيمونات",
    icon: <PokedexIcon className="w-5 h-5" />,
    color: "text-red-500",
  },
  {
    id: "moves",
    labelEn: "Moves",
    labelAr: "الحركات",
    descEn: "Move data & learnsets",
    descAr: "بيانات الحركات والتعلم",
    icon: <MovesIcon className="w-5 h-5" />,
    color: "text-yellow-500",
  },
  {
    id: "items",
    labelEn: "Items",
    labelAr: "الأدوات",
    descEn: "All items & sprites",
    descAr: "جميع الأدوات وصورها",
    icon: <ItemsIcon className="w-5 h-5" />,
    color: "text-green-500",
  },
  {
    id: "gyms",
    labelEn: "Gyms & NPCs",
    labelAr: "الصالات والشخصيات",
    descEn: "Gym leaders & rosters",
    descAr: "قادة الصالات وفرقهم",
    icon: <GymIcon className="w-5 h-5" />,
    color: "text-amber-500",
  },
  {
    id: "maps",
    labelEn: "Maps & Encounters",
    labelAr: "الخرائط واللقاءات",
    descEn: "Locations & wild Pokémon",
    descAr: "المواقع والبوكيمونات البرية",
    icon: <MapIcon className="w-5 h-5" />,
    color: "text-blue-500",
  },
  {
    id: "core",
    labelEn: "Core Data",
    labelAr: "البيانات الأساسية",
    descEn: "Evolution chains & games",
    descAr: "سلاسل التطور والألعاب",
    icon: <Database className="w-4 h-4" />,
    color: "text-purple-500",
  },
  {
    id: "sounds",
    labelEn: "Pokémon Sounds",
    labelAr: "أصوات البوكيمون",
    descEn: "Pokémon cries for offline",
    descAr: "أصوات البوكيمونات للاستخدام بدون اتصال",
    icon: <Volume2 className="w-5 h-5" />,
    color: "text-violet-500",
  },
  {
    id: "animated",
    labelEn: "Animated Sprites",
    labelAr: "الصور المتحركة",
    descEn: "Animated GIFs for all Pokémon",
    descAr: "صور GIF متحركة لجميع البوكيمونات",
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-pink-500",
  },
];

// Troubleshoot Sync Button Component
function TroubleshootButton({
  isOnline,
  onComplete,
}: {
  isOnline: boolean;
  onComplete: () => void;
}) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { clearAllOfflineData, downloadAllData } = useOfflineDownload();
  const { setProgress, setLastSyncTime } = useDownload();
  const [isFixing, setIsFixing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleTroubleshoot = async () => {
    if (!isOnline) {
      toast({
        title: language === "ar" ? "غير متصل" : "Offline",
        description:
          language === "ar"
            ? "يجب أن تكون متصلاً بالإنترنت لإصلاح مشاكل المزامنة"
            : "You must be online to fix sync issues",
        variant: "destructive",
      });
      return;
    }

    setShowConfirm(false);
    setIsFixing(true);

    try {
      // Step 1: Clear all cached data
      setProgress({
        isActive: true,
        section: language === "ar" ? "مسح البيانات القديمة" : "Clearing old data",
        done: 0,
        total: 3,
      });

      await clearAllOfflineData();

      // Step 2: Clear localStorage sync timestamps
      setProgress({
        isActive: true,
        section: language === "ar" ? "إعادة ضبط المزامنة" : "Resetting sync state",
        done: 1,
        total: 3,
      });

      // Clear all sync-related localStorage
      const keysToRemove = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith("offlineSection_") ||
          key.startsWith("lastSync_") ||
          key === "offlineDataDownloaded" ||
          key === "lastSyncTime",
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Step 3: Re-download all data fresh
      setProgress({
        isActive: true,
        section: language === "ar" ? "إعادة التحميل" : "Re-downloading",
        done: 2,
        total: 3,
      });

      const success = await downloadAllData();

      if (success) {
        setLastSyncTime(new Date());
        toast({
          title: language === "ar" ? "تم الإصلاح بنجاح!" : "Fixed successfully!",
          description:
            language === "ar"
              ? "تمت إعادة مزامنة جميع البيانات بنجاح"
              : "All data has been re-synced successfully",
        });
        onComplete();
      } else {
        throw new Error("Download failed");
      }
    } catch (err) {
      toast({
        title: language === "ar" ? "فشل الإصلاح" : "Fix failed",
        description:
          language === "ar"
            ? "حدث خطأ أثناء إصلاح المزامنة. حاول مرة أخرى."
            : "An error occurred while fixing sync. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
      setProgress({ isActive: false, section: "", done: 0, total: 0 });
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Wrench className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-foreground">
                {language === "ar" ? "إصلاح مشاكل المزامنة" : "Fix Sync Issues"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === "ar"
                  ? "يمسح البيانات القديمة ويعيد تحميل الكل"
                  : "Clears old data and re-downloads everything"}
              </p>
            </div>
          </div>

          {showConfirm ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleTroubleshoot}
                disabled={isFixing || !isOnline}
              >
                {language === "ar" ? "تأكيد" : "Confirm"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(true)}
              disabled={isFixing || !isOnline}
              className="shrink-0 gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === "ar" ? "جارٍ الإصلاح..." : "Fixing..."}
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  {language === "ar" ? "إصلاح" : "Fix"}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SectionDownloaderProps {
  onDownloadComplete?: () => void;
}

export function SectionDownloader({ onDownloadComplete }: SectionDownloaderProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const { setProgress, setLastSyncTime } = useDownload();
  const { isDownloading, imageProgress, downloadSection, getSectionLastDownload, error } =
    useOfflineDownload();

  const [downloadingSection, setDownloadingSection] = useState<SectionId | null>(null);
  const [sectionStats, setSectionStats] = useState<
    Record<SectionId, { count: number; lastDownload: Date | null }>
  >({
    dex: { count: 0, lastDownload: null },
    moves: { count: 0, lastDownload: null },
    items: { count: 0, lastDownload: null },
    gyms: { count: 0, lastDownload: null },
    maps: { count: 0, lastDownload: null },
    core: { count: 0, lastDownload: null },
    sounds: { count: 0, lastDownload: null },
    animated: { count: 0, lastDownload: null },
  });

  // Load section stats
  useEffect(() => {
    const loadStats = async () => {
      const soundsCount = await getCachedAudioCount();
      // For animated, we check if the section was downloaded
      const animatedDownload = getSectionLastDownload("animated");
      const stats: Record<SectionId, { count: number; lastDownload: Date | null }> = {
        dex: { count: await getStoreCount("pokemon"), lastDownload: getSectionLastDownload("dex") },
        moves: {
          count: await getStoreCount("moves"),
          lastDownload: getSectionLastDownload("moves"),
        },
        items: {
          count: await getStoreCount("items"),
          lastDownload: getSectionLastDownload("items"),
        },
        gyms: { count: await getStoreCount("gyms"), lastDownload: getSectionLastDownload("gyms") },
        maps: {
          count: await getStoreCount("locations"),
          lastDownload: getSectionLastDownload("maps"),
        },
        core: {
          count: await getStoreCount("evolution_nodes"),
          lastDownload: getSectionLastDownload("core"),
        },
        sounds: { count: soundsCount, lastDownload: getSectionLastDownload("sounds") },
        animated: {
          count: animatedDownload ? await getStoreCount("pokemon") : 0,
          lastDownload: animatedDownload,
        },
      };
      setSectionStats(stats);
    };
    loadStats();
  }, [getSectionLastDownload, downloadingSection]);

  // Sync image progress with global context
  useEffect(() => {
    if (downloadingSection && imageProgress.total > 0) {
      const sectionLabel =
        language === "ar"
          ? SECTIONS_CONFIG.find((s) => s.id === downloadingSection)?.labelAr
          : SECTIONS_CONFIG.find((s) => s.id === downloadingSection)?.labelEn;

      setProgress({
        isActive: true,
        section: sectionLabel || downloadingSection,
        done: imageProgress.done,
        total: imageProgress.total,
      });
    }
  }, [imageProgress, downloadingSection, setProgress, language]);

  const handleDownload = async (sectionId: SectionId) => {
    if (!isOnline) {
      toast({
        title: t("Cannot download offline", "لا يمكن التحميل بدون اتصال"),
        variant: "destructive",
      });
      return;
    }

    const sectionLabel =
      language === "ar"
        ? SECTIONS_CONFIG.find((s) => s.id === sectionId)?.labelAr
        : SECTIONS_CONFIG.find((s) => s.id === sectionId)?.labelEn;

    setDownloadingSection(sectionId);
    setProgress({
      isActive: true,
      section: sectionLabel || sectionId,
      done: 0,
      total: 0,
    });

    const success = await downloadSection(sectionId);

    setDownloadingSection(null);
    setProgress({ isActive: false, section: "", done: 0, total: 0 });

    if (success) {
      setLastSyncTime(new Date());
      toast({
        title: t("Download complete!", "اكتمل التحميل!"),
        description: t(
          `${SECTIONS_CONFIG.find((s) => s.id === sectionId)?.labelEn} data saved for offline use.`,
          `تم حفظ بيانات ${SECTIONS_CONFIG.find((s) => s.id === sectionId)?.labelAr} للاستخدام بدون اتصال.`,
        ),
      });
      onDownloadComplete?.();

      // Refresh stats
      const newStats = { ...sectionStats };
      if (sectionId === "dex")
        newStats.dex = { count: await getStoreCount("pokemon"), lastDownload: new Date() };
      if (sectionId === "moves")
        newStats.moves = { count: await getStoreCount("moves"), lastDownload: new Date() };
      if (sectionId === "items")
        newStats.items = { count: await getStoreCount("items"), lastDownload: new Date() };
      if (sectionId === "gyms")
        newStats.gyms = { count: await getStoreCount("gyms"), lastDownload: new Date() };
      if (sectionId === "maps")
        newStats.maps = { count: await getStoreCount("locations"), lastDownload: new Date() };
      if (sectionId === "core")
        newStats.core = { count: await getStoreCount("evolution_nodes"), lastDownload: new Date() };
      setSectionStats(newStats);
    } else if (error) {
      toast({
        title: t("Download failed", "فشل التحميل"),
        description: error,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleDownloadAll = async () => {
    if (!isOnline) {
      toast({
        title: t("Cannot download offline", "لا يمكن التحميل بدون اتصال"),
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingAll(true);
    setProgress({
      isActive: true,
      section: language === "ar" ? "جميع البيانات" : "All Data",
      done: 0,
      total: 0,
    });

    // Download each section sequentially
    const allSections: SectionId[] = ["core", "dex", "moves", "items", "gyms", "maps"];
    let completedSections = 0;

    for (const sectionId of allSections) {
      const sectionLabel =
        language === "ar"
          ? SECTIONS_CONFIG.find((s) => s.id === sectionId)?.labelAr
          : SECTIONS_CONFIG.find((s) => s.id === sectionId)?.labelEn;

      setProgress({
        isActive: true,
        section: sectionLabel || sectionId,
        done: completedSections,
        total: allSections.length,
      });

      const success = await downloadSection(sectionId);

      if (!success) {
        toast({
          title: t("Download failed", "فشل التحميل"),
          description: t(`Failed to download ${sectionLabel}`, `فشل تحميل ${sectionLabel}`),
          variant: "destructive",
        });
        break;
      }

      completedSections++;
    }

    setIsDownloadingAll(false);
    setProgress({ isActive: false, section: "", done: 0, total: 0 });
    setLastSyncTime(new Date());

    if (completedSections === allSections.length) {
      toast({
        title: t("All data downloaded!", "تم تحميل جميع البيانات!"),
        description: t(
          "Your app is now ready for complete offline use.",
          "التطبيق جاهز الآن للاستخدام الكامل بدون اتصال.",
        ),
      });
      onDownloadComplete?.();
    }

    // Refresh all stats
    const loadStats = async () => {
      const soundsCount = await getCachedAudioCount();
      const animatedDownload = getSectionLastDownload("animated");
      const stats: Record<SectionId, { count: number; lastDownload: Date | null }> = {
        dex: { count: await getStoreCount("pokemon"), lastDownload: getSectionLastDownload("dex") },
        moves: {
          count: await getStoreCount("moves"),
          lastDownload: getSectionLastDownload("moves"),
        },
        items: {
          count: await getStoreCount("items"),
          lastDownload: getSectionLastDownload("items"),
        },
        gyms: { count: await getStoreCount("gyms"), lastDownload: getSectionLastDownload("gyms") },
        maps: {
          count: await getStoreCount("locations"),
          lastDownload: getSectionLastDownload("maps"),
        },
        core: {
          count: await getStoreCount("evolution_nodes"),
          lastDownload: getSectionLastDownload("core"),
        },
        sounds: { count: soundsCount, lastDownload: getSectionLastDownload("sounds") },
        animated: {
          count: animatedDownload ? await getStoreCount("pokemon") : 0,
          lastDownload: animatedDownload,
        },
      };
      setSectionStats(stats);
    };
    loadStats();
  };

  // Calculate total downloaded items
  const totalDownloaded = Object.values(sectionStats).reduce((sum, s) => sum + s.count, 0);
  const allSectionsDownloaded = Object.values(sectionStats).every((s) => s.count > 0);

  return (
    <div className="space-y-4">
      {/* Download All Button */}
      <Card
        className={`border-2 ${allSectionsDownloaded ? "border-green-500/30 bg-green-500/5" : "border-primary/30 bg-primary/5"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`p-2.5 rounded-xl ${allSectionsDownloaded ? "bg-green-500/20" : "bg-primary/20"}`}
              >
                {allSectionsDownloaded ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Download className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-foreground">
                  {language === "ar" ? "تحميل الكل" : "Download All"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {allSectionsDownloaded
                    ? t(
                        `${totalDownloaded} items saved for offline`,
                        `${totalDownloaded} عنصر محفوظ للوضع دون اتصال`,
                      )
                    : t(
                        "Download all sections for complete offline access",
                        "حمّل جميع الأقسام للوصول الكامل بدون اتصال",
                      )}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              variant={allSectionsDownloaded ? "outline" : "default"}
              onClick={handleDownloadAll}
              disabled={isDownloading || isDownloadingAll || !isOnline}
              className="shrink-0 gap-2"
            >
              {isDownloadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("Downloading...", "جارٍ التحميل...")}
                </>
              ) : allSectionsDownloaded ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t("Refresh All", "تحديث الكل")}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t("Download All", "تحميل الكل")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshoot Sync Button */}
      <TroubleshootButton
        isOnline={isOnline}
        onComplete={() => {
          // Refresh stats after troubleshooting
          const loadStats = async () => {
            const soundsCount = await getCachedAudioCount();
            const animatedDownload = getSectionLastDownload("animated");
            const stats: Record<SectionId, { count: number; lastDownload: Date | null }> = {
              dex: {
                count: await getStoreCount("pokemon"),
                lastDownload: getSectionLastDownload("dex"),
              },
              moves: {
                count: await getStoreCount("moves"),
                lastDownload: getSectionLastDownload("moves"),
              },
              items: {
                count: await getStoreCount("items"),
                lastDownload: getSectionLastDownload("items"),
              },
              gyms: {
                count: await getStoreCount("gyms"),
                lastDownload: getSectionLastDownload("gyms"),
              },
              maps: {
                count: await getStoreCount("locations"),
                lastDownload: getSectionLastDownload("maps"),
              },
              core: {
                count: await getStoreCount("evolution_nodes"),
                lastDownload: getSectionLastDownload("core"),
              },
              sounds: { count: soundsCount, lastDownload: getSectionLastDownload("sounds") },
              animated: {
                count: animatedDownload ? await getStoreCount("pokemon") : 0,
                lastDownload: animatedDownload,
              },
            };
            setSectionStats(stats);
          };
          loadStats();
        }}
      />

      {!isOnline && (
        <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
          <WifiOff className="w-4 h-4" />
          {t("You are offline. Connect to download.", "أنت غير متصل. اتصل للتحميل.")}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTIONS_CONFIG.map((section) => {
          const stats = sectionStats[section.id];
          const isThisDownloading = downloadingSection === section.id;
          const hasData = stats.count > 0;

          return (
            <Card
              key={section.id}
              className={`border-border hover:border-primary/50 transition-colors ${hasData ? "bg-primary/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg bg-muted ${section.color}`}>{section.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground">
                        {language === "ar" ? section.labelAr : section.labelEn}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {language === "ar" ? section.descAr : section.descEn}
                      </p>

                      {hasData && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {stats.count} {t("items", "عنصر")}
                          </Badge>
                        </div>
                      )}

                      {stats.lastDownload && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDate(stats.lastDownload)}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={hasData ? "outline" : "default"}
                    onClick={() => handleDownload(section.id)}
                    disabled={isDownloading || !isOnline}
                    className="shrink-0"
                  >
                    {isThisDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : hasData ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {isThisDownloading && imageProgress.total > 0 && (
                  <div className="mt-3 space-y-1">
                    <Progress
                      value={(imageProgress.done / imageProgress.total) * 100}
                      className="h-1.5"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">
                      {imageProgress.done}/{imageProgress.total} {t("images", "صورة")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
