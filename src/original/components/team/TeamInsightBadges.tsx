import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { getDefensiveMultiplier, ALL_TYPES } from "@/original/lib/typeEffectiveness";
import { getLocalizedType } from "@/original/lib/localization";
import { CheckCircle, AlertTriangle, Plus, Minus } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
}

interface InsightBadgeData {
  type: "coverage" | "weakness" | "resistance" | "new-type";
  typeLabel: string;
  rawType: string;
  isPositive: boolean;
}

interface Props {
  newPokemon: Pokemon;
  existingTeam: (Pokemon | null)[];
}

export function TeamInsightBadges({ newPokemon, existingTeam }: Props) {
  const { language } = useLanguage();
  const validExisting = existingTeam.filter(Boolean) as Pokemon[];

  const insights = useMemo(() => {
    const badges: InsightBadgeData[] = [];

    // Check for new types added
    const existingTypes = new Set<string>();
    validExisting.forEach((p) => p.types.forEach((t) => existingTypes.add(t)));

    newPokemon.types.forEach((type) => {
      if (!existingTypes.has(type)) {
        badges.push({
          type: "new-type",
          typeLabel: getLocalizedType(type, language),
          rawType: type,
          isPositive: true,
        });
      }
    });

    // Check what this Pokémon covers (resists)
    ALL_TYPES.forEach((attackType) => {
      const mult = getDefensiveMultiplier(attackType, newPokemon.types);

      // Check if team was weak to this and new Pokémon resists
      if (mult < 1) {
        const teamWeakCount = validExisting.filter(
          (p) => getDefensiveMultiplier(attackType, p.types) >= 2,
        ).length;

        if (teamWeakCount >= 1) {
          badges.push({
            type: "coverage",
            typeLabel: getLocalizedType(attackType, language),
            rawType: attackType,
            isPositive: true,
          });
        }
      }

      // Check if this adds a shared weakness
      if (mult >= 2) {
        const teamWeakCount = validExisting.filter(
          (p) => getDefensiveMultiplier(attackType, p.types) >= 2,
        ).length;

        if (teamWeakCount >= 1) {
          badges.push({
            type: "weakness",
            typeLabel: getLocalizedType(attackType, language),
            rawType: attackType,
            isPositive: false,
          });
        }
      }
    });

    // Limit to most relevant badges
    const positiveBadges = badges.filter((b) => b.isPositive).slice(0, 2);
    const negativeBadges = badges.filter((b) => !b.isPositive).slice(0, 1);

    return [...positiveBadges, ...negativeBadges];
  }, [newPokemon, validExisting, language]);

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {insights.map((insight, i) => (
        <div
          key={`${insight.type}-${insight.rawType}-${i}`}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
            insight.isPositive
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          )}
        >
          {insight.type === "coverage" && (
            <>
              <CheckCircle className="w-3 h-3" />
              <span>{language === "ar" ? "يغطي" : "Covers"}</span>
              <TypeBadge type={insight.rawType} size="sm" />
            </>
          )}
          {insight.type === "weakness" && (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>{language === "ar" ? "يضيف ضعفًا لـ" : "Adds weakness to"}</span>
              <TypeBadge type={insight.rawType} size="sm" />
            </>
          )}
          {insight.type === "new-type" && (
            <>
              <Plus className="w-3 h-3" />
              <span>{language === "ar" ? "نوع جديد" : "New type"}</span>
              <TypeBadge type={insight.rawType} size="sm" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
