import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Progress } from "@/original/components/ui/progress";
import {
  HardDrive,
  Database,
  Image,
  Volume2,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/original/components/ui/collapsible";
import { getStoreCount } from "@/original/lib/db";
import { getCachedImageCount } from "@/original/lib/imageCache";
import { getCachedAudioCount } from "@/original/lib/audioCache";

interface StorageInfo {
  totalBytes: number;
  usedBytes: number;
  usedPercent: number;
  indexedDBSize: number;
  imageCacheSize: number;
  audioCacheSize: number;
  indexedDBDetails: {
    pokemon: number;
    moves: number;
    items: number;
    locations: number;
    encounters: number;
    gyms: number;
    gym_roster: number;
    npcs: number;
    learnsets: number;
    evolution_nodes: number;
    games: number;
  };
  imageCacheCount: number;
  audioCacheCount: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function StorageUsageCard() {
  const { language, t } = useLanguage();
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStorageInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get browser storage estimate (total available)
      let totalBytes = 0;
      let usedBytes = 0;

      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        totalBytes = estimate.quota || 0;
        usedBytes = estimate.usage || 0;
      }

      // Calculate IndexedDB size by counting records (approximate)
      const indexedDBDetails = {
        pokemon: await getStoreCount("pokemon"),
        moves: await getStoreCount("moves"),
        items: await getStoreCount("items"),
        locations: await getStoreCount("locations"),
        encounters: await getStoreCount("encounters"),
        gyms: await getStoreCount("gyms"),
        gym_roster: await getStoreCount("gym_roster"),
        npcs: await getStoreCount("npcs"),
        learnsets: await getStoreCount("learnsets"),
        evolution_nodes: await getStoreCount("evolution_nodes"),
        games: await getStoreCount("games"),
      };

      // Estimate IndexedDB size (rough estimate: ~2KB per Pokemon, ~500B per move, etc.)
      const indexedDBSize =
        indexedDBDetails.pokemon * 2000 +
        indexedDBDetails.moves * 500 +
        indexedDBDetails.items * 400 +
        indexedDBDetails.locations * 300 +
        indexedDBDetails.encounters * 150 +
        indexedDBDetails.gyms * 500 +
        indexedDBDetails.gym_roster * 200 +
        indexedDBDetails.npcs * 400 +
        indexedDBDetails.learnsets * 100 +
        indexedDBDetails.evolution_nodes * 200 +
        indexedDBDetails.games * 100;

      // Calculate image cache size
      let imageCacheSize = 0;
      let imageCacheCount = 0;
      try {
        const imageCache = await caches.open("pokemon-images-v3");
        const imageKeys = await imageCache.keys();
        imageCacheCount = imageKeys.length;

        // Sample a few images to estimate average size
        const sampleSize = Math.min(10, imageKeys.length);
        let sampleTotal = 0;
        for (let i = 0; i < sampleSize; i++) {
          const response = await imageCache.match(imageKeys[i]);
          if (response) {
            const blob = await response.blob();
            sampleTotal += blob.size;
          }
        }
        const avgSize = sampleSize > 0 ? sampleTotal / sampleSize : 0;
        imageCacheSize = avgSize * imageKeys.length;
      } catch {
        imageCacheCount = await getCachedImageCount();
        // Estimate ~15KB per image if we can't read cache
        imageCacheSize = imageCacheCount * 15000;
      }

      // Calculate audio cache size
      let audioCacheSize = 0;
      let audioCacheCount = 0;
      try {
        const audioCache = await caches.open("pokemon-audio-cache-v1");
        const audioKeys = await audioCache.keys();
        audioCacheCount = audioKeys.length;

        // Sample a few audio files to estimate average size
        const sampleSize = Math.min(10, audioKeys.length);
        let sampleTotal = 0;
        for (let i = 0; i < sampleSize; i++) {
          const response = await audioCache.match(audioKeys[i]);
          if (response) {
            const blob = await response.blob();
            sampleTotal += blob.size;
          }
        }
        const avgSize = sampleSize > 0 ? sampleTotal / sampleSize : 0;
        audioCacheSize = avgSize * audioKeys.length;
      } catch {
        audioCacheCount = await getCachedAudioCount();
        // Estimate ~20KB per audio file if we can't read cache
        audioCacheSize = audioCacheCount * 20000;
      }

      const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

      setStorageInfo({
        totalBytes,
        usedBytes,
        usedPercent,
        indexedDBSize,
        imageCacheSize,
        audioCacheSize,
        indexedDBDetails,
        imageCacheCount,
        audioCacheCount,
      });
    } catch (err) {
      console.error("Failed to load storage info:", err);
      setError(t("Failed to load storage information", "فشل تحميل معلومات التخزين"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const storeLabels: Record<string, { en: string; ar: string }> = {
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

  const totalAppStorage = storageInfo
    ? storageInfo.indexedDBSize + storageInfo.imageCacheSize + storageInfo.audioCacheSize
    : 0;

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <HardDrive className="w-4 h-4 text-primary" />
            {t("Storage Usage", "استخدام التخزين")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadStorageInfo}
            disabled={isLoading}
            className="h-8 w-8"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {isLoading && !storageInfo ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : storageInfo ? (
          <div className="space-y-4">
            {/* Total App Storage */}
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {t("App Data", "بيانات التطبيق")}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatBytes(totalAppStorage)}
                </span>
              </div>
            </div>

            {/* Storage Breakdown */}
            <div className="space-y-3">
              {/* IndexedDB */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-foreground">
                    {t("Database (IndexedDB)", "قاعدة البيانات")}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  ~{formatBytes(storageInfo.indexedDBSize)}
                </span>
              </div>

              {/* Image Cache */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-foreground">
                    {t("Images", "الصور")} ({storageInfo.imageCacheCount})
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  ~{formatBytes(storageInfo.imageCacheSize)}
                </span>
              </div>

              {/* Audio Cache */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-foreground">
                    {t("Sounds", "الأصوات")} ({storageInfo.audioCacheCount})
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  ~{formatBytes(storageInfo.audioCacheSize)}
                </span>
              </div>
            </div>

            {/* Browser Storage Quota */}
            {storageInfo.totalBytes > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{t("Browser Storage Used", "مساحة المتصفح المستخدمة")}</span>
                  <span>
                    {formatBytes(storageInfo.usedBytes)} / {formatBytes(storageInfo.totalBytes)}
                  </span>
                </div>
                <Progress value={storageInfo.usedPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {storageInfo.usedPercent.toFixed(1)}% {t("used", "مستخدم")}
                </p>
              </div>
            )}

            {/* Detailed Breakdown */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2 mt-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {t("Show Details", "عرض التفاصيل")}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <h3 className="text-xs font-medium text-muted-foreground mb-2">
                    {t("Database Records", "سجلات قاعدة البيانات")}
                  </h3>
                  {Object.entries(storageInfo.indexedDBDetails).map(
                    ([key, count]) =>
                      count > 0 && (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {language === "ar" ? storeLabels[key]?.ar : storeLabels[key]?.en}
                          </span>
                          <span className="text-foreground font-medium">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <p className="text-xs text-muted-foreground text-center">
              {t("* Sizes are approximate", "* الأحجام تقريبية")}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
