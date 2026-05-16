import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useDownload } from "@/original/contexts/DownloadContext";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { Button } from "@/original/components/ui/button";
import { Switch } from "@/original/components/ui/switch";
import { Label } from "@/original/components/ui/label";
import { Card, CardContent } from "@/original/components/ui/card";
import { Progress } from "@/original/components/ui/progress";
import { clearAllData, getStoreCount } from "@/original/lib/db";
import { clearImageCache, getCachedImageCount } from "@/original/lib/imageCache";
import { StorageUsageCard } from "@/original/components/settings/StorageUsageCard";
import { BackupRestoreSection } from "@/original/components/settings/BackupRestoreSection";
import { CacheDiagnosticsSection } from "@/original/components/settings/CacheDiagnosticsSection";
import { ThemeCustomizer } from "@/original/components/settings/ThemeCustomizer";
import { useOfflineDownload } from "@/original/hooks/useOfflineDownload";
import { SectionDownloader } from "@/original/components/settings/SectionDownloader";
import { OfflinePackSection } from "@/original/components/settings/OfflinePackSection";
import {
  Globe,
  RefreshCw,
  Trash2,
  Info,
  Sun,
  Moon,
  Palette,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  WifiOff,
  Image,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Sparkles,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";
import { isSpeechEnabled, setSpeechEnabled, speakText } from "@/original/lib/speechUtils";
import { useToast } from "@/original/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/original/components/ui/collapsible";
import {
  getCacheStatus,
  skipWaiting,
  getNotificationPermission,
  requestNotificationPermission,
  notificationsSupported,
} from "@/original/lib/serviceWorker";
import { changelog, currentVersion } from "@/original/data/changelog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { ScrollArea } from "@/original/components/ui/scroll-area";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { progress: downloadContextProgress, setProgress: setDownloadContextProgress } =
    useDownload();
  const {
    isDownloading,
    progress,
    error,
    imageProgress,
    downloadAllData,
    getLastDownloadDate,
    getCachedImagesCount,
  } = useOfflineDownload();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  const [lastDownload, setLastDownload] = useState<Date | null>(null);
  const [cachedImages, setCachedImages] = useState<number>(0);
  const [cachedCounts, setCachedCounts] = useState({
    pokemon: 0,
    moves: 0,
    items: 0,
    learnsets: 0,
  });
  const [totalCacheSizeMB, setTotalCacheSizeMB] = useState<number>(0);
  const [showAllDownload, setShowAllDownload] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [cacheVersion, setCacheVersion] = useState<string | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(() => {
    const saved = localStorage.getItem("autoUpdate");
    return saved !== "false"; // Default to true
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [sectionSpeech, setSectionSpeech] = useState(() => isSpeechEnabled());

  // Check notification permission on mount
  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  // Check if user should see "What's New" after an update
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem("lastSeenVersion");
    if (lastSeenVersion && lastSeenVersion !== currentVersion) {
      setShowWhatsNew(true);
    }
    localStorage.setItem("lastSeenVersion", currentVersion);
  }, []);

  useEffect(() => {
    const loadCounts = async () => {
      setLastDownload(getLastDownloadDate());
      setCachedImages(await getCachedImagesCount());
      setCachedCounts({
        pokemon: await getStoreCount("pokemon"),
        moves: await getStoreCount("moves"),
        items: await getStoreCount("items"),
        learnsets: await getStoreCount("learnsets"),
      });

      // Get cache version from SW
      const status = await getCacheStatus();
      if (status) {
        setCacheVersion(status.version);
      }

      // Calculate total cache size
      try {
        let totalBytes = 0;
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            for (const request of keys) {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.clone().blob();
                totalBytes += blob.size;
              }
            }
          }
        }
        // Add IndexedDB estimate
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          if (estimate.usage) {
            totalBytes += estimate.usage;
          }
        }
        setTotalCacheSizeMB(parseFloat((totalBytes / (1024 * 1024)).toFixed(1)));
      } catch (e) {
        console.warn("Failed to calculate cache size:", e);
      }
    };
    loadCounts();
  }, [getLastDownloadDate, getCachedImagesCount]);

  // Listen for SW update events
  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener("sw-update-available", handleUpdate);
    return () => window.removeEventListener("sw-update-available", handleUpdate);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleClearCache = async () => {
    await clearAllData();
    await clearImageCache();
    localStorage.removeItem("offlineDataDownloaded");
    setLastDownload(null);
    setCachedImages(0);
    setCachedCounts({ pokemon: 0, moves: 0, items: 0, learnsets: 0 });
    toast({ title: t("Cache cleared", "تم مسح الذاكرة المؤقتة") });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    toast({
      title: isDarkMode
        ? t("Light mode enabled", "تم تفعيل الوضع الفاتح")
        : t("Dark mode enabled", "تم تفعيل الوضع المظلم"),
    });
  };

  const toggleAutoUpdate = (enabled: boolean) => {
    setAutoUpdate(enabled);
    localStorage.setItem("autoUpdate", String(enabled));
    toast({
      title: enabled
        ? t("Auto-update enabled", "تم تفعيل التحديث التلقائي")
        : t("Auto-update disabled", "تم تعطيل التحديث التلقائي"),
      description: enabled
        ? t(
            "App will update automatically when new versions are available.",
            "سيتم تحديث التطبيق تلقائيًا عند توفر إصدارات جديدة.",
          )
        : t(
            "You will need to manually check for updates.",
            "ستحتاج إلى التحقق من التحديثات يدويًا.",
          ),
    });
  };

  const toggleSectionSpeech = (enabled: boolean) => {
    setSectionSpeech(enabled);
    setSpeechEnabled(enabled);
    if (enabled) {
      // Play a sample to confirm it's working
      speakText(t("Section announcements enabled", "تم تفعيل إعلانات الأقسام"), language);
    }
    toast({
      title: enabled
        ? t("Section speech enabled", "تم تفعيل الصوت الناطق")
        : t("Section speech disabled", "تم تعطيل الصوت الناطق"),
      description: enabled
        ? t(
            "Section names will be announced when navigating.",
            "سيتم الإعلان عن أسماء الأقسام عند التنقل.",
          )
        : t("Section announcements are now off.", "تم إيقاف إعلانات الأقسام."),
    });
  };

  const handleEnableNotifications = async () => {
    if (!notificationsSupported()) {
      toast({
        title: t("Not supported", "غير مدعوم"),
        description: t(
          "Push notifications are not supported in this browser.",
          "الإشعارات غير مدعومة في هذا المتصفح.",
        ),
        variant: "destructive",
      });
      return;
    }

    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      toast({
        title: t("Notifications enabled", "تم تفعيل الإشعارات"),
        description: t(
          "You will receive notifications about app updates.",
          "ستتلقى إشعارات حول تحديثات التطبيق.",
        ),
      });
    } else if (permission === "denied") {
      toast({
        title: t("Notifications blocked", "الإشعارات محظورة"),
        description: t(
          "Please enable notifications in your browser settings.",
          "يرجى تفعيل الإشعارات في إعدادات المتصفح.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    // Activate the floating progress bar
    setDownloadContextProgress({
      isActive: true,
      section: "All Data",
      done: 0,
      total: 100,
      overallProgress: {
        currentPhase: "tables",
        phaseName: "Starting",
        phaseNameAr: "جارٍ البدء",
        completedPhases: 0,
        totalPhases: 3,
        currentItemDone: 0,
        currentItemTotal: 0,
        overallPercentage: 0,
      },
    });

    const success = await downloadAllData((progressUpdate) => {
      setDownloadContextProgress({
        isActive: true,
        section: progressUpdate.phaseName,
        done: progressUpdate.currentItemDone,
        total: progressUpdate.currentItemTotal,
        overallProgress: progressUpdate,
      });
    });

    // Deactivate the floating progress bar
    setDownloadContextProgress({
      isActive: false,
      section: "",
      done: 0,
      total: 0,
    });

    if (success) {
      setLastDownload(getLastDownloadDate());
      setCachedImages(await getCachedImagesCount());
      setCachedCounts({
        pokemon: await getStoreCount("pokemon"),
        moves: await getStoreCount("moves"),
        items: await getStoreCount("items"),
        learnsets: await getStoreCount("learnsets"),
      });
      toast({
        title: t("Download complete!", "اكتمل التحميل!"),
        description: t("All data available offline.", "جميع البيانات متاحة بدون إنترنت."),
      });
    }
  };

  const handleCheckForUpdates = async () => {
    if (!("serviceWorker" in navigator)) {
      toast({
        title: t("Not supported", "غير مدعوم"),
        description: t("Service Worker not available", "خدمة التحديث غير متوفرة"),
        variant: "destructive",
      });
      return;
    }

    setIsCheckingUpdates(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        await registration.update();

        if (registration.waiting) {
          // New version is waiting to activate
          toast({
            title: t("Update available!", "يوجد تحديث!"),
            description: t("Installing new version...", "جارٍ تثبيت الإصدار الجديد..."),
          });
          skipWaiting();
          setUpdateAvailable(false);
        } else if (registration.installing) {
          toast({
            title: t("Update in progress", "التحديث جارٍ"),
            description: t("New version is being installed.", "يتم تثبيت الإصدار الجديد."),
          });
        } else {
          toast({
            title: t("Up to date", "محدّث"),
            description: t("You have the latest version.", "لديك أحدث إصدار."),
          });
        }
      } else {
        toast({
          title: t("No Service Worker", "لا يوجد Service Worker"),
          description: t(
            "App will update automatically on next reload.",
            "سيتم تحديث التطبيق تلقائيًا عند إعادة التحميل.",
          ),
        });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      toast({
        title: t("Update check failed", "فشل التحقق من التحديثات"),
        description: t("Please try again later.", "يرجى المحاولة لاحقًا."),
        variant: "destructive",
      });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const downloadProgress =
    progress.length > 0
      ? (progress.filter((p) => p.status === "done").length / progress.length) * 100
      : 0;

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
    images: { en: "Images", ar: "الصور" },
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpdateNow = () => {
    skipWaiting();
    setUpdateAvailable(false);
    toast({
      title: t("Installing update...", "جارٍ تثبيت التحديث..."),
      description: t("The app will reload shortly.", "سيتم إعادة تحميل التطبيق قريبًا."),
    });
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        {/* Update Available Banner */}
        {updateAvailable && !autoUpdate && (
          <div className="flex items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("New version available!", "إصدار جديد متاح!")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Update to get the latest features.", "قم بالتحديث للحصول على أحدث الميزات.")}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleUpdateNow} className="gap-1.5 shrink-0">
              <RotateCw className="w-4 h-4" />
              {t("Update Now", "تحديث الآن")}
            </Button>
          </div>
        )}

        <PageHeader title={t("Settings", "الإعدادات")} icon={Settings} />

        {/* Offline Pack Installation (Primary) */}
        <OfflinePackSection
          onComplete={async () => {
            setCachedCounts({
              pokemon: await getStoreCount("pokemon"),
              moves: await getStoreCount("moves"),
              items: await getStoreCount("items"),
              learnsets: await getStoreCount("learnsets"),
            });
            setCachedImages(await getCachedImagesCount());
            setLastDownload(getLastDownloadDate());
          }}
        />

        {/* Section-Based Offline Download (Advanced) */}
        <Collapsible>
          <Card className="border-border">
            <CardContent className="p-4">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -m-2 p-2 rounded-lg transition-colors">
                  <h2 className="font-semibold flex items-center gap-2 text-foreground">
                    <Download className="w-4 h-4 text-primary" />
                    {t("Advanced Downloads", "التحميلات المتقدمة")}
                  </h2>
                  <div className="flex items-center gap-2">
                    {totalCacheSizeMB > 0 && (
                      <span className="text-sm font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {totalCacheSizeMB} MB
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4">
                {!isOnline && (
                  <div className="flex items-center gap-2 text-destructive mb-4 text-sm">
                    <WifiOff className="w-4 h-4" />
                    {t("You are offline", "أنت غير متصل بالإنترنت")}
                  </div>
                )}

                {lastDownload && (
                  <div className="space-y-1 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {t("Last full download:", "آخر تحميل كامل:")} {formatDate(lastDownload)}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cachedCounts.pokemon > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {cachedCounts.pokemon} {t("Pokémon", "بوكيمون")}
                        </span>
                      )}
                      {cachedImages > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {cachedImages} {t("images", "صورة")}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Per-Section Downloads */}
                <SectionDownloader
                  onDownloadComplete={async () => {
                    setCachedCounts({
                      pokemon: await getStoreCount("pokemon"),
                      moves: await getStoreCount("moves"),
                      items: await getStoreCount("items"),
                      learnsets: await getStoreCount("learnsets"),
                    });
                    setCachedImages(await getCachedImagesCount());
                  }}
                />
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>

        {/* Backup & Restore */}
        <BackupRestoreSection
          onDataChanged={async () => {
            setCachedCounts({
              pokemon: await getStoreCount("pokemon"),
              moves: await getStoreCount("moves"),
              items: await getStoreCount("items"),
              learnsets: await getStoreCount("learnsets"),
            });
            setCachedImages(await getCachedImagesCount());
            setLastDownload(getLastDownloadDate());
          }}
        />

        {/* Cache Diagnostics */}
        <CacheDiagnosticsSection />

        {/* Storage Usage */}
        <StorageUsageCard />

        {/* Theme & Accessibility */}
        <Card className="border-border">
          <CardContent className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
              <Palette className="w-4 h-4 text-primary" />
              {t("Appearance", "المظهر")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                  <Label htmlFor="theme-toggle" className="text-foreground">
                    {isDarkMode ? t("Dark Mode", "الوضع المظلم") : t("Light Mode", "الوضع الفاتح")}
                  </Label>
                </div>
                <Switch id="theme-toggle" checked={isDarkMode} onCheckedChange={toggleTheme} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  {sectionSpeech ? (
                    <Volume2 className="w-5 h-5 text-primary" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="speech-toggle" className="text-foreground">
                      {t("Section Announcements", "إعلانات الأقسام")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("Speak section names when navigating", "نطق أسماء الأقسام عند التنقل")}
                    </p>
                  </div>
                </div>
                <Switch
                  id="speech-toggle"
                  checked={sectionSpeech}
                  onCheckedChange={toggleSectionSpeech}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Customization */}
        <ThemeCustomizer />

        {/* Language & Direction */}
        <Card className="border-border">
          <CardContent className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              {t("Language & Direction", "اللغة والاتجاه")}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => setLanguage("en")}
                  className="flex-1"
                >
                  English
                </Button>
                <Button
                  variant={language === "ar" ? "default" : "outline"}
                  onClick={() => setLanguage("ar")}
                  className="flex-1"
                >
                  العربية
                </Button>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("Current Direction", "الاتجاه الحالي")}:
                  <span className="font-medium text-foreground mx-2">
                    {language === "ar" ? "RTL ←" : "LTR →"}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card className="border-border">
          <CardContent className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
              <RefreshCw className="w-4 h-4 text-primary" />
              {t("Data", "البيانات")}
            </h2>
            <div className="space-y-2">
              <Button variant="outline" onClick={() => navigate("/admin")} className="w-full gap-2">
                <Info className="w-4 h-4" />
                {t("Import Data (Admin)", "استيراد البيانات (مسؤول)")}
              </Button>
              <Button variant="destructive" onClick={handleClearCache} className="w-full gap-2">
                <Trash2 className="w-4 h-4" />
                {t("Clear Local Cache", "مسح الذاكرة المؤقتة")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About & Updates */}
        <Card className="border-border">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-3">
              {t("About & Updates", "حول والتحديثات")}
            </h2>
            <p className="text-sm text-muted-foreground">Pokémon Guide v{currentVersion}</p>
            <p className="text-sm text-muted-foreground">
              {t(
                "Complete bilingual guide with offline support.",
                "دليل كامل ثنائي اللغة مع دعم بدون اتصال.",
              )}
            </p>
            {cacheVersion && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("Cache version:", "إصدار الذاكرة المؤقتة:")} {cacheVersion}
              </p>
            )}

            {/* What's New Dialog */}
            <Dialog open={showWhatsNew} onOpenChange={setShowWhatsNew}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-3 gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  {t("What's New", "ما الجديد")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {t("What's New", "ما الجديد")}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-6 pr-4">
                    {changelog.map((entry) => (
                      <div key={entry.version} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">v{entry.version}</span>
                          <span className="text-xs text-muted-foreground">{entry.date}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {(language === "ar" ? entry.changes.ar : entry.changes.en).map(
                            (change, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                {change}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Push Notifications */}
            <div className="flex items-center justify-between mt-4 py-3 border-t border-border">
              <div className="flex-1">
                <Label className="text-foreground flex items-center gap-2">
                  {notificationPermission === "granted" ? (
                    <Bell className="w-4 h-4 text-primary" />
                  ) : (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  {t("Update Notifications", "إشعارات التحديث")}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notificationPermission === "granted"
                    ? t("You will be notified about new updates", "سيتم إعلامك بالتحديثات الجديدة")
                    : notificationPermission === "denied"
                      ? t(
                          "Notifications blocked in browser settings",
                          "الإشعارات محظورة في إعدادات المتصفح",
                        )
                      : t(
                          "Get notified when updates are available",
                          "احصل على إشعارات عند توفر التحديثات",
                        )}
                </p>
              </div>
              {notificationPermission === "granted" ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableNotifications}
                  disabled={
                    notificationPermission === "denied" || notificationPermission === "unsupported"
                  }
                >
                  {t("Enable", "تفعيل")}
                </Button>
              )}
            </div>

            {/* Auto-Update Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div className="flex-1">
                <Label htmlFor="auto-update-toggle" className="text-foreground">
                  {t("Auto-update", "التحديث التلقائي")}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Automatically install new versions", "تثبيت الإصدارات الجديدة تلقائيًا")}
                </p>
              </div>
              <Switch
                id="auto-update-toggle"
                checked={autoUpdate}
                onCheckedChange={toggleAutoUpdate}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdates}
              className="w-full mt-3 gap-2"
            >
              {isCheckingUpdates ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
              {isCheckingUpdates
                ? t("Checking...", "جارٍ التحقق...")
                : t("Check for Updates", "التحقق من التحديثات")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
