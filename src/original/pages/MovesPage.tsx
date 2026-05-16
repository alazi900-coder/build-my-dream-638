import { useState, useMemo, useEffect, useCallback } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Move } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { SearchBar } from "@/original/components/ui/search-bar";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { EmptyState } from "@/original/components/ui/empty-state";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/original/components/ui/dialog";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { Textarea } from "@/original/components/ui/textarea";
import { Progress } from "@/original/components/ui/progress";
import {
  Swords,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Battery,
  Star,
  Filter,
  Check,
  AlertTriangle,
  Lightbulb,
  ShieldX,
  MessageSquare,
} from "lucide-react";
import { moveNamesArabic } from "@/original/data/arabicTranslations";
import { getLocalizedCategory } from "@/original/lib/localization";
import { MoveTypeAnimation } from "@/original/components/moves/MoveTypeAnimation";
import { playTypeSound } from "@/original/lib/typeSounds";
import { LtrToken } from "@/original/components/ui/ltr-token";
import {
  getMoveBadges,
  getMoveTLDR,
  isRecommendedMove,
  getWhenToUse,
  getWhenToAvoid,
  getCategoryExplanation,
  advancedFilters,
  isFavoriteMove,
  toggleFavoriteMove,
  getMoveNote,
  saveMoveNote,
} from "@/original/lib/moveHeuristics";
import "@/original/styles/move-animations.css";
import { cn } from "@/original/lib/utils";

const categoryFilters = ["all", "physical", "special", "status"] as const;
const MOVES_PER_PAGE = 24;

type AdvancedFilterKey =
  | "perfectAccuracy"
  | "highPower"
  | "noSideEffects"
  | "statusOnly"
  | "favorites"
  | "recommended";

export default function MovesPage() {
  const { tr, trFormat, language } = useLanguage();
  const { isAvailableInGame } = useGameFilter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMove, setSelectedMove] = useState<(Move & { available_in?: string[] }) | null>(
    null,
  );
  const [activeAdvancedFilters, setActiveAdvancedFilters] = useState<AdvancedFilterKey[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState("");

  // Load favorites on mount
  useEffect(() => {
    const stored = localStorage.getItem("pokemonApp_favoriteMoves");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Load note when move changes
  useEffect(() => {
    if (selectedMove) {
      setCurrentNote(getMoveNote(selectedMove.id));
    }
  }, [selectedMove]);

  // Play sound when move dialog opens
  useEffect(() => {
    if (selectedMove) {
      playTypeSound(selectedMove.type);
    }
  }, [selectedMove]);

  const {
    data: moves,
    loading,
    error,
  } = useOfflineData<Move & { available_in?: string[] }>({ table: "moves" });

  const handleToggleFavorite = useCallback((moveId: number) => {
    const isNowFavorite = toggleFavoriteMove(moveId);
    setFavorites((prev) =>
      isNowFavorite ? [...prev, moveId] : prev.filter((id) => id !== moveId),
    );
  }, []);

  const handleSaveNote = useCallback((moveId: number, note: string) => {
    saveMoveNote(moveId, note);
    setCurrentNote(note);
  }, []);

  const toggleAdvancedFilter = useCallback((filter: AdvancedFilterKey) => {
    setActiveAdvancedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
    );
  }, []);

  const filteredMoves = useMemo(() => {
    return moves.filter((m) => {
      const matchesSearch =
        search === "" ||
        m.name_en.toLowerCase().includes(search.toLowerCase()) ||
        m.name_ar.includes(search);

      const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchesGame = isAvailableInGame(m.available_in);

      // Advanced filters
      let matchesAdvanced = true;
      if (activeAdvancedFilters.includes("perfectAccuracy")) {
        matchesAdvanced = matchesAdvanced && advancedFilters.perfectAccuracy(m);
      }
      if (activeAdvancedFilters.includes("highPower")) {
        matchesAdvanced = matchesAdvanced && advancedFilters.highPower(m);
      }
      if (activeAdvancedFilters.includes("noSideEffects")) {
        matchesAdvanced = matchesAdvanced && advancedFilters.noSideEffects(m);
      }
      if (activeAdvancedFilters.includes("statusOnly")) {
        matchesAdvanced = matchesAdvanced && advancedFilters.statusOnly(m);
      }
      if (activeAdvancedFilters.includes("favorites")) {
        matchesAdvanced = matchesAdvanced && favorites.includes(m.id);
      }
      if (activeAdvancedFilters.includes("recommended")) {
        matchesAdvanced = matchesAdvanced && isRecommendedMove(m);
      }

      return matchesSearch && matchesCategory && matchesGame && matchesAdvanced;
    });
  }, [moves, search, selectedCategory, isAvailableInGame, activeAdvancedFilters, favorites]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, activeAdvancedFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredMoves.length / MOVES_PER_PAGE);
  const paginatedMoves = useMemo(() => {
    const startIndex = (currentPage - 1) * MOVES_PER_PAGE;
    return filteredMoves.slice(startIndex, startIndex + MOVES_PER_PAGE);
  }, [filteredMoves, currentPage]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "physical":
        return Swords;
      case "special":
        return Sparkles;
      case "status":
        return RotateCcw;
      default:
        return Swords;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "physical":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "special":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "status":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getMoveTypeImage = (type: string) => {
    const typeImages: Record<string, string> = {
      normal:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/1.png",
      fighting:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/2.png",
      flying:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/3.png",
      poison:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/4.png",
      ground:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/5.png",
      rock: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/6.png",
      bug: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/7.png",
      ghost:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/8.png",
      steel:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/9.png",
      fire: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/10.png",
      water:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/11.png",
      grass:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/12.png",
      electric:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/13.png",
      psychic:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/14.png",
      ice: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/15.png",
      dragon:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/16.png",
      dark: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/17.png",
      fairy:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/18.png",
    };
    return typeImages[type.toLowerCase()] || typeImages.normal;
  };

  const getMoveTranslation = (move: Move) => {
    if (language === "ar") {
      const localTranslation = moveNamesArabic[move.id];
      const name =
        move.name_ar && move.name_ar !== move.name_en
          ? move.name_ar
          : localTranslation?.name || tr("fallback.nameBeingAdded");
      const effect = move.effect_ar || localTranslation?.effect || tr("fallback.noArabicDesc");
      return { name, effect };
    }
    return { name: move.name_en, effect: move.effect_en || "" };
  };

  const advancedFilterOptions: { key: AdvancedFilterKey; labelKey: string; icon: typeof Filter }[] =
    [
      { key: "perfectAccuracy", labelKey: "filter.accuracy100", icon: Target },
      { key: "highPower", labelKey: "filter.highPower", icon: Zap },
      { key: "noSideEffects", labelKey: "filter.noSideEffects", icon: ShieldX },
      { key: "statusOnly", labelKey: "filter.statusOnly", icon: RotateCcw },
      { key: "favorites", labelKey: "filter.favorites", icon: Star },
      { key: "recommended", labelKey: "filter.recommended", icon: Check },
    ];

  if (error) {
    return (
      <Layout>
        <EmptyState type="error" message={error} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <PageHeader
          title={tr("page.moves.title")}
          description={trFormat("page.moves.available", { count: filteredMoves.length })}
          icon={Swords}
        />

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={{ en: "Search moves...", ar: "بحث عن حركات..." }}
        />

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categoryFilters.map((cat) => {
            const Icon = getCategoryIcon(cat);
            const label = cat === "all" ? tr("category.all") : getLocalizedCategory(cat, language);
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] px-4"
              >
                {cat !== "all" && <Icon className="w-4 h-4" />}
                {label}
              </Button>
            );
          })}

          {/* Advanced Filters Toggle */}
          <Button
            variant={
              showAdvancedFilters || activeAdvancedFilters.length > 0 ? "default" : "outline"
            }
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] px-4"
          >
            <Filter className="w-4 h-4" />
            {tr("filter.advancedFilters")}
            {activeAdvancedFilters.length > 0 && (
              <Badge
                variant="secondary"
                className="h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeAdvancedFilters.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border animate-fade-in">
            {advancedFilterOptions.map((filter) => {
              const isActive = activeAdvancedFilters.includes(filter.key);
              const FilterIcon = filter.icon;
              return (
                <Button
                  key={filter.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAdvancedFilter(filter.key)}
                  className={cn(
                    "gap-1.5 min-h-[36px]",
                    filter.key === "favorites" &&
                      isActive &&
                      "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30",
                  )}
                >
                  <FilterIcon className="w-3.5 h-3.5" />
                  {tr(filter.labelKey as any)}
                </Button>
              );
            })}
          </div>
        )}

        {/* Moves Grid */}
        {loading ? (
          <LoadingSkeleton count={12} type="card" />
        ) : filteredMoves.length === 0 ? (
          <EmptyState
            type={moves.length === 0 ? "empty" : "no-results"}
            message={moves.length === 0 ? tr("move.noData") : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedMoves.map((move) => {
                const CategoryIcon = getCategoryIcon(move.category);
                const translation = getMoveTranslation(move);
                const badges = getMoveBadges(move);
                const tldr = getMoveTLDR(move, language);
                const isFav = favorites.includes(move.id);
                const isRec = isRecommendedMove(move);

                return (
                  <button
                    key={move.id}
                    onClick={() => setSelectedMove(move)}
                    className="text-start w-full bg-card border-2 border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] touch-manipulation"
                  >
                    <div className="p-0">
                      {/* Header with Type */}
                      <div className="relative h-12 bg-gradient-to-br from-muted to-muted/50 flex items-center px-3 gap-2">
                        <OfflineImage
                          src={getMoveTypeImage(move.type)}
                          alt={move.type}
                          className="h-6 object-contain"
                          placeholderType="default"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-foreground leading-tight truncate text-sm">
                              {translation.name}
                            </h3>
                            {isFav && (
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                            )}
                            {isRec && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 ${getCategoryColor(move.category)}`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                        </Badge>
                      </div>

                      <div className="p-3 space-y-2">
                        {/* TL;DR */}
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                          {tldr}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <div className="text-center">
                              <span className="font-bold text-sm text-orange-400">
                                <LtrToken>{move.power || "—"}</LtrToken>
                              </span>
                              <p className="text-[9px] text-muted-foreground">{tr("move.power")}</p>
                            </div>
                            <div className="text-center">
                              <span className="font-bold text-sm text-blue-400">
                                <LtrToken>{move.accuracy ? `${move.accuracy}%` : "—"}</LtrToken>
                              </span>
                              <p className="text-[9px] text-muted-foreground">
                                {tr("move.accuracy")}
                              </p>
                            </div>
                            <div className="text-center">
                              <span className="font-bold text-sm text-green-400">
                                <LtrToken>{move.pp}</LtrToken>
                              </span>
                              <p className="text-[9px] text-muted-foreground">{tr("move.pp")}</p>
                            </div>
                          </div>
                          <TypeBadge type={move.type} size="sm" />
                        </div>

                        {/* Usefulness Badges */}
                        {badges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {badges.map((badge) => (
                              <span
                                key={badge.key}
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full border",
                                  badge.variant === "success" &&
                                    "bg-green-500/10 text-green-400 border-green-500/30",
                                  badge.variant === "warning" &&
                                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
                                  badge.variant === "info" &&
                                    "bg-blue-500/10 text-blue-400 border-blue-500/30",
                                  badge.variant === "default" &&
                                    "bg-muted text-muted-foreground border-border",
                                )}
                              >
                                {badge.icon} {language === "ar" ? badge.labelAr : badge.labelEn}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={tr("pagination.previous")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-h-[44px] min-w-[44px] p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={tr("pagination.next")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Page Info */}
            <p className="text-center text-sm text-muted-foreground">
              {tr("pagination.page")} <span dir="ltr">{currentPage}</span> {tr("pagination.of")}{" "}
              <span dir="ltr">{totalPages}</span>
            </p>
          </>
        )}

        {/* Move Detail Dialog */}
        <Dialog
          open={!!selectedMove}
          onOpenChange={(open) => {
            if (!open) {
              // Save note on close
              if (selectedMove && currentNote !== getMoveNote(selectedMove.id)) {
                handleSaveNote(selectedMove.id, currentNote);
              }
              setSelectedMove(null);
            }
          }}
        >
          <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            {selectedMove &&
              (() => {
                const CategoryIcon = getCategoryIcon(selectedMove.category);
                const translation = getMoveTranslation(selectedMove);
                const isFav = favorites.includes(selectedMove.id);
                const isRec = isRecommendedMove(selectedMove);

                return (
                  <div className="space-y-0">
                    {/* Animated Type Header */}
                    <div className="relative overflow-hidden">
                      <MoveTypeAnimation
                        type={selectedMove.type}
                        category={selectedMove.category}
                        className="h-32"
                      />

                      {/* Overlay content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-background/90 via-background/50 to-transparent p-4">
                        <DialogHeader className="w-full">
                          <DialogTitle className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2">
                              <TypeBadge type={selectedMove.type} />
                              <Badge
                                variant="outline"
                                className={`${getCategoryColor(selectedMove.category)}`}
                              >
                                <CategoryIcon className="w-3 h-3 mr-1" />
                                {getLocalizedCategory(selectedMove.category, language)}
                              </Badge>
                              {isRec && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                  <Check className="w-3 h-3 mr-1" />
                                  {tr("move.recommended")}
                                </Badge>
                              )}
                            </div>
                            <h2 className="text-xl font-bold text-foreground mt-2 drop-shadow-lg">
                              {translation.name}
                            </h2>
                          </DialogTitle>
                        </DialogHeader>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(selectedMove.id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star
                          className={cn(
                            "w-5 h-5",
                            isFav ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground",
                          )}
                        />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Visual Stats with Bars */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted/50 rounded-lg p-2 text-center space-y-1">
                          <Zap className="w-4 h-4 mx-auto text-orange-400" />
                          <p className="text-[10px] text-muted-foreground">{tr("move.power")}</p>
                          <p className="font-bold text-foreground">
                            <LtrToken>{selectedMove.power || "—"}</LtrToken>
                          </p>
                          {selectedMove.power && (
                            <Progress
                              value={Math.min(100, (selectedMove.power / 150) * 100)}
                              className="h-1"
                            />
                          )}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center space-y-1">
                          <Target
                            className={cn(
                              "w-4 h-4 mx-auto",
                              selectedMove.accuracy === 100 && "text-green-400 animate-pulse",
                            )}
                          />
                          <p className="text-[10px] text-muted-foreground">{tr("move.accuracy")}</p>
                          <p className="font-bold text-foreground">
                            <LtrToken>
                              {selectedMove.accuracy ? `${selectedMove.accuracy}%` : "—"}
                            </LtrToken>
                          </p>
                          {selectedMove.accuracy && (
                            <Progress value={selectedMove.accuracy} className="h-1" />
                          )}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center space-y-1">
                          <Battery className="w-4 h-4 mx-auto text-green-400" />
                          <p className="text-[10px] text-muted-foreground">{tr("move.pp")}</p>
                          <p className="font-bold text-foreground">
                            <LtrToken>{selectedMove.pp}</LtrToken>
                          </p>
                          <Progress
                            value={Math.min(100, (selectedMove.pp / 40) * 100)}
                            className="h-1"
                          />
                        </div>
                      </div>

                      {/* How it Works Section */}
                      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          <h4 className="font-medium text-sm text-foreground">
                            {tr("move.howItWorks")}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getCategoryExplanation(selectedMove.category, language)}
                        </p>
                      </div>

                      {/* When to Use */}
                      <div className="bg-green-500/10 rounded-lg p-3 space-y-2 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <h4 className="font-medium text-sm text-foreground">
                            {tr("move.whenToUse")}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getWhenToUse(selectedMove, language)}
                        </p>
                      </div>

                      {/* When to Avoid */}
                      <div className="bg-yellow-500/10 rounded-lg p-3 space-y-2 border border-yellow-500/20">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <h4 className="font-medium text-sm text-foreground">
                            {tr("move.whenToAvoid")}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getWhenToAvoid(selectedMove, language)}
                        </p>
                      </div>

                      {/* Effect */}
                      {translation.effect && (
                        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                          <h4 className="font-medium text-sm text-foreground">
                            {tr("move.effect")}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {translation.effect}
                          </p>
                        </div>
                      )}

                      {/* Personal Notes */}
                      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <h4 className="font-medium text-sm text-foreground">
                            {tr("move.yourNotes")}
                          </h4>
                        </div>
                        <Textarea
                          value={currentNote}
                          onChange={(e) => setCurrentNote(e.target.value)}
                          placeholder={tr("move.addNote")}
                          className="min-h-[60px] text-xs bg-background/50 border-border/50 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
