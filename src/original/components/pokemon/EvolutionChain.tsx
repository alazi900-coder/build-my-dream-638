/**
 * Evolution Chain Component
 * Displays Pokemon evolution chain with support for branching evolutions, RTL, and game filtering.
 * Uses the evolution module utilities for O(1) lookups.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  TrendingUp,
  HelpCircle,
  Ban,
  TrendingUp as StatUp,
} from "lucide-react";

// Extended PokemonBasic with stats for evolution comparison
interface PokemonBasicWithStats extends PokemonBasic {
  stats?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } | null;
}
import { cn } from "@/original/lib/utils";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import { getItemSpriteUrl } from "@/original/lib/itemUtils";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { useQuery } from "@tanstack/react-query";
import { getLocalizedName, AR_PLACEHOLDERS } from "@/original/lib/localization";
import { getAllEvolutionNodes, getAllItems, getAllPokemon } from "@/original/lib/store/dataStore";
import {
  EvolutionNodeDB,
  PokemonBasic,
  ItemBasic,
  buildEvolutionChain,
  hasEvolutionData,
} from "@/original/lib/evolution";

interface Props {
  pokemonId: number;
  currentPokemon: PokemonBasic;
  compact?: boolean;
  showFullDetails?: boolean;
}

export function EvolutionChain({
  pokemonId,
  currentPokemon,
  compact = false,
  showFullDetails = false,
}: Props) {
  const navigate = useNavigate();
  const { tr, language } = useLanguage();
  const { selectedGame, isAvailableInGame } = useGameFilter();
  const isRtl = language === "ar";

  const { data: evolutionNodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ["evolution-chain-nodes"],
    queryFn: async () => getAllEvolutionNodes() as Promise<EvolutionNodeDB[]>,
    staleTime: 1000 * 60 * 30,
  });

  const { data: allPokemon = [], isLoading: pokemonLoading } = useQuery({
    queryKey: ["all-pokemon-evolution-with-stats"],
    queryFn: async () => {
      const data = await getAllPokemon();
      return data.map((p) => ({
        id: p.id,
        name_en: p.name_en,
        name_ar: p.name_ar,
        available_in: p.available_in,
        stats: p.stats,
      })) as PokemonBasicWithStats[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["all-items-evolution"],
    queryFn: async () => {
      const data = await getAllItems();
      return data.map((i) => ({
        id: i.id,
        name_en: i.name_en,
        name_ar: i.name_ar,
      })) as ItemBasic[];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Build evolution chain using the evolution module - O(1) lookups
  const evolutionChain = useMemo(() => {
    if (allPokemon.length === 0) return null;
    return buildEvolutionChain(
      pokemonId,
      currentPokemon,
      evolutionNodes,
      allPokemon,
      items,
      language,
    );
  }, [evolutionNodes, allPokemon, items, pokemonId, currentPokemon, language]);

  // Helper to get item info by ID
  const getItemById = useMemo(() => {
    const itemMap = new Map(items.map((i) => [i.id, i]));
    return (itemId: number | null | undefined) => {
      if (!itemId) return null;
      return itemMap.get(itemId) || null;
    };
  }, [items]);

  // Helper to get Pokemon stats by ID
  const getPokemonStats = useMemo(() => {
    const pokemonMap = new Map(allPokemon.map((p) => [p.id, p.stats]));
    return (id: number) => pokemonMap.get(id) || null;
  }, [allPokemon]);

  // Calculate stat improvements between evolution stages
  const getStatImprovements = (fromId: number, toId: number) => {
    const fromStats = getPokemonStats(fromId);
    const toStats = getPokemonStats(toId);
    if (!fromStats || !toStats) return [];

    const statNames: Record<string, { ar: string; en: string }> = {
      hp: { ar: "ص", en: "HP" },
      atk: { ar: "هج", en: "ATK" },
      def: { ar: "دف", en: "DEF" },
      spa: { ar: "هخ", en: "SPA" },
      spd: { ar: "دخ", en: "SPD" },
      spe: { ar: "سر", en: "SPE" },
    };

    const improvements: { stat: string; diff: number; label: { ar: string; en: string } }[] = [];

    (Object.keys(statNames) as Array<keyof typeof statNames>).forEach((stat) => {
      const diff = (toStats as any)[stat] - (fromStats as any)[stat];
      if (diff > 0) {
        improvements.push({ stat, diff, label: statNames[stat] });
      }
    });

    // Sort by biggest improvement first
    return improvements.sort((a, b) => b.diff - a.diff).slice(0, 3);
  };

  // Loading state
  if (nodesLoading || pokemonLoading) {
    if (compact) {
      return (
        <div className="flex items-center justify-center py-2">
          <div className="animate-pulse text-white/60 text-sm">
            {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
          </div>
        </div>
      );
    }
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {tr("pokemon.evolutionChain")}
          </h2>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No evolution data
  if (!hasEvolutionData(evolutionChain)) {
    if (compact) {
      return (
        <div className="text-center py-1">
          <p className="text-white/60 text-xs">{tr("pokemon.notEvolved")}</p>
        </div>
      );
    }
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {tr("pokemon.evolution")}
          </h2>
          <div className="text-center py-4">
            <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{tr("pokemon.notEvolved")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stages, hasBranching, totalPokemon } = evolutionChain;
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Compact view for hero section
  if (compact) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-white/80" />
          <span className="text-white/90 text-sm font-medium">
            {language === "ar" ? "سلسلة التطور" : "Evolution Chain"}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3">
          {stages.map((stageNodes, stageIndex) => (
            <div key={stageIndex} className="flex items-center gap-2 shrink-0">
              {stageIndex > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                  <ArrowIcon className="w-5 h-5 text-white/70 animate-pulse" />
                  {stageNodes[0]?.evolvesFrom && (
                    <span className="text-[9px] text-white/60 text-center max-w-[65px] leading-tight whitespace-nowrap">
                      {language === "ar"
                        ? stageNodes[0].evolvesFrom.method_ar
                        : stageNodes[0].evolvesFrom.method_en}
                    </span>
                  )}
                </div>
              )}

              {stageNodes.length > 1 ? (
                <div className="flex items-center gap-1">
                  {stageNodes.slice(0, 3).map((node, idx) => {
                    const isCurrentPokemon = node.pokemon.id === pokemonId;
                    return (
                      <button
                        key={node.pokemon.id}
                        onClick={() => {
                          if (!isCurrentPokemon) {
                            navigate(`/pokemon/${node.pokemon.id}`);
                          }
                        }}
                        className={cn(
                          "relative w-14 h-14 rounded-full transition-all",
                          isCurrentPokemon
                            ? "ring-2 ring-yellow-400 bg-white/30 scale-110"
                            : "bg-white/10 hover:bg-white/20 cursor-pointer hover:scale-105",
                          idx > 0 && "-ml-3",
                        )}
                        style={{ zIndex: stageNodes.length - idx }}
                      >
                        <img
                          src={getPokemonArtwork(node.pokemon.id)}
                          alt={node.pokemon.name_en}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                  {stageNodes.length > 3 && (
                    <span className="text-white/70 text-xs ml-1">+{stageNodes.length - 3}</span>
                  )}
                </div>
              ) : (
                stageNodes.map((node) => {
                  const isCurrentPokemon = node.pokemon.id === pokemonId;
                  return (
                    <button
                      key={node.pokemon.id}
                      onClick={() => {
                        if (!isCurrentPokemon) {
                          navigate(`/pokemon/${node.pokemon.id}`);
                        }
                      }}
                      className={cn(
                        "relative w-14 h-14 rounded-full transition-all",
                        isCurrentPokemon
                          ? "ring-2 ring-yellow-400 bg-white/30 scale-110"
                          : "bg-white/10 hover:bg-white/20 cursor-pointer hover:scale-105",
                      )}
                    >
                      <img
                        src={getPokemonArtwork(node.pokemon.id)}
                        alt={node.pokemon.name_en}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  );
                })
              )}
            </div>
          ))}
        </div>
        {hasBranching && (
          <p className="text-[10px] text-white/60 mt-2 text-center">
            {language === "ar" ? `${totalPokemon - 1} تطورات` : `${totalPokemon - 1} evolutions`}
          </p>
        )}
      </div>
    );
  }

  // Use CSS dir for RTL - don't reverse array to keep evolution order correct
  const visualStages = stages;

  // Full view - RTL-aware display
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <h2 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {tr("pokemon.evolutionChain")}
          {hasBranching && (
            <Badge variant="secondary" className="text-[10px]">
              {language === "ar" ? "متفرع" : "Branching"}
            </Badge>
          )}
        </h2>

        {/* Evolution stages - RTL-aware with horizontal scroll */}
        <div
          className="flex items-center justify-start gap-2 md:gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x snap-mandatory"
          dir={isRtl ? "rtl" : "ltr"}
          style={{ scrollBehavior: "smooth" }}
        >
          {visualStages.map((stageNodes, stageIndex) => (
            <div key={stageIndex} className="flex items-center gap-2 md:gap-3 shrink-0 snap-start">
              {/* Arrow between stages - show only for non-branching or first arrow */}
              {stageIndex > 0 &&
                stageNodes.length === 1 &&
                (() => {
                  // Get previous stage Pokemon ID for stat comparison
                  const prevStageIndex = isRtl ? stageIndex + 1 : stageIndex - 1;
                  const actualPrevIndex = isRtl ? visualStages.length - stageIndex : stageIndex - 1;
                  const prevStage = stages[actualPrevIndex];
                  const prevPokemonId =
                    prevStage && prevStage.length === 1 ? prevStage[0].pokemon.id : null;
                  const currentEvoPokemonId = stageNodes[0].pokemon.id;
                  const statImprovements = prevPokemonId
                    ? getStatImprovements(prevPokemonId, currentEvoPokemonId)
                    : [];

                  return (
                    <div className="flex flex-col items-center gap-1 shrink-0 min-w-[70px] md:min-w-[90px]">
                      {/* Evolution item image if applicable */}
                      {stageNodes[0]?.evolvesFrom?.itemId &&
                        (() => {
                          const item = getItemById(stageNodes[0].evolvesFrom.itemId);
                          if (item) {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/items/${stageNodes[0].evolvesFrom!.itemId}`);
                                }}
                                className="relative group cursor-pointer"
                                title={getLocalizedName(item.name_en, item.name_ar, language)}
                              >
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:border-primary/60 overflow-hidden">
                                  <OfflineImage
                                    src={getItemSpriteUrl(item.name_en)}
                                    alt={getLocalizedName(item.name_en, item.name_ar, language)}
                                    className="w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow-sm"
                                  />
                                </div>
                                {/* Item name tooltip */}
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  <span className="text-[8px] text-primary bg-background/95 px-1.5 py-0.5 rounded border border-primary/30 shadow-md">
                                    {getLocalizedName(item.name_en, item.name_ar, language)}
                                  </span>
                                </div>
                              </button>
                            );
                          }
                          return null;
                        })()}

                      {/* Evolution method badge */}
                      {stageNodes[0]?.evolvesFrom && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] md:text-[10px] px-2 py-0.5 whitespace-nowrap",
                            stageNodes[0].evolvesFrom.itemId
                              ? "bg-accent/20 border-accent/40 text-accent"
                              : stageNodes[0].evolvesFrom.methodType === "trade"
                                ? "bg-secondary/20 border-secondary/40 text-secondary"
                                : stageNodes[0].evolvesFrom.methodType === "friendship"
                                  ? "bg-chart-1/20 border-chart-1/40 text-chart-1"
                                  : "bg-muted/60 border-primary/30",
                          )}
                        >
                          <span dir={isRtl ? "rtl" : "ltr"}>
                            {language === "ar"
                              ? stageNodes[0].evolvesFrom.method_ar
                              : stageNodes[0].evolvesFrom.method_en}
                          </span>
                        </Badge>
                      )}

                      {/* Animated arrow - direction based on language */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 animate-ping opacity-20" />
                        <ArrowIcon className="w-5 h-5 md:w-6 md:h-6 text-primary animate-pulse" />
                      </div>

                      {statImprovements.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-0.5 mt-0.5">
                          {statImprovements.map((imp) => (
                            <span
                              key={imp.stat}
                              className="text-[7px] md:text-[8px] text-chart-4 bg-chart-4/10 px-1 py-0.5 rounded flex items-center gap-0.5"
                              dir="ltr"
                            >
                              <StatUp className="w-2 h-2" />+{imp.diff}{" "}
                              {language === "ar" ? imp.label.ar : imp.label.en}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Branching evolutions - Tree layout */}
              {stageIndex > 0 &&
                stageNodes.length > 1 &&
                (() => {
                  // Get previous stage Pokemon for stat comparison
                  const actualPrevIndex = isRtl ? visualStages.length - stageIndex : stageIndex - 1;
                  const prevStage = stages[actualPrevIndex];
                  const prevPokemonId =
                    prevStage && prevStage.length === 1 ? prevStage[0].pokemon.id : null;

                  return (
                    <div
                      className={cn(
                        "flex items-center shrink-0",
                        isRtl ? "flex-row-reverse" : "flex-row",
                      )}
                    >
                      {/* Branching arrow connector */}
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center",
                          isRtl ? "ml-2" : "mr-2",
                        )}
                      >
                        <ArrowIcon className="w-4 h-4 text-primary animate-pulse" />
                      </div>

                      {/* Tree branches container */}
                      <div className="relative flex flex-col gap-1">
                        {/* Vertical line connecting branches */}
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-0.5 bg-gradient-to-b from-primary/60 via-primary to-primary/60 rounded-full",
                            isRtl ? "right-0" : "left-0",
                          )}
                          style={{ height: `${Math.min(stageNodes.length * 65, 280)}px` }}
                        />

                        {stageNodes.map((node, nodeIndex) => {
                          const isCurrentPokemon = node.pokemon.id === pokemonId;
                          const availableIn = node.pokemon.available_in as
                            | string[]
                            | null
                            | undefined;
                          const isAvailable =
                            selectedGame === "all" || isAvailableInGame(availableIn);
                          const item = node.evolvesFrom?.itemId
                            ? getItemById(node.evolvesFrom.itemId)
                            : null;
                          const branchStatImprovements = prevPokemonId
                            ? getStatImprovements(prevPokemonId, node.pokemon.id)
                            : [];

                          return (
                            <div
                              key={node.pokemon.id}
                              className={cn(
                                "flex items-center gap-1",
                                isRtl ? "pr-2 flex-row-reverse" : "pl-2",
                              )}
                            >
                              {/* Horizontal branch line */}
                              <div className="w-3 h-0.5 bg-primary/60 rounded-full" />

                              {/* Evolution method for this specific branch */}
                              <div className="flex flex-col items-center gap-0.5 min-w-[45px] md:min-w-[55px]">
                                {/* Item image if applicable */}
                                {item && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/items/${node.evolvesFrom!.itemId}`);
                                    }}
                                    className="group cursor-pointer"
                                    title={getLocalizedName(item.name_en, item.name_ar, language)}
                                  >
                                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center transition-all duration-200 group-hover:scale-105 overflow-hidden">
                                      <OfflineImage
                                        src={getItemSpriteUrl(item.name_en)}
                                        alt={getLocalizedName(item.name_en, item.name_ar, language)}
                                        className="w-4 h-4 md:w-5 md:h-5 object-contain"
                                      />
                                    </div>
                                  </button>
                                )}

                                {/* Method badge */}
                                {node.evolvesFrom && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[6px] md:text-[7px] px-1 py-0 whitespace-nowrap",
                                      node.evolvesFrom.itemId
                                        ? "bg-accent/20 border-accent/40 text-accent"
                                        : node.evolvesFrom.methodType === "trade"
                                          ? "bg-secondary/20 border-secondary/40 text-secondary"
                                          : node.evolvesFrom.methodType === "friendship"
                                            ? "bg-chart-1/20 border-chart-1/40 text-chart-1"
                                            : "bg-muted/60 border-primary/30",
                                    )}
                                  >
                                    <span
                                      dir={isRtl ? "rtl" : "ltr"}
                                      className="truncate max-w-[50px]"
                                    >
                                      {language === "ar"
                                        ? node.evolvesFrom.method_ar
                                        : node.evolvesFrom.method_en}
                                    </span>
                                  </Badge>
                                )}

                                {/* Stat improvements for branch */}
                                {branchStatImprovements.length > 0 && (
                                  <div className="flex flex-wrap items-center justify-center gap-0.5">
                                    {branchStatImprovements.slice(0, 2).map((imp) => (
                                      <span
                                        key={imp.stat}
                                        className="text-[6px] text-chart-4 bg-chart-4/10 px-0.5 py-0 rounded flex items-center gap-0.5"
                                        dir="ltr"
                                      >
                                        +{imp.diff}{" "}
                                        {language === "ar" ? imp.label.ar : imp.label.en}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Small arrow - direction based on language */}
                              <ArrowIcon className="w-3 h-3 text-primary/70 shrink-0" />

                              {/* Pokemon card - compact for branches */}
                              <button
                                onClick={() => {
                                  if (!isCurrentPokemon && isAvailable) {
                                    navigate(`/pokemon/${node.pokemon.id}`);
                                  }
                                }}
                                disabled={isCurrentPokemon || !isAvailable}
                                className={cn(
                                  "group flex flex-col items-center p-1.5 rounded-lg transition-all duration-300 relative overflow-hidden",
                                  "min-w-[60px] md:min-w-[75px]",
                                  isCurrentPokemon
                                    ? "bg-primary/20 border-2 border-primary shadow-md shadow-primary/30 cursor-default"
                                    : !isAvailable
                                      ? "bg-muted/30 border border-border/50 cursor-not-allowed opacity-60"
                                      : "bg-muted/50 border border-border hover:border-primary hover:bg-muted/80 cursor-pointer hover:scale-105 hover:shadow-md",
                                )}
                                style={{
                                  animation: isCurrentPokemon
                                    ? "glow 2s ease-in-out infinite alternate"
                                    : undefined,
                                }}
                              >
                                {!isAvailable && !isCurrentPokemon && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-lg z-10">
                                    <Ban className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                )}

                                {isCurrentPokemon && (
                                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
                                    <Badge
                                      variant="default"
                                      className="text-[6px] px-1 py-0 gap-0.5 bg-primary shadow-md whitespace-nowrap animate-pulse"
                                    >
                                      <Sparkles className="w-2 h-2" />
                                      {language === "ar" ? "هنا" : "Here"}
                                    </Badge>
                                  </div>
                                )}

                                <div
                                  className={cn(
                                    "relative w-12 h-12 md:w-14 md:h-14 transition-transform duration-300 overflow-hidden",
                                    !isAvailable && "grayscale",
                                    !isCurrentPokemon && isAvailable && "group-hover:scale-105",
                                  )}
                                >
                                  {isCurrentPokemon && (
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
                                  )}
                                  <img
                                    src={getPokemonArtwork(node.pokemon.id)}
                                    alt={getLocalizedName(
                                      node.pokemon.name_en,
                                      node.pokemon.name_ar,
                                      language,
                                    )}
                                    className="w-full h-full object-contain relative z-10 drop-shadow-sm"
                                    loading="lazy"
                                  />
                                </div>

                                <span
                                  className="text-[9px] md:text-[10px] font-semibold text-foreground mt-0.5 text-center leading-tight truncate max-w-full"
                                  dir={isRtl ? "rtl" : "ltr"}
                                >
                                  {getLocalizedName(
                                    node.pokemon.name_en,
                                    node.pokemon.name_ar,
                                    language,
                                  )}
                                </span>

                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[7px] mt-0.5 px-1",
                                    isCurrentPokemon && "bg-primary/30",
                                  )}
                                >
                                  #{node.pokemon.id.toString().padStart(3, "0")}
                                </Badge>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              {/* Pokemon cards for non-branching stage */}
              {stageNodes.length === 1 && (
                <div className="flex gap-2 flex-row items-center">
                  {stageNodes.map((node) => {
                    const isCurrentPokemon = node.pokemon.id === pokemonId;
                    const availableIn = node.pokemon.available_in as string[] | null | undefined;
                    const isAvailable = selectedGame === "all" || isAvailableInGame(availableIn);

                    return (
                      <button
                        key={node.pokemon.id}
                        onClick={() => {
                          if (!isCurrentPokemon && isAvailable) {
                            navigate(`/pokemon/${node.pokemon.id}`);
                          }
                        }}
                        disabled={isCurrentPokemon || !isAvailable}
                        className={cn(
                          "group flex flex-col items-center p-2 md:p-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                          "min-w-[80px] md:min-w-[100px]",
                          isCurrentPokemon
                            ? "bg-primary/20 border-2 border-primary shadow-lg shadow-primary/30 cursor-default"
                            : !isAvailable
                              ? "bg-muted/30 border border-border/50 cursor-not-allowed opacity-60"
                              : "bg-muted/50 border border-border hover:border-primary hover:bg-muted/80 cursor-pointer hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg",
                        )}
                        style={{
                          animation: isCurrentPokemon
                            ? "glow 2s ease-in-out infinite alternate"
                            : undefined,
                        }}
                      >
                        {/* Not available overlay */}
                        {!isAvailable && !isCurrentPokemon && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-xl z-10">
                            <Ban className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}

                        {/* "You are here" badge */}
                        {isCurrentPokemon && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20">
                            <Badge
                              variant="default"
                              className="text-[8px] md:text-[9px] px-1.5 py-0.5 gap-0.5 bg-primary shadow-lg whitespace-nowrap animate-pulse"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              {language === "ar" ? "أنت هنا" : "You are here"}
                            </Badge>
                          </div>
                        )}

                        {/* Pokemon artwork - sized to fit container */}
                        <div
                          className={cn(
                            "relative w-16 h-16 md:w-20 md:h-20 transition-transform duration-300 overflow-hidden",
                            !isAvailable && "grayscale",
                            !isCurrentPokemon && isAvailable && "group-hover:scale-105",
                          )}
                        >
                          {/* Glow effect for current pokemon */}
                          {isCurrentPokemon && (
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                          )}
                          <img
                            src={getPokemonArtwork(node.pokemon.id)}
                            alt={getLocalizedName(
                              node.pokemon.name_en,
                              node.pokemon.name_ar,
                              language,
                            )}
                            className="w-full h-full object-contain relative z-10 drop-shadow-md"
                            loading="lazy"
                          />
                        </div>

                        {/* Pokemon name */}
                        <span
                          className="text-[10px] md:text-xs font-semibold text-foreground mt-1.5 text-center leading-tight"
                          dir={isRtl ? "rtl" : "ltr"}
                        >
                          {getLocalizedName(node.pokemon.name_en, node.pokemon.name_ar, language)}
                        </span>

                        {/* Pokemon ID badge */}
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] mt-0.5 px-1.5",
                            isCurrentPokemon && "bg-primary/30 text-primary-foreground",
                          )}
                        >
                          #{node.pokemon.id.toString().padStart(3, "0")}
                        </Badge>

                        {!isAvailable && (
                          <span className="text-[7px] text-muted-foreground mt-0.5 text-center">
                            {AR_PLACEHOLDERS.notAvailable}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {hasBranching && (
          <p className="text-xs text-muted-foreground mt-4 text-center" dir={isRtl ? "rtl" : "ltr"}>
            {language === "ar"
              ? `هذا البوكيمون له ${totalPokemon - 1} تطورات مختلفة`
              : `This Pokémon has ${totalPokemon - 1} different evolutions`}
          </p>
        )}
      </CardContent>

      {/* CSS for glow animation */}
      <style>{`
        @keyframes glow {
          from {
            box-shadow: 0 0 10px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.2);
          }
          to {
            box-shadow: 0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3);
          }
        }
      `}</style>
    </Card>
  );
}

// Re-export for backward compatibility
export { EvolutionChain as EvolutionChainSectionNew };
