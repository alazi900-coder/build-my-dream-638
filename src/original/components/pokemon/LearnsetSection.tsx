import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Input } from "@/original/components/ui/input";
import { Button } from "@/original/components/ui/button";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { supabase } from "@/original/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  Zap,
  Egg,
  GraduationCap,
  Layers,
  AlertCircle,
  WifiOff,
  Swords,
  Sparkles,
  Target,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/original/lib/utils";
import {
  getLocalizedName,
  AR_PLACEHOLDERS,
  LEARN_METHOD_LABELS,
  getLocalizedLearnMethod,
} from "@/original/lib/localization";
import { getDB } from "@/original/lib/db";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/original/components/ui/dialog";
import { MoveTypeAnimation } from "@/original/components/moves/MoveTypeAnimation";
import { AnimatedPokemonSprite } from "@/original/components/pokemon/AnimatedPokemonSprite";
import { playTypeSound } from "@/original/lib/typeSounds";
import { toast } from "sonner";
import "@/original/styles/move-animations.css";

interface Learnset {
  id: number;
  pokemon_id: number;
  move_id: number;
  learn_method: string;
  level: number | null;
  game_id: string;
}

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

interface Props {
  pokemonId: number;
  pokemonName?: string;
}

const methodFilters = [
  { id: "all", icon: Layers },
  { id: "level", icon: Zap },
  { id: "tm", icon: BookOpen },
  { id: "egg", icon: Egg },
  { id: "tutor", icon: GraduationCap },
];

const typeFilters = [
  "all",
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

interface SelectedMoveData {
  move: Move;
  learnMethod: string;
  level: number | null;
}

export function LearnsetSection({ pokemonId, pokemonName }: Props) {
  const { tr, language } = useLanguage();
  const { selectedGame } = useGameFilter();
  const isOnline = useOnlineStatus();
  const [methodFilter, setMethodFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [offlineLearnsets, setOfflineLearnsets] = useState<Learnset[] | null>(null);
  const [offlineMoves, setOfflineMoves] = useState<Move[] | null>(null);
  const [selectedMove, setSelectedMove] = useState<SelectedMoveData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if selected move is favorited
  useEffect(() => {
    if (selectedMove) {
      const favorites = JSON.parse(localStorage.getItem("favoriteMoves") || "[]");
      setIsFavorite(favorites.includes(selectedMove.move.id));
    }
  }, [selectedMove]);

  const toggleFavorite = () => {
    if (!selectedMove) return;

    const favorites = JSON.parse(localStorage.getItem("favoriteMoves") || "[]");
    const newFavorites = isFavorite
      ? favorites.filter((id: number) => id !== selectedMove.move.id)
      : [...favorites, selectedMove.move.id];

    localStorage.setItem("favoriteMoves", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);

    toast.success(
      isFavorite
        ? language === "ar"
          ? "تمت إزالة الحركة من المفضلة"
          : "Move removed from favorites"
        : language === "ar"
          ? "تمت إضافة الحركة للمفضلة"
          : "Move added to favorites",
    );
  };

  // Play sound when move dialog opens
  useEffect(() => {
    if (selectedMove) {
      playTypeSound(selectedMove.move.type);
    }
  }, [selectedMove]);

  // Try to load from IndexedDB when offline
  useEffect(() => {
    if (!isOnline) {
      (async () => {
        try {
          const db = await getDB();

          // Get learnsets for this pokemon
          const allLearnsets = await db.getAll("learnsets");
          const filtered = allLearnsets.filter((ls) => ls.pokemon_id === pokemonId);
          setOfflineLearnsets(filtered as unknown as Learnset[]);

          // Get all moves
          const allMoves = await db.getAll("moves");
          setOfflineMoves(allMoves as unknown as Move[]);

          if (import.meta.env.DEV) {
            console.log(
              `[Learnset Offline] Pokemon ${pokemonId}: ${filtered.length} learnsets from IndexedDB`,
            );
          }
        } catch (err) {
          console.error("Error loading offline learnsets:", err);
        }
      })();
    }
  }, [isOnline, pokemonId]);

  // Fetch learnsets - online mode
  const { data: onlineLearnsets, isLoading: learnsetsLoading } = useQuery({
    queryKey: ["learnsets", pokemonId, selectedGame],
    queryFn: async () => {
      // First try with game filter
      let query = supabase.from("learnsets").select("*").eq("pokemon_id", pokemonId);

      if (selectedGame !== "all") {
        query = query.eq("game_id", selectedGame);
      }

      const { data } = await query;

      // If no results and game filter was applied, retry without filter
      if ((!data || data.length === 0) && selectedGame !== "all") {
        const { data: allGameData } = await supabase
          .from("learnsets")
          .select("*")
          .eq("pokemon_id", pokemonId);

        if (import.meta.env.DEV) {
          console.log(
            `[Learnset Debug] Pokemon ${pokemonId}: Found ${allGameData?.length || 0} moves across all games`,
          );
        }

        return (allGameData || []) as Learnset[];
      }

      if (import.meta.env.DEV) {
        console.log(
          `[Learnset Debug] Pokemon ${pokemonId}: Found ${data?.length || 0} moves for game ${selectedGame}`,
        );
      }

      return (data || []) as Learnset[];
    },
    enabled: isOnline, // Only run when online
  });

  // Fetch all moves - online mode
  const { data: onlineMoves } = useQuery({
    queryKey: ["all-moves"],
    queryFn: async () => {
      const { data } = await supabase.from("moves").select("*");

      if (import.meta.env.DEV) {
        console.log(`[Learnset Debug] Total moves in database: ${data?.length || 0}`);
      }

      return (data || []) as Move[];
    },
    enabled: isOnline,
  });

  // Use offline data when offline, online data when online
  const learnsets = isOnline ? onlineLearnsets : offlineLearnsets;
  const moves = isOnline ? onlineMoves : offlineMoves;

  // Combine learnsets with moves
  const learnsetWithMoves = useMemo(() => {
    if (!moves) return [];

    // If learnsets table has data for this pokemon, use it
    if (learnsets && learnsets.length > 0) {
      return learnsets
        .map((ls) => {
          const move = moves.find((m) => m.id === ls.move_id);
          return { ...ls, move };
        })
        .filter((ls) => ls.move);
    }

    // No learnset data - show empty state message instead of all moves
    return [];
  }, [learnsets, moves]);

  // Filter and sort
  const filteredLearnset = useMemo(() => {
    let result = learnsetWithMoves;

    // Game filter (for offline mode, apply client-side)
    if (!isOnline && selectedGame !== "all") {
      result = result.filter((ls) => ls.game_id === selectedGame);
    }

    // Method filter
    if (methodFilter !== "all") {
      result = result.filter((ls) => ls.learn_method === methodFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((ls) => ls.move?.type?.toLowerCase() === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (ls) =>
          ls.move?.name_en.toLowerCase().includes(search) || ls.move?.name_ar.includes(search),
      );
    }

    // Sort: Level moves by level, then alphabetically
    result.sort((a, b) => {
      if (a.learn_method === "level" && b.learn_method === "level") {
        return (a.level || 0) - (b.level || 0);
      }
      if (a.learn_method !== b.learn_method) {
        const order = ["level", "tm", "egg", "tutor", "other"];
        return order.indexOf(a.learn_method) - order.indexOf(b.learn_method);
      }
      return (a.move?.name_en || "").localeCompare(b.move?.name_en || "");
    });

    // Remove duplicates (same move + method)
    const seen = new Set<string>();
    result = result.filter((ls) => {
      const key = `${ls.move_id}-${ls.learn_method}-${ls.level}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return result;
  }, [learnsetWithMoves, methodFilter, typeFilter, searchTerm, isOnline, selectedGame]);

  const getMethodBadge = (method: string, level: number | null) => {
    switch (method) {
      case "level":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            {level
              ? language === "ar"
                ? `م. ${level}`
                : `Lv. ${level}`
              : language === "ar"
                ? "م. ?"
                : "Lv. ?"}
          </Badge>
        );
      case "tm":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            {getLocalizedLearnMethod("tm", language)}
          </Badge>
        );
      case "egg":
        return (
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
            {getLocalizedLearnMethod("egg", language)}
          </Badge>
        );
      case "tutor":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            {getLocalizedLearnMethod("tutor", language)}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "physical":
        return "bg-red-500";
      case "special":
        return "bg-blue-500";
      case "status":
        return "bg-gray-500";
      default:
        return "bg-muted";
    }
  };

  const isLoading = isOnline ? learnsetsLoading : offlineLearnsets === null;

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-10 bg-muted rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message when no learnset data exists
  const hasNoLearnsetData = !learnsets || learnsets.length === 0;

  // Check if offline and no cached data
  const offlineNoData = !isOnline && offlineLearnsets !== null && offlineLearnsets.length === 0;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {tr("pokemon.learnset")}
          {selectedGame !== "all" && (
            <Badge variant="outline" className="text-xs">
              {selectedGame.toUpperCase()}
            </Badge>
          )}
          {!isOnline && <WifiOff className="w-4 h-4 text-muted-foreground" />}
        </h2>

        {offlineNoData ? (
          <div className="text-center py-8 text-muted-foreground">
            <WifiOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">{tr("fallback.noOfflineData")}</p>
            <p className="text-sm mt-1">{tr("fallback.goOnline")}</p>
          </div>
        ) : hasNoLearnsetData ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">{tr("fallback.noLearnsetData")}</p>
            <p className="text-sm mt-1">{tr("fallback.checkLater")}</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tr("search.moves")}
                className="pl-10"
              />
            </div>

            {/* Method Filter */}
            <div className="flex flex-wrap gap-2 mb-3">
              {methodFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.id}
                    variant={methodFilter === filter.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMethodFilter(filter.id)}
                    className="gap-1"
                  >
                    <Icon className="w-3 h-3" />
                    {getLocalizedLearnMethod(filter.id, language)}
                  </Button>
                );
              })}
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {typeFilters.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-all",
                    typeFilter === type
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "opacity-70 hover:opacity-100",
                  )}
                >
                  {type === "all" ? (
                    <span className="text-muted-foreground">{tr("type.allTypes")}</span>
                  ) : (
                    <TypeBadge type={type} size="sm" />
                  )}
                </button>
              ))}
            </div>

            {/* Moves List */}
            {filteredLearnset.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{tr("move.noMoves")}</p>
                {selectedGame !== "all" && <p className="text-sm mt-1">{tr("move.tryAllGames")}</p>}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLearnset.map((ls, idx) => (
                  <div
                    key={`${ls.id}-${idx}`}
                    onClick={() =>
                      ls.move &&
                      setSelectedMove({
                        move: ls.move,
                        learnMethod: ls.learn_method,
                        level: ls.level,
                      })
                    }
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-all cursor-pointer hover:bg-muted/80"
                  >
                    {/* Method Badge */}
                    <div className="w-16 shrink-0">{getMethodBadge(ls.learn_method, ls.level)}</div>

                    {/* Type */}
                    <div className="shrink-0">
                      <TypeBadge type={ls.move?.type || "normal"} size="sm" />
                    </div>

                    {/* Move Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {ls.move
                          ? getLocalizedName(ls.move.name_en, ls.move.name_ar, language)
                          : AR_PLACEHOLDERS.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ls.move ? (language === "ar" ? ls.move.name_en : ls.move.name_ar) : ""}
                      </p>
                    </div>

                    {/* Category */}
                    <div
                      className={cn(
                        "w-2 h-6 rounded-full shrink-0",
                        getCategoryColor(ls.move?.category || ""),
                      )}
                      title={ls.move?.category}
                    />

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      {ls.move?.power && (
                        <span className="text-orange-400 font-medium">{ls.move.power}</span>
                      )}
                      {ls.move?.accuracy && (
                        <span className="text-blue-400">{ls.move.accuracy}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 text-center">
              {tr("move.showing").replace("{count}", String(filteredLearnset.length))}
            </p>
          </>
        )}

        {/* Move Details Dialog */}
        <Dialog
          open={!!selectedMove}
          onOpenChange={(open) => {
            if (!open) setSelectedMove(null);
          }}
        >
          <DialogContent className="sm:max-w-md overflow-hidden p-0">
            {selectedMove && (
              <>
                {/* Animated Header with Pokemon Sprite */}
                <DialogHeader className="relative h-48 overflow-hidden">
                  <MoveTypeAnimation
                    type={selectedMove.move.type}
                    category={selectedMove.move.category}
                    className="absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

                  {/* Animated Pokemon Sprite */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatedPokemonSprite
                      pokemonId={pokemonId}
                      pokemonName={pokemonName || ""}
                      size="lg"
                      className="drop-shadow-2xl animate-bounce"
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <DialogTitle className="text-2xl font-bold text-foreground">
                      {getLocalizedName(
                        selectedMove.move.name_en,
                        selectedMove.move.name_ar,
                        language,
                      )}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? selectedMove.move.name_en : selectedMove.move.name_ar}
                    </p>
                  </div>
                </DialogHeader>

                {/* Move Details */}
                <div className="p-4 space-y-4">
                  {/* Type & Category */}
                  <div className="flex items-center gap-3">
                    <TypeBadge type={selectedMove.move.type} size="md" />
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        selectedMove.move.category === "physical" &&
                          "border-red-500/50 text-red-400",
                        selectedMove.move.category === "special" &&
                          "border-blue-500/50 text-blue-400",
                        selectedMove.move.category === "status" &&
                          "border-gray-500/50 text-gray-400",
                      )}
                    >
                      {selectedMove.move.category === "physical" && (
                        <Swords className="w-3 h-3 mr-1" />
                      )}
                      {selectedMove.move.category === "special" && (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      {selectedMove.move.category === "status" && (
                        <Target className="w-3 h-3 mr-1" />
                      )}
                      {selectedMove.move.category}
                    </Badge>
                    {getMethodBadge(selectedMove.learnMethod, selectedMove.level)}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{tr("move.power")}</p>
                      <p className="text-xl font-bold text-orange-400">
                        {selectedMove.move.power || "—"}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{tr("move.accuracy")}</p>
                      <p className="text-xl font-bold text-blue-400">
                        {selectedMove.move.accuracy ? `${selectedMove.move.accuracy}%` : "—"}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{tr("move.pp")}</p>
                      <p className="text-xl font-bold text-green-400">{selectedMove.move.pp}</p>
                    </div>
                  </div>

                  {/* Effect Description */}
                  {(selectedMove.move.effect_en || selectedMove.move.effect_ar) && (
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">{tr("move.effect")}</p>
                      <p className="text-sm text-foreground">
                        {language === "ar"
                          ? selectedMove.move.effect_ar || selectedMove.move.effect_en
                          : selectedMove.move.effect_en || selectedMove.move.effect_ar}
                      </p>
                    </div>
                  )}

                  {/* No effect fallback */}
                  {!selectedMove.move.effect_en && !selectedMove.move.effect_ar && (
                    <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
                      <p className="text-sm text-muted-foreground">
                        {language === "ar"
                          ? "لا يوجد وصف متاح حالياً"
                          : "No description available yet"}
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMove(null)}
                      className="gap-2"
                    >
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
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
