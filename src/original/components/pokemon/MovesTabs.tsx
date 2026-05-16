/**
 * MovesTabs Component
 * Organizes moves into tabs: Best moves now, After evolution, Full list
 */

import { useMemo, useState } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/original/components/ui/tabs";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { supabase } from "@/original/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Star, TrendingUp, Layers, Zap, Sword, Sparkles, BookOpen, Info } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { getLocalizedName, AR_PLACEHOLDERS } from "@/original/lib/localization";
import { getDB } from "@/original/lib/db";
import { LearnsetSection } from "./LearnsetSection";

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

interface EvolutionInfo {
  evolutionIds: number[];
  hasEvolution: boolean;
}

interface Props {
  pokemonId: number;
  pokemonName?: string;
  pokemonTypes: string[];
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  evolutionInfo?: EvolutionInfo;
}

export function MovesTabs({ pokemonId, pokemonName, pokemonTypes, stats, evolutionInfo }: Props) {
  const { tr, language } = useLanguage();
  const { selectedGame } = useGameFilter();
  const [activeTab, setActiveTab] = useState("best");

  // Fetch learnsets for this pokemon
  const { data: learnsets } = useQuery({
    queryKey: ["learnsets-tabs", pokemonId, selectedGame],
    queryFn: async () => {
      try {
        const db = await getDB();
        const allLearnsets = await db.getAll("learnsets");
        const filtered = allLearnsets.filter(
          (ls) =>
            ls.pokemon_id === pokemonId && (selectedGame === "all" || ls.game_id === selectedGame),
        );
        if (filtered.length > 0) return filtered as unknown as Learnset[];
      } catch (e) {
        console.warn("IndexedDB read failed");
      }

      let query = supabase.from("learnsets").select("*").eq("pokemon_id", pokemonId);
      if (selectedGame !== "all") query = query.eq("game_id", selectedGame);
      const { data } = await query;
      return (data || []) as Learnset[];
    },
  });

  // Fetch evolution learnsets if there's an evolution
  const { data: evolutionLearnsets } = useQuery({
    queryKey: ["evolution-learnsets-tabs", evolutionInfo?.evolutionIds, selectedGame],
    queryFn: async () => {
      if (!evolutionInfo?.hasEvolution || !evolutionInfo.evolutionIds.length) return [];

      try {
        const db = await getDB();
        const allLearnsets = await db.getAll("learnsets");
        const filtered = allLearnsets.filter(
          (ls) =>
            evolutionInfo.evolutionIds.includes(ls.pokemon_id) &&
            (selectedGame === "all" || ls.game_id === selectedGame),
        );
        if (filtered.length > 0) return filtered as unknown as Learnset[];
      } catch (e) {
        console.warn("IndexedDB read failed");
      }

      let query = supabase
        .from("learnsets")
        .select("*")
        .in("pokemon_id", evolutionInfo.evolutionIds);
      if (selectedGame !== "all") query = query.eq("game_id", selectedGame);
      const { data } = await query;
      return (data || []) as Learnset[];
    },
    enabled: evolutionInfo?.hasEvolution && evolutionInfo.evolutionIds.length > 0,
  });

  // Fetch all moves
  const { data: allMoves } = useQuery({
    queryKey: ["all-moves-tabs"],
    queryFn: async () => {
      try {
        const db = await getDB();
        const cached = await db.getAll("moves");
        if (cached.length > 0) return cached as unknown as Move[];
      } catch (e) {
        console.warn("IndexedDB read failed");
      }
      const { data } = await supabase.from("moves").select("*");
      return (data || []) as Move[];
    },
  });

  // Calculate best moves now (STAB + coverage)
  const bestMoves = useMemo(() => {
    if (!learnsets || !allMoves) return [];

    const learnableMoveIds = new Set(learnsets.map((ls) => ls.move_id));
    const learnableMoves = allMoves.filter((m) => learnableMoveIds.has(m.id));
    const isPhysicalAttacker = stats.atk >= stats.spa;
    const preferredCategory = isPhysicalAttacker ? "physical" : "special";

    const scoredMoves = learnableMoves
      .filter((m) => m.power && m.power > 0)
      .map((move) => {
        let score = 0;
        const moveType = move.type.toLowerCase();
        const isSTAB = pokemonTypes.some((t) => t.toLowerCase() === moveType);

        if (isSTAB) score += 50;
        score += (move.power || 0) * 0.5;
        if (move.accuracy && move.accuracy < 100) score -= (100 - move.accuracy) * 0.3;
        if (move.category === preferredCategory) score += 20;
        if (!isSTAB) score += 15; // Coverage bonus

        // Get explanation
        let explanation = "";
        if (isSTAB) {
          explanation = language === "ar" ? "نفس النوع = ضرر +50%" : "Same type = +50% damage";
        } else {
          explanation = language === "ar" ? "تغطية لنقاط الضعف" : "Coverage for weaknesses";
        }

        return { move, score, isSTAB, explanation };
      })
      .sort((a, b) => b.score - a.score);

    // Select top 6 with type variety
    const selected: typeof scoredMoves = [];
    const usedTypes = new Set<string>();

    // First get STAB moves
    for (const item of scoredMoves) {
      if (item.isSTAB && selected.length < 2 && !usedTypes.has(item.move.type)) {
        selected.push(item);
        usedTypes.add(item.move.type);
      }
    }

    // Then coverage moves
    for (const item of scoredMoves) {
      if (selected.length >= 6) break;
      if (!usedTypes.has(item.move.type)) {
        selected.push(item);
        usedTypes.add(item.move.type);
      }
    }

    return selected.slice(0, 6);
  }, [learnsets, allMoves, pokemonTypes, stats, language]);

  // Calculate moves available after evolution
  const afterEvolutionMoves = useMemo(() => {
    if (!evolutionLearnsets || !allMoves || !learnsets) return [];

    const currentMoveIds = new Set(learnsets.map((ls) => ls.move_id));
    const evolutionMoveIds = new Set(evolutionLearnsets.map((ls) => ls.move_id));

    // Find moves exclusive to evolutions
    const newMoveIds = [...evolutionMoveIds].filter((id) => !currentMoveIds.has(id));
    const newMoves = allMoves.filter((m) => newMoveIds.includes(m.id));

    // Score and sort by power
    return newMoves
      .filter((m) => m.power && m.power > 0)
      .map((move) => {
        const moveType = move.type.toLowerCase();
        const isSTAB = pokemonTypes.some((t) => t.toLowerCase() === moveType);
        return { move, isSTAB };
      })
      .sort((a, b) => (b.move.power || 0) - (a.move.power || 0))
      .slice(0, 8);
  }, [evolutionLearnsets, allMoves, learnsets, pokemonTypes]);

  const hasEvolutionMoves = afterEvolutionMoves.length > 0;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {tr("pokemon.moves")}
        </h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="best" className="gap-1 text-xs sm:text-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tr("moves.bestNow")}</span>
              <span className="sm:hidden">{language === "ar" ? "الأفضل" : "Best"}</span>
            </TabsTrigger>
            <TabsTrigger
              value="evolution"
              className="gap-1 text-xs sm:text-sm"
              disabled={!hasEvolutionMoves}
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tr("moves.afterEvolution")}</span>
              <span className="sm:hidden">{language === "ar" ? "التطور" : "Evo"}</span>
            </TabsTrigger>
            <TabsTrigger value="full" className="gap-1 text-xs sm:text-sm">
              <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tr("moves.fullList")}</span>
              <span className="sm:hidden">{language === "ar" ? "الكل" : "All"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Best Moves Now */}
          <TabsContent value="best" className="mt-0">
            {bestMoves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>{tr("move.noMoves")}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {tr("moves.bestNowDesc")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bestMoves.map(({ move, isSTAB, explanation }) => (
                    <div
                      key={move.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all",
                        isSTAB ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border",
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {getLocalizedName(move.name_en, move.name_ar, language)}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {language === "ar" ? move.name_en : move.name_ar}
                          </p>
                        </div>
                        <TypeBadge type={move.type} size="sm" />
                      </div>

                      {/* Why recommended */}
                      <div className="flex items-center gap-1 mb-2">
                        {isSTAB ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] gap-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            STAB
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] gap-0.5">
                            <Sword className="w-2.5 h-2.5" />
                            {tr("move.coverage")}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 text-xs">
                        {move.power && (
                          <span className="text-orange-400 font-medium">⚔️ {move.power}</span>
                        )}
                        {move.accuracy && (
                          <span className="text-blue-400">🎯 {move.accuracy}%</span>
                        )}
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded",
                            move.category === "physical"
                              ? "bg-red-500/20 text-red-400"
                              : move.category === "special"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400",
                          )}
                        >
                          {move.category === "physical"
                            ? language === "ar"
                              ? "فيزيائي"
                              : "Physical"
                            : move.category === "special"
                              ? language === "ar"
                                ? "خاص"
                                : "Special"
                              : language === "ar"
                                ? "حالة"
                                : "Status"}
                        </span>
                      </div>

                      {/* Explanation */}
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-primary" />
                        {explanation}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground mt-3 text-center">
                  {tr("move.basedOnProfile").replace(
                    "{type}",
                    stats.atk >= stats.spa ? tr("move.physical") : tr("move.special"),
                  )}
                </p>
              </>
            )}
          </TabsContent>

          {/* After Evolution */}
          <TabsContent value="evolution" className="mt-0">
            {!hasEvolutionMoves ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>{tr("moves.noEvolutionMoves")}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {tr("moves.afterEvolutionDesc")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {afterEvolutionMoves.map(({ move, isSTAB }) => (
                    <div
                      key={move.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all",
                        isSTAB
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-muted/50 border-border",
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {getLocalizedName(move.name_en, move.name_ar, language)}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {language === "ar" ? move.name_en : move.name_ar}
                          </p>
                        </div>
                        <TypeBadge type={move.type} size="sm" />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">
                          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                          {tr("moves.newMove")}
                        </Badge>
                        {isSTAB && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px]">
                            STAB
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs mt-2">
                        {move.power && (
                          <span className="text-orange-400 font-medium">⚔️ {move.power}</span>
                        )}
                        {move.accuracy && (
                          <span className="text-blue-400">🎯 {move.accuracy}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Full List */}
          <TabsContent value="full" className="mt-0">
            <LearnsetSection pokemonId={pokemonId} pokemonName={pokemonName} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
