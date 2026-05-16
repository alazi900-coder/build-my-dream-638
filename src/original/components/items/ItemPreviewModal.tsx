import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/original/components/ui/dialog";
import { Badge } from "@/original/components/ui/badge";
import { Button } from "@/original/components/ui/button";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { ItemCategoryAnimation } from "./ItemCategoryAnimation";
import { useLanguage } from "@/original/contexts/LanguageContext";
import {
  getItemSpriteUrl,
  getUsageLabels,
  getHowItWorksSteps,
  getCategoryGradient,
} from "@/original/lib/itemUtils";
import {
  Star,
  X,
  Package,
  Pill,
  Sparkles,
  Cherry,
  Circle,
  Zap,
  Shield,
  FlaskConical,
  Disc,
  Key,
  Target,
} from "lucide-react";
import { cn } from "@/original/lib/utils";
import { toast } from "sonner";
import { LtrToken } from "@/original/components/ui/ltr-token";

interface ItemPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: number;
    name_en: string;
    name_ar: string;
    category: string;
    effect_en?: string | null;
    effect_ar?: string | null;
    usage_en?: string | null;
    usage_ar?: string | null;
  } | null;
}

const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    healing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    medicine: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    revival: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "status-cures": "bg-green-500/20 text-green-400 border-green-500/30",
    "pp-recovery": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    evolution: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "standard-balls": "bg-red-500/20 text-red-400 border-red-500/30",
    "special-balls": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "apricorn-balls": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    berries: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "held-items": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "type-enhancement": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "species-specific": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "stat-boosts": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "all-machines": "bg-gray-500/20 text-gray-400 border-gray-500/30",
    vitamins: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "plot-advancement": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };
  return colorMap[category] || "bg-muted text-muted-foreground border-border";
};

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    healing: Pill,
    medicine: Pill,
    revival: Sparkles,
    "status-cures": Shield,
    "pp-recovery": Zap,
    evolution: Sparkles,
    "standard-balls": Circle,
    "special-balls": Circle,
    "apricorn-balls": Circle,
    berries: Cherry,
    "held-items": Package,
    "type-enhancement": Target,
    "species-specific": Target,
    "stat-boosts": FlaskConical,
    "all-machines": Disc,
    vitamins: FlaskConical,
    "plot-advancement": Key,
  };
  return iconMap[category] || Package;
};

const getCategoryLabel = (category: string, language: "en" | "ar"): string => {
  const labels: Record<string, { en: string; ar: string }> = {
    healing: { en: "Healing", ar: "علاج" },
    medicine: { en: "Medicine", ar: "دواء" },
    revival: { en: "Revival", ar: "إحياء" },
    "status-cures": { en: "Status Cures", ar: "علاج الحالات" },
    "pp-recovery": { en: "PP Recovery", ar: "استعادة PP" },
    evolution: { en: "Evolution", ar: "تطور" },
    "standard-balls": { en: "Poké Balls", ar: "كرات بوكيمون" },
    "special-balls": { en: "Special Balls", ar: "كرات خاصة" },
    "apricorn-balls": { en: "Apricorn Balls", ar: "كرات أبريكورن" },
    berries: { en: "Berries", ar: "توت" },
    "held-items": { en: "Held Items", ar: "أدوات محمولة" },
    "type-enhancement": { en: "Type Boost", ar: "تعزيز النوع" },
    "species-specific": { en: "Species-Specific", ar: "خاص بنوع معين" },
    "stat-boosts": { en: "Stat Boosts", ar: "تعزيز الإحصائيات" },
    "all-machines": { en: "TMs/HMs", ar: "آلات التعليم" },
    vitamins: { en: "Vitamins", ar: "فيتامينات" },
    "plot-advancement": { en: "Key Items", ar: "أدوات رئيسية" },
  };
  return labels[category]?.[language] || category;
};

export function ItemPreviewModal({ open, onOpenChange, item }: ItemPreviewModalProps) {
  const { language } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(false);

  // Load favorite status
  useEffect(() => {
    if (item) {
      const favorites = JSON.parse(localStorage.getItem("favoriteItems") || "[]");
      setIsFavorite(favorites.includes(item.id));
    }
  }, [item]);

  const toggleFavorite = () => {
    if (!item) return;

    const favorites = JSON.parse(localStorage.getItem("favoriteItems") || "[]");
    const newFavorites = isFavorite
      ? favorites.filter((id: number) => id !== item.id)
      : [...favorites, item.id];

    localStorage.setItem("favoriteItems", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);

    toast.success(
      isFavorite
        ? language === "ar"
          ? "تمت إزالة الأداة من المفضلة"
          : "Item removed from favorites"
        : language === "ar"
          ? "تمت إضافة الأداة للمفضلة"
          : "Item added to favorites",
    );
  };

  if (!item) return null;

  const CategoryIcon = getCategoryIcon(item.category);
  const displayName = language === "ar" && item.name_ar ? item.name_ar : item.name_en;
  const displayEffect = language === "ar" && item.effect_ar ? item.effect_ar : item.effect_en;
  const displayUsage = language === "ar" && item.usage_ar ? item.usage_ar : item.usage_en;
  const usageLabels = getUsageLabels(item.category, language);
  const howItWorksSteps = getHowItWorksSteps(item.category, language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
        {/* Animated Header with Item */}
        <DialogHeader className="relative h-48 overflow-hidden shrink-0">
          <ItemCategoryAnimation category={item.category} className="absolute inset-0" />
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t",
              getCategoryGradient(item.category)
                .replace("from-", "to-")
                .replace("to-transparent", "from-background/95"),
            )}
          />

          {/* Item Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-border/50 shadow-xl animate-bounce">
              <OfflineImage
                src={getItemSpriteUrl(item.name_en)}
                alt={item.name_en}
                className="w-20 h-20 object-contain"
                placeholderType="item"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <DialogTitle className="text-2xl font-bold text-foreground">{displayName}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? item.name_en : item.name_ar}
              </p>
              <LtrToken className="text-xs text-muted-foreground/60">
                #{item.id.toString().padStart(3, "0")}
              </LtrToken>
            </div>
          </div>
        </DialogHeader>

        {/* Item Details */}
        <div className="p-4 space-y-4">
          {/* Category Badge + Usage Context */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("gap-1", getCategoryColor(item.category))}>
              <CategoryIcon className="w-3 h-3" />
              {getCategoryLabel(item.category, language)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {usageLabels.context}
            </Badge>
            {usageLabels.trigger && (
              <Badge variant="outline" className="text-xs">
                {usageLabels.trigger}
              </Badge>
            )}
          </div>

          {/* Effect Description */}
          {displayEffect && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                {language === "ar" ? "التأثير" : "Effect"}
              </p>
              <p className="text-sm text-foreground">{displayEffect}</p>
            </div>
          )}

          {/* Usage Description */}
          {displayUsage && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                {language === "ar" ? "الاستخدام" : "Usage"}
              </p>
              <p className="text-sm text-foreground">{displayUsage}</p>
            </div>
          )}

          {/* How It Works Section */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
              📖 {language === "ar" ? "كيف يعمل" : "How It Works"}
            </p>
            <ol className="space-y-2">
              {howItWorksSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* No description fallback */}
          {!displayEffect && !displayUsage && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "لا يوجد وصف متاح حالياً" : "No description available yet"}
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="gap-2">
              <X className="w-4 h-4" />
              {language === "ar" ? "إغلاق" : "Close"}
            </Button>
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={toggleFavorite}
              className="gap-2"
            >
              <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
              {language === "ar"
                ? isFavorite
                  ? "في المفضلة"
                  : "إضافة للمفضلة"
                : isFavorite
                  ? "Favorited"
                  : "Add to Favorites"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
