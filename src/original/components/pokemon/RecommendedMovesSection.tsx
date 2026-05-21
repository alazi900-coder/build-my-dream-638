import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { useQuery } from "@tanstack/react-query";
import { getAllMoves, getLearnsetsByPokemon } from "@/original/lib/store/dataStore";
import { Lightbulb, AlertTriangle, Zap, Sword } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect_en: string | null;
  effect_ar: string | null;
}

interface Learnset {
  id: number;
  pokemon_id: number;
  move_id: number;
  learn_method: string;
  level: number | null;
  game_id: string;
}

interface Props {
  pokemonId: number;
  pokemonTypes: string[];
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
}

export function RecommendedMovesSection({ pokemonId, pokemonTypes, stats }: Props) {
  const { tr, language } = useLanguage();

  const { data: learnsets } = useQuery({
    queryKey: ["learnsets-for-recommendations", pokemonId],
    queryFn: async () => getLearnsetsByPokemon(pokemonId),
  });

  const { data: allMoves } = useQuery({
    queryKey: ["all-moves-for-recommendations"],
    queryFn: async () => getAllMoves() as Promise<Move[]>,
  });

  // Calculate recommended moves
  const recommendedMoves = useMemo(() => {
    if (!learnsets || !allMoves) return [];

    // Get moves this pokemon can learn
    const learnableMoveIds = new Set(learnsets.map((ls) => ls.move_id));
    const learnableMoves = allMoves.filter((m) => learnableMoveIds.has(m.id));

    // Determine if pokemon is physical or special attacker
    const isPhysicalAttacker = stats.atk >= stats.spa;
    const preferredCategory = isPhysicalAttacker ? "physical" : "special";

    // Score each move
    const scoredMoves = learnableMoves
      .filter((m) => m.power && m.power > 0) // Only damaging moves
      .map((move) => {
        let score = 0;
        const moveType = move.type.toLowerCase();

        // STAB bonus (Same Type Attack Bonus)
        const isSTAB = pokemonTypes.some((t) => t.toLowerCase() === moveType);
        if (isSTAB) {
          score += 50; // High priority for STAB
        }

        // Power score
        score += (move.power || 0) * 0.5;

        // Accuracy penalty
        if (move.accuracy && move.accuracy < 100) {
          score -= (100 - move.accuracy) * 0.3;
        }

        // Category preference
        if (move.category === preferredCategory) {
          score += 20;
        } else if (move.category === "status") {
          score -= 30; // We're looking for attacking moves
        }

        // Coverage bonus (types that aren't STAB provide coverage)
        if (!isSTAB) {
          score += 15; // Some bonus for coverage
        }

        return { move, score, isSTAB };
      })
      .sort((a, b) => b.score - a.score);

    // Select top 4 moves with variety
    const selected: typeof scoredMoves = [];
    const usedTypes = new Set<string>();

    // First, get best STAB moves
    for (const item of scoredMoves) {
      if (item.isSTAB && selected.length < 2) {
        if (!usedTypes.has(item.move.type)) {
          selected.push(item);
          usedTypes.add(item.move.type);
        }
      }
    }

    // Then, get best coverage moves
    for (const item of scoredMoves) {
      if (selected.length >= 4) break;
      if (!usedTypes.has(item.move.type)) {
        selected.push(item);
        usedTypes.add(item.move.type);
      }
    }

    // Fill remaining slots if needed
    for (const item of scoredMoves) {
      if (selected.length >= 4) break;
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }

    return selected.slice(0, 4);
  }, [learnsets, allMoves, pokemonTypes, stats]);

  if (recommendedMoves.length === 0) {
    return null;
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <h2 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          {tr("pokemon.recommended")}
        </h2>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400">{tr("move.recommendationNote")}</p>
        </div>

        {/* Recommended Moves Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendedMoves.map(({ move, isSTAB }) => (
            <div
              key={move.id}
              className={cn(
                "p-3 rounded-xl border transition-all",
                isSTAB ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border",
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {language === "ar" ? move.name_ar : move.name_en}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "ar" ? move.name_en : move.name_ar}
                  </p>
                </div>
                <TypeBadge type={move.type} size="sm" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isSTAB && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                    <Zap className="w-2.5 h-2.5 mr-0.5" />
                    STAB
                  </Badge>
                )}
                {!isSTAB && (
                  <Badge variant="outline" className="text-[10px]">
                    <Sword className="w-2.5 h-2.5 mr-0.5" />
                    {tr("move.coverage")}
                  </Badge>
                )}
                {move.power && (
                  <Badge variant="secondary" className="text-[10px]">
                    {tr("move.power")}: {move.power}
                  </Badge>
                )}
                {move.accuracy && (
                  <Badge variant="secondary" className="text-[10px]">
                    {tr("move.accuracy")}: {move.accuracy}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          {tr("move.basedOnProfile").replace(
            "{type}",
            stats.atk >= stats.spa ? tr("move.physical") : tr("move.special"),
          )}
        </p>
      </CardContent>
    </Card>
  );
}
