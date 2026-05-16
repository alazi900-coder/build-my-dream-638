import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Shield, Lightbulb } from "lucide-react";
import { getLocalizedType } from "@/original/lib/localization";

interface TypeEffectiveness {
  type: string;
  multiplier: number;
}

// Pokemon type effectiveness chart with multipliers
const typeChart: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Calculate defensive type matchups
export function calculateDefensiveMatchups(types: string[]): {
  weaknesses: TypeEffectiveness[];
  resistances: TypeEffectiveness[];
  immunities: TypeEffectiveness[];
  strongAgainst: TypeEffectiveness[];
} {
  const allTypes = Object.keys(typeChart);
  const effectiveness: Record<string, number> = {};

  allTypes.forEach((type) => {
    effectiveness[type] = 1;
  });

  types.forEach((defenderType) => {
    allTypes.forEach((attackerType) => {
      const chart = typeChart[attackerType];
      if (chart && chart[defenderType.toLowerCase()] !== undefined) {
        effectiveness[attackerType] *= chart[defenderType.toLowerCase()];
      }
    });
  });

  const weaknesses: TypeEffectiveness[] = [];
  const resistances: TypeEffectiveness[] = [];
  const immunities: TypeEffectiveness[] = [];

  Object.entries(effectiveness).forEach(([type, multiplier]) => {
    if (multiplier === 0) {
      immunities.push({ type, multiplier });
    } else if (multiplier > 1) {
      weaknesses.push({ type, multiplier });
    } else if (multiplier < 1 && multiplier > 0) {
      resistances.push({ type, multiplier });
    }
  });

  weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  resistances.sort((a, b) => a.multiplier - b.multiplier);

  // Calculate what this Pokemon is strong against offensively
  const strongAgainst: TypeEffectiveness[] = [];
  types.forEach((pokeType) => {
    const chart = typeChart[pokeType.toLowerCase()];
    if (chart) {
      Object.entries(chart).forEach(([targetType, mult]) => {
        if (mult === 2) {
          // Check if already added
          const existing = strongAgainst.find((s) => s.type === targetType);
          if (!existing) {
            strongAgainst.push({ type: targetType, multiplier: mult });
          }
        }
      });
    }
  });

  return { weaknesses, resistances, immunities, strongAgainst };
}

interface Props {
  types: string[];
}

export function TypeEffectivenessSection({ types }: Props) {
  const { tr, language } = useLanguage();
  const isArabic = language === "ar";
  const { weaknesses, resistances, immunities, strongAgainst } = calculateDefensiveMatchups(types);

  const getMultiplierLabel = (multiplier: number) => {
    if (multiplier === 4) return "4×";
    if (multiplier === 2) return "2×";
    if (multiplier === 0.5) return "½×";
    if (multiplier === 0.25) return "¼×";
    if (multiplier === 0) return "0×";
    return `${multiplier}×`;
  };

  // Separate critical weaknesses (4x) from regular (2x)
  const criticalWeaknesses = weaknesses.filter((w) => w.multiplier >= 4);
  const regularWeaknesses = weaknesses.filter((w) => w.multiplier === 2);

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          {tr("type.effectiveness")}
        </h2>

        <div className="space-y-4">
          {/* Critical Weaknesses (4x) */}
          {criticalWeaknesses.length > 0 && (
            <div className="bg-red-500/20 rounded-xl p-3 border border-red-500/30">
              <p className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
                <span className="text-lg">⚠️</span>
                {tr("type.criticalWeakness")}
              </p>
              <div className="flex flex-wrap gap-2">
                {criticalWeaknesses.map(({ type, multiplier }) => (
                  <div key={type} className="flex items-center gap-1">
                    <TypeBadge type={type} size="sm" />
                    <span className="text-xs font-bold text-red-400">
                      {getMultiplierLabel(multiplier)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Weaknesses */}
          {regularWeaknesses.length > 0 && (
            <div className="bg-destructive/10 rounded-xl p-3 border border-destructive/20">
              <p className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                <span className="text-lg">⚠️</span>
                {tr("type.weakTo")}
              </p>
              <div className="flex flex-wrap gap-2">
                {regularWeaknesses.map(({ type, multiplier }) => (
                  <div key={type} className="flex items-center gap-1">
                    <TypeBadge type={type} size="sm" />
                    <span className="text-xs font-bold text-destructive">
                      {getMultiplierLabel(multiplier)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resistances.length > 0 && (
            <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
              <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-1">
                <span className="text-lg">🛡️</span>
                {tr("type.resistantTo")}
              </p>
              <div className="flex flex-wrap gap-2">
                {resistances.map(({ type, multiplier }) => (
                  <div key={type} className="flex items-center gap-1">
                    <TypeBadge type={type} size="sm" />
                    <span className="text-xs font-bold text-primary">
                      {getMultiplierLabel(multiplier)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {immunities.length > 0 && (
            <div className="bg-muted rounded-xl p-3 border border-border">
              <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <span className="text-lg">✨</span>
                {tr("type.immuneTo")}
              </p>
              <div className="flex flex-wrap gap-2">
                {immunities.map(({ type }) => (
                  <div key={type} className="flex items-center gap-1">
                    <TypeBadge type={type} size="sm" />
                    <span className="text-xs font-bold text-muted-foreground">0×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Battle Tips - Actionable Advice */}
          <div className="bg-muted/50 rounded-xl p-3 border border-border">
            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-primary" />
              {tr("type.battleTips")}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              {/* Avoid tips */}
              {weaknesses.slice(0, 2).map(({ type }) => (
                <li key={`avoid-${type}`} className="flex items-center gap-2">
                  <span className="text-destructive">❌</span>
                  <span>
                    {tr("type.avoid")} {getLocalizedType(type, language)}
                  </span>
                </li>
              ))}
              {/* Strong against tips */}
              {strongAgainst.slice(0, 2).map(({ type }) => (
                <li key={`strong-${type}`} className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>
                    {tr("type.strongAgainst")} {getLocalizedType(type, language)}
                  </span>
                </li>
              ))}
              {/* If no weaknesses */}
              {weaknesses.length === 0 && (
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>{isArabic ? "لا نقاط ضعف واضحة!" : "No major weaknesses!"}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
