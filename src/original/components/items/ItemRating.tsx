import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface ItemRatingProps {
  category: string;
  itemName: string;
}

// Rating database based on competitive and casual usefulness
const categoryRatings: Record<string, number> = {
  "held-items": 5,
  "type-enhancement": 4,
  evolution: 5,
  healing: 3,
  revival: 4,
  "standard-balls": 3,
  "special-balls": 4,
  berries: 4,
  vitamins: 5,
  "stat-boosts": 3,
  medicine: 3,
  "status-cures": 3,
  "pp-recovery": 4,
  "all-machines": 5,
  "plot-advancement": 2,
  other: 2,
};

// Special high-value items
const highValueItems = [
  "leftovers",
  "life-orb",
  "choice-band",
  "choice-specs",
  "choice-scarf",
  "focus-sash",
  "assault-vest",
  "eviolite",
  "rocky-helmet",
  "master-ball",
  "rare-candy",
  "exp-share",
  "lucky-egg",
];

export function ItemRating({ category, itemName }: ItemRatingProps) {
  const { language } = useLanguage();

  const rating = useMemo(() => {
    const normalizedName = itemName.toLowerCase().replace(/\s+/g, "-");
    if (highValueItems.includes(normalizedName)) {
      return 5;
    }
    return categoryRatings[category] || 3;
  }, [category, itemName]);

  const getRatingLabel = () => {
    if (rating >= 5)
      return { en: "Essential", ar: "أساسي", icon: TrendingUp, color: "text-green-400" };
    if (rating >= 4)
      return { en: "Very Useful", ar: "مفيد جداً", icon: TrendingUp, color: "text-emerald-400" };
    if (rating >= 3) return { en: "Useful", ar: "مفيد", icon: Minus, color: "text-blue-400" };
    if (rating >= 2)
      return { en: "Situational", ar: "حسب الموقف", icon: TrendingDown, color: "text-yellow-400" };
    return {
      en: "Niche",
      ar: "نادر الاستخدام",
      icon: TrendingDown,
      color: "text-muted-foreground",
    };
  };

  const ratingInfo = getRatingLabel();
  const RatingIcon = ratingInfo.icon;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {language === "ar" ? "تقييم الفائدة" : "Usefulness Rating"}
          </span>
          <div className={cn("flex items-center gap-1", ratingInfo.color)}>
            <RatingIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === "ar" ? ratingInfo.ar : ratingInfo.en}
            </span>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-5 h-5 transition-colors",
                star <= rating ? "text-primary fill-primary" : "text-muted-foreground/30",
              )}
            />
          ))}
        </div>

        {/* Explanation */}
        <p className="text-xs text-muted-foreground mt-2">
          {rating >= 5 &&
            (language === "ar"
              ? "عنصر ضروري للعب التنافسي والقصة"
              : "Essential for competitive play and story mode")}
          {rating === 4 &&
            (language === "ar" ? "مفيد في معظم المواقف" : "Useful in most situations")}
          {rating === 3 && (language === "ar" ? "جيد للاستخدام العام" : "Good for general use")}
          {rating === 2 &&
            (language === "ar" ? "مفيد في مواقف محددة فقط" : "Only useful in specific situations")}
          {rating <= 1 && (language === "ar" ? "استخدام محدود جداً" : "Very limited use")}
        </p>
      </CardContent>
    </Card>
  );
}
