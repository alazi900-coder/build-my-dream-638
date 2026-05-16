import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { Badge } from "@/original/components/ui/badge";
import { SavedAdventure, getAllAdventures, deleteAdventure } from "@/original/lib/adventureStorage";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { Play, Trash2, Clock, Trophy, Loader2, MapPin, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface SavedAdventuresProps {
  onResume: (adventure: SavedAdventure) => void;
}

// Story type labels for display
const storyTypeLabels: Record<string, { en: string; ar: string }> = {
  adventure: { en: "Adventure", ar: "مغامرة" },
  mystery: { en: "Mystery", ar: "غموض" },
  comedy: { en: "Comedy", ar: "كوميديا" },
  heroic: { en: "Heroic", ar: "بطولي" },
};

// Region labels for display
const regionLabels: Record<string, { en: string; ar: string }> = {
  kanto: { en: "Kanto", ar: "كانتو" },
  galar: { en: "Galar", ar: "جالار" },
  johto: { en: "Johto", ar: "جوتو" },
  hoenn: { en: "Hoenn", ar: "هوين" },
  sinnoh: { en: "Sinnoh", ar: "سينو" },
  hisui: { en: "Hisui", ar: "هيسوي" },
};

export function SavedAdventures({ onResume }: SavedAdventuresProps) {
  const { t, language } = useLanguage();
  const [adventures, setAdventures] = useState<SavedAdventure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdventures();
  }, []);

  const loadAdventures = async () => {
    try {
      const saved = await getAllAdventures();
      setAdventures(saved);
    } catch (error) {
      console.error("Failed to load adventures:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAdventure(id);
      setAdventures((prev) => prev.filter((a) => a.id !== id));
      toast.success(t("Adventure deleted", "تم حذف المغامرة"));
    } catch (error) {
      toast.error(t("Failed to delete", "فشل في الحذف"));
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStoryTypeLabel = (value: string) => {
    const labels = storyTypeLabels[value];
    return labels ? (language === "ar" ? labels.ar : labels.en) : value;
  };

  const getRegionLabel = (value: string) => {
    const labels = regionLabels[value];
    return labels ? (language === "ar" ? labels.ar : labels.en) : value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (adventures.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground space-y-2">
        <BookOpen className="w-10 h-10 mx-auto opacity-50" />
        <p>{t("No saved adventures yet", "لا توجد مغامرات محفوظة بعد")}</p>
        <p className="text-sm">
          {t("Start a new adventure to begin your journey!", "ابدأ مغامرة جديدة لتبدأ رحلتك!")}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-3 pr-2">
        {adventures.map((adventure) => (
          <Card
            key={adventure.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
            onClick={() => onResume(adventure)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={getPokemonSprite(adventure.pokemonId)}
                  alt={adventure.pokemonName}
                  className="w-14 h-14 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">
                      {adventure.heroName || t("Unknown Hero", "بطل مجهول")}
                    </p>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {getStoryTypeLabel(adventure.storyType)}
                    </Badge>
                    {adventure.isComplete && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0 bg-green-500/10 text-green-600"
                      >
                        {t("Complete", "مكتملة")}
                      </Badge>
                    )}
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getRegionLabel(adventure.startingRegion)}
                    </span>
                    <span>•</span>
                    <span>
                      {adventure.choicesMade} {t("story.decisions", "قرار")}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {adventure.points} {t("pts", "نقطة")}
                    </span>
                  </div>

                  {/* Time row */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                    <Clock className="w-3 h-3" />
                    {formatDate(adventure.updatedAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {!adventure.isComplete && (
                    <Button size="sm" variant="default" className="h-8 gap-1 text-xs">
                      <Play className="w-3 h-3" />
                      {t("story.continueStory", "متابعة القصة")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDelete(adventure.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
