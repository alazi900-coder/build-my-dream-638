import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import {
  Heart,
  Swords,
  Shield,
  Brain,
  Zap,
  Wind,
  ArrowRight,
  ArrowLeft,
  Minus,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
}

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  category: string;
  power: number | null;
}

interface Props {
  pokemonA: Pokemon;
  pokemonB: Pokemon;
  levelA: number;
  levelB: number;
  movesA: Move[];
  movesB: Move[];
}

// Type effectiveness chart
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

function calculateTypeMatchup(defenderTypes: string[]): Record<string, number> {
  const allTypes = Object.keys(typeChart);
  const effectiveness: Record<string, number> = {};

  allTypes.forEach((type) => {
    effectiveness[type] = 1;
  });

  defenderTypes.forEach((defenderType) => {
    allTypes.forEach((attackerType) => {
      const chart = typeChart[attackerType];
      if (chart && chart[defenderType.toLowerCase()] !== undefined) {
        effectiveness[attackerType] *= chart[defenderType.toLowerCase()];
      }
    });
  });

  return effectiveness;
}

export function ComparisonView({ pokemonA, pokemonB, levelA, levelB, movesA, movesB }: Props) {
  const { t, language } = useLanguage();

  const statKeys = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
  const statLabels = {
    hp: { en: "HP", ar: "ص.ح", icon: Heart },
    atk: { en: "ATK", ar: "هجوم", icon: Swords },
    def: { en: "DEF", ar: "دفاع", icon: Shield },
    spa: { en: "SP.A", ar: "هـ.خ", icon: Brain },
    spd: { en: "SP.D", ar: "د.خ", icon: Zap },
    spe: { en: "SPE", ar: "سرعة", icon: Wind },
  };

  // Calculate type matchups
  const matchupsA = useMemo(() => calculateTypeMatchup(pokemonA.types || []), [pokemonA.types]);
  const matchupsB = useMemo(() => calculateTypeMatchup(pokemonB.types || []), [pokemonB.types]);

  // Find weaknesses
  const weaknessesA = Object.entries(matchupsA)
    .filter(([, v]) => v > 1)
    .map(([k]) => k);
  const weaknessesB = Object.entries(matchupsB)
    .filter(([, v]) => v > 1)
    .map(([k]) => k);
  const resistancesA = Object.entries(matchupsA)
    .filter(([, v]) => v < 1 && v > 0)
    .map(([k]) => k);
  const resistancesB = Object.entries(matchupsB)
    .filter(([, v]) => v < 1 && v > 0)
    .map(([k]) => k);

  // Simple damage estimation
  const estimateDamage = (
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    attackerLevel: number,
  ) => {
    if (!move.power) return null;

    const isPhysical = move.category === "physical";
    const attackStat = isPhysical ? attacker.stats.atk : attacker.stats.spa;
    const defenseStat = isPhysical ? defender.stats.def : defender.stats.spd;

    // STAB bonus
    const stab = attacker.types?.some((t) => t.toLowerCase() === move.type.toLowerCase()) ? 1.5 : 1;

    // Type effectiveness
    const defenderMatchups = calculateTypeMatchup(defender.types || []);
    const effectiveness = defenderMatchups[move.type.toLowerCase()] || 1;

    // Simplified damage formula
    const baseDamage =
      (((2 * attackerLevel) / 5 + 2) * move.power * attackStat) / defenseStat / 50 + 2;
    const finalDamage = baseDamage * stab * effectiveness;

    return { damage: Math.floor(finalDamage), effectiveness, stab: stab > 1 };
  };

  // Calculate damage hints for each move
  const damageHintsA = movesA.map((move) => estimateDamage(pokemonA, pokemonB, move, levelA));
  const damageHintsB = movesB.map((move) => estimateDamage(pokemonB, pokemonA, move, levelB));

  const totalStatsA = Object.values(pokemonA.stats).reduce((a, b) => a + b, 0);
  const totalStatsB = Object.values(pokemonB.stats).reduce((a, b) => a + b, 0);

  const getComparisonIcon = (valueA: number, valueB: number) => {
    if (valueA > valueB) return <ArrowLeft className="w-4 h-4 text-blue-400" />;
    if (valueB > valueA) return <ArrowRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getDamageLabel = (damage: number | null, effectiveness: number) => {
    if (damage === null) return null;

    let label = "";
    let color = "text-muted-foreground";

    if (effectiveness === 0) {
      label = language === "ar" ? "محصن" : "Immune";
      color = "text-gray-500";
    } else if (effectiveness > 1) {
      label = language === "ar" ? "فعال جداً" : "Super Effective";
      color = "text-green-400";
    } else if (effectiveness < 1) {
      label = language === "ar" ? "ليس فعالاً" : "Not Effective";
      color = "text-red-400";
    } else {
      label = language === "ar" ? "عادي" : "Normal";
    }

    return { label, color, damage };
  };

  return (
    <div className="space-y-6">
      {/* Pokemon Headers */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <img
              src={getPokemonArtwork(pokemonA.id)}
              alt={pokemonA.name_en}
              className="w-24 h-24 mx-auto"
            />
            <h3 className="font-bold text-lg mt-2">
              {language === "ar" ? pokemonA.name_ar : pokemonA.name_en}
            </h3>
            <Badge variant="secondary" className="mt-1">
              Lv. {levelA}
            </Badge>
            <div className="flex justify-center gap-1 mt-2">
              {pokemonA.types?.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <img
              src={getPokemonArtwork(pokemonB.id)}
              alt={pokemonB.name_en}
              className="w-24 h-24 mx-auto"
            />
            <h3 className="font-bold text-lg mt-2">
              {language === "ar" ? pokemonB.name_ar : pokemonB.name_en}
            </h3>
            <Badge variant="secondary" className="mt-1">
              Lv. {levelB}
            </Badge>
            <div className="flex justify-center gap-1 mt-2">
              {pokemonB.types?.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Comparison */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t("Stats Comparison", "مقارنة الإحصائيات")}
          </h3>

          <div className="space-y-3">
            {statKeys.map((key) => {
              const StatIcon = statLabels[key].icon;
              const valueA = pokemonA.stats[key];
              const valueB = pokemonB.stats[key];
              const maxVal = Math.max(valueA, valueB, 150);
              const percentA = (valueA / maxVal) * 100;
              const percentB = (valueB / maxVal) * 100;
              const isSpeed = key === "spe";

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 w-16">
                      <StatIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {language === "ar" ? statLabels[key].ar : statLabels[key].en}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-bold",
                        valueA > valueB
                          ? "text-blue-400"
                          : valueA < valueB
                            ? "text-muted-foreground"
                            : "text-foreground",
                      )}
                    >
                      {valueA}
                    </span>
                    {getComparisonIcon(valueA, valueB)}
                    <span
                      className={cn(
                        "font-bold",
                        valueB > valueA
                          ? "text-red-400"
                          : valueB < valueA
                            ? "text-muted-foreground"
                            : "text-foreground",
                      )}
                    >
                      {valueB}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-muted rounded-full overflow-hidden flex justify-end">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isSpeed && valueA > valueB ? "bg-yellow-400" : "bg-blue-500",
                        )}
                        style={{ width: `${percentA}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isSpeed && valueB > valueA ? "bg-yellow-400" : "bg-red-500",
                        )}
                        style={{ width: `${percentB}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium">{t("Total", "المجموع")}</span>
              <span
                className={cn(
                  "font-bold",
                  totalStatsA > totalStatsB ? "text-blue-400" : "text-muted-foreground",
                )}
              >
                {totalStatsA}
              </span>
              {getComparisonIcon(totalStatsA, totalStatsB)}
              <span
                className={cn(
                  "font-bold",
                  totalStatsB > totalStatsA ? "text-red-400" : "text-muted-foreground",
                )}
              >
                {totalStatsB}
              </span>
            </div>
          </div>

          {/* Speed Highlight */}
          {pokemonA.stats.spe !== pokemonB.stats.spe && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <Wind className="w-4 h-4" />
                {pokemonA.stats.spe > pokemonB.stats.spe
                  ? language === "ar"
                    ? `${pokemonA.name_ar} أسرع ويتحرك أولاً!`
                    : `${pokemonA.name_en} is faster and moves first!`
                  : language === "ar"
                    ? `${pokemonB.name_ar} أسرع ويتحرك أولاً!`
                    : `${pokemonB.name_en} is faster and moves first!`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type Matchups */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">
              {language === "ar"
                ? `نقاط ضعف ${pokemonA.name_ar}`
                : `${pokemonA.name_en}'s Weaknesses`}
            </h4>
            <div className="flex flex-wrap gap-1">
              {weaknessesA.length > 0 ? (
                weaknessesA.map((t) => <TypeBadge key={t} type={t} size="sm" />)
              ) : (
                <span className="text-xs text-muted-foreground">{t("None", "لا شيء")}</span>
              )}
            </div>
            <h4 className="font-semibold text-sm mt-3 mb-2">
              {language === "ar" ? "المقاومات" : "Resistances"}
            </h4>
            <div className="flex flex-wrap gap-1">
              {resistancesA.length > 0 ? (
                resistancesA.map((t) => <TypeBadge key={t} type={t} size="sm" />)
              ) : (
                <span className="text-xs text-muted-foreground">{t("None", "لا شيء")}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">
              {language === "ar"
                ? `نقاط ضعف ${pokemonB.name_ar}`
                : `${pokemonB.name_en}'s Weaknesses`}
            </h4>
            <div className="flex flex-wrap gap-1">
              {weaknessesB.length > 0 ? (
                weaknessesB.map((t) => <TypeBadge key={t} type={t} size="sm" />)
              ) : (
                <span className="text-xs text-muted-foreground">{t("None", "لا شيء")}</span>
              )}
            </div>
            <h4 className="font-semibold text-sm mt-3 mb-2">
              {language === "ar" ? "المقاومات" : "Resistances"}
            </h4>
            <div className="flex flex-wrap gap-1">
              {resistancesB.length > 0 ? (
                resistancesB.map((t) => <TypeBadge key={t} type={t} size="sm" />)
              ) : (
                <span className="text-xs text-muted-foreground">{t("None", "لا شيء")}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Damage Hints */}
      {(movesA.length > 0 || movesB.length > 0) && (
        <Card className="border-border">
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              {t("Damage Hints", "تلميحات الضرر")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t(
                "Simplified estimates, not exact calculations",
                "تقديرات مبسطة وليست حسابات دقيقة",
              )}
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* A's moves vs B */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-blue-400">
                  {language === "ar"
                    ? `${pokemonA.name_ar} ← ${pokemonB.name_ar}`
                    : `${pokemonA.name_en} → ${pokemonB.name_en}`}
                </h4>
                <div className="space-y-2">
                  {movesA.map((move, idx) => {
                    const hint = damageHintsA[idx];
                    if (!hint) return null;
                    const damageInfo = getDamageLabel(hint.damage, hint.effectiveness);
                    return (
                      <div key={move.id} className="flex items-center gap-2 text-xs">
                        <TypeBadge type={move.type} size="sm" />
                        <span className="flex-1 truncate">
                          {language === "ar" ? move.name_ar : move.name_en}
                        </span>
                        {damageInfo && (
                          <span className={cn("font-medium", damageInfo.color)}>
                            {damageInfo.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* B's moves vs A */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-red-400">
                  {language === "ar"
                    ? `${pokemonB.name_ar} ← ${pokemonA.name_ar}`
                    : `${pokemonB.name_en} → ${pokemonA.name_en}`}
                </h4>
                <div className="space-y-2">
                  {movesB.map((move, idx) => {
                    const hint = damageHintsB[idx];
                    if (!hint) return null;
                    const damageInfo = getDamageLabel(hint.damage, hint.effectiveness);
                    return (
                      <div key={move.id} className="flex items-center gap-2 text-xs">
                        <TypeBadge type={move.type} size="sm" />
                        <span className="flex-1 truncate">
                          {language === "ar" ? move.name_ar : move.name_en}
                        </span>
                        {damageInfo && (
                          <span className={cn("font-medium", damageInfo.color)}>
                            {damageInfo.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
