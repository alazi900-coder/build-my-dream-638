import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Pokemon } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { SearchBar } from "@/original/components/ui/search-bar";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { EmptyState } from "@/original/components/ui/empty-state";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Progress } from "@/original/components/ui/progress";
import { cn } from "@/original/lib/utils";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getPokemonSpriteUrl } from "@/original/lib/imageCache";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  BookOpen,
  Check,
  Sparkles,
  Compass,
  BookMarked,
} from "lucide-react";
import { pokemonNamesArabic } from "@/original/data/arabicTranslations";
import { TYPE_LABELS } from "@/original/lib/localization";
import { PokemonId } from "@/original/components/ui/ltr-token";
import {
  getFavoritePokemon,
  toggleFavoritePokemon,
  isPokemonViewed,
  getViewedCount,
  hasPokemonNote,
} from "@/original/lib/pokemonUtils";

const typeFilters = [
  "all",
  "favorites",
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

// Get Pokemon name with fallback to local translations
const getPokemonName = (pokemon: Pokemon, language: string): string => {
  if (language === "ar") {
    if (pokemon.name_ar && pokemon.name_ar !== pokemon.name_en) {
      return pokemon.name_ar;
    }
    return pokemonNamesArabic[pokemon.id] || "الاسم قيد الإضافة";
  }
  return pokemon.name_en;
};

const getPokemonSecondaryName = (pokemon: Pokemon, language: string): string => {
  if (language === "ar") {
    return pokemon.name_en;
  }
  if (pokemon.name_ar && pokemon.name_ar !== pokemon.name_en) {
    return pokemon.name_ar;
  }
  return pokemonNamesArabic[pokemon.id] || "";
};

const POKEMON_PER_PAGE = 24;

export default function DexPage() {
  const { tr, trFormat, language } = useLanguage();
  const { isAvailableInGame } = useGameFilter();
  const isArabic = language === "ar";

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);

  const {
    data: pokemon,
    loading,
    error,
  } = useOfflineData<Pokemon & { available_in?: string[] }>({ table: "pokemon" });

  // Load favorites on mount
  useEffect(() => {
    setFavorites(getFavoritePokemon());
  }, []);

  // Handle favorite toggle
  const handleToggleFavorite = (pokemonId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoritePokemon(pokemonId);
    setFavorites(getFavoritePokemon());
  };

  const filteredPokemon = useMemo(() => {
    return pokemon.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.name_en.toLowerCase().includes(search.toLowerCase()) ||
        p.name_ar.includes(search) ||
        p.id.toString().includes(search);

      let matchesType = true;
      if (selectedType === "favorites") {
        matchesType = favorites.includes(p.id);
      } else if (selectedType !== "all") {
        matchesType = p.types && p.types.some((type) => type.toLowerCase() === selectedType);
      }

      const matchesGame = isAvailableInGame(p.available_in);

      return matchesSearch && matchesType && matchesGame;
    });
  }, [pokemon, search, selectedType, isAvailableInGame, favorites]);

  // Get total available Pokemon for progress
  const totalAvailablePokemon = useMemo(() => {
    return pokemon.filter((p) => isAvailableInGame(p.available_in)).length;
  }, [pokemon, isAvailableInGame]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, selectedType]);

  // Pagination
  const totalPages = Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE);
  const paginatedPokemon = useMemo(() => {
    const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
    return filteredPokemon.slice(startIndex, startIndex + POKEMON_PER_PAGE);
  }, [filteredPokemon, currentPage]);

  // Progress tracking
  const viewedCount = getViewedCount();
  const progressPercent =
    totalAvailablePokemon > 0 ? (viewedCount / totalAvailablePokemon) * 100 : 0;
  const favoritesCount = favorites.length;

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
          title={tr("page.dex.title")}
          description={trFormat("page.dex.available", { count: filteredPokemon.length })}
          icon={BookMarked}
        />

        {/* Exploration Progress - Simplified colors */}
        {totalAvailablePokemon > 0 && (
          <Card className="border-primary/20 bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {tr("page.dex.progress")
                      .replace("{viewed}", String(viewedCount))
                      .replace("{total}", String(totalAvailablePokemon))}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-primary" />
                    <span>{favoritesCount}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={{ en: "Search Pokémon...", ar: "بحث عن بوكيمون..." }}
        />

        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {typeFilters.map((type) => {
            const isFavoritesFilter = type === "favorites";
            const label =
              type === "all"
                ? { en: "All", ar: "الكل" }
                : isFavoritesFilter
                  ? {
                      en: `Favorites${favoritesCount > 0 ? ` (${favoritesCount})` : ""}`,
                      ar: `المفضلة${favoritesCount > 0 ? ` (${favoritesCount})` : ""}`,
                    }
                  : TYPE_LABELS[type] || { en: type, ar: type };
            return (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className={cn(
                  "whitespace-nowrap shrink-0 min-h-[44px] px-4",
                  selectedType === type && "border-2",
                )}
              >
                {isFavoritesFilter && (
                  <Star
                    className={cn(
                      "w-4 h-4 me-1",
                      favoritesCount > 0 && "fill-amber-400 text-amber-400",
                    )}
                  />
                )}
                {language === "ar" ? label.ar : label.en}
              </Button>
            );
          })}
        </div>

        {/* Pokemon Grid */}
        {loading ? (
          <LoadingSkeleton count={12} type="card" />
        ) : filteredPokemon.length === 0 ? (
          <EmptyState
            type={pokemon.length === 0 ? "empty" : "no-results"}
            message={
              pokemon.length === 0
                ? language === "ar"
                  ? "لا توجد بيانات بوكيمون. استورد البيانات من الإعدادات."
                  : "No Pokémon data. Import data in Settings."
                : selectedType === "favorites"
                  ? tr("page.dex.noFavorites")
                  : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {paginatedPokemon.map((p) => {
                const isFavorite = favorites.includes(p.id);
                const isViewed = isPokemonViewed(p.id);
                const hasNote = hasPokemonNote(p.id);

                return (
                  <Link
                    key={p.id}
                    to={`/pokemon/${p.id}`}
                    className="bg-card border-2 border-border rounded-xl p-3 text-start hover:border-primary transition-all group hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[180px] active:scale-[0.98] touch-manipulation relative"
                  >
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(p.id, e)}
                      className="absolute top-2 end-2 z-10 w-7 h-7 rounded-full bg-background/70 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star
                        className={cn("w-4 h-4", isFavorite && "fill-amber-400 text-amber-400")}
                      />
                    </button>

                    {/* Status Indicators - Simplified */}
                    <div className="absolute top-2 start-2 flex flex-col gap-1">
                      {isViewed && (
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 bg-muted text-muted-foreground border-border"
                        >
                          <Check className="w-2.5 h-2.5 me-0.5" />
                          {tr("page.dex.viewed")}
                        </Badge>
                      )}
                      {!isViewed && (
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 bg-primary/10 text-primary border-primary/30"
                        >
                          <Sparkles className="w-2.5 h-2.5 me-0.5" />
                          {tr("page.dex.new")}
                        </Badge>
                      )}
                      {hasNote && (
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 bg-muted text-muted-foreground border-border"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                        </Badge>
                      )}
                    </div>

                    {/* Badges Row - Simplified */}
                    <div className="flex gap-1 mb-1 min-h-[18px] mt-6">
                      {p.is_legendary && (
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/30 px-1.5 rounded">
                          {tr("pokemon.legendary")}
                        </span>
                      )}
                      {p.is_starter && (
                        <span className="text-[9px] bg-muted text-muted-foreground border border-border px-1.5 rounded">
                          {tr("pokemon.starter")}
                        </span>
                      )}
                      {isFavorite && (
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/30 px-1.5 rounded flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </span>
                      )}
                    </div>

                    {/* Pokemon Image */}
                    <div className="w-full aspect-square bg-muted/50 rounded-lg mb-2 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                      <OfflineImage
                        src={getPokemonSpriteUrl(p.id)}
                        alt={language === "ar" ? p.name_ar : p.name_en}
                        className="w-full h-full object-contain"
                        placeholderType="pokemon"
                      />
                    </div>

                    {/* Number */}
                    <p className="text-[10px] text-muted-foreground">
                      <PokemonId id={p.id} />
                    </p>

                    {/* Name */}
                    <p className="font-bold text-sm truncate text-foreground">
                      {getPokemonName(p, language)}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {getPokemonSecondaryName(p, language)}
                    </p>

                    {/* Types */}
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {p.types?.slice(0, 2).map((type) => (
                        <TypeBadge
                          key={type}
                          type={type}
                          size="sm"
                          className="text-[9px] px-1.5 py-0.5"
                        />
                      ))}
                    </div>
                  </Link>
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
                  <ChevronLeft className="w-5 h-5" />
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
                  <ChevronRight className="w-5 h-5" />
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
      </div>
    </Layout>
  );
}
