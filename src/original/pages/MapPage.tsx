// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter, GAMES, GameId } from "@/original/contexts/GameFilterContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Location } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { SearchBar } from "@/original/components/ui/search-bar";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { EmptyState } from "@/original/components/ui/empty-state";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/original/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/original/components/ui/tabs";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { Textarea } from "@/original/components/ui/textarea";
import { Progress } from "@/original/components/ui/progress";
import { toast } from "sonner";
import {
  MapPin,
  Mountain,
  Building,
  TreePine,
  Waves,
  ChevronLeft,
  ChevronRight,
  Info,
  Navigation,
  Star,
  Sparkles,
  X,
  Map,
  LayoutGrid,
  Check,
  Clock,
  Heart,
  Footprints,
  Package,
  Users,
  BookOpen,
  Compass,
  AlertCircle,
} from "lucide-react";
import {
  LOCATION_CATEGORY_LABELS,
  getLocalizedLocationCategory,
  getLocalizedEncounterMethod,
} from "@/original/lib/localization";
import {
  getFavoriteLocations,
  toggleFavoriteLocation,
  isLocationFavorite,
  getLocationNote,
  saveLocationNote,
  markLocationVisited,
  isLocationVisited,
  getVisitedCount,
  getDiscoveryStatus,
  getDiscoveryStatusLabel,
  getDiscoveryStatusColor,
  getCategoryDescription,
  getCategoryWhyNoData,
  getCategoryHelper,
  CATEGORY_INFO,
} from "@/original/lib/locationUtils";
import { MapLayerToggle, MapLayer } from "@/original/components/map/MapLayerToggle";
import { AdvancedMapFilters, MapFilters } from "@/original/components/map/AdvancedMapFilters";
import { MapBreadcrumb } from "@/original/components/map/MapBreadcrumb";
import { InteractiveRegionMap } from "@/original/components/map/InteractiveRegionMap";
import { MapboxRegionMap } from "@/original/components/map/MapboxRegionMap";
import { LocationRarePokemon } from "@/original/components/map/LocationRarePokemon";
import { LocationHiddenItems } from "@/original/components/map/LocationHiddenItems";
import { BestCatchingTimes } from "@/original/components/map/BestCatchingTimes";

const LOCATIONS_PER_PAGE = 20;

// Location type categories
const locationCategories = ["all", "favorites", "town", "route", "wild", "cave", "other"] as const;

const categoryIcons: Record<string, React.ElementType> = {
  town: Building,
  route: Navigation,
  wild: TreePine,
  cave: Mountain,
  other: MapPin,
  favorites: Star,
};

// Game tabs configuration with region images
const gameTabsConfig: {
  id: GameId;
  labelAr: string;
  labelEn: string;
  region: string;
  regionAr: string;
  image: string;
}[] = [
  {
    id: "swsh",
    labelAr: "سورد/شيلد",
    labelEn: "Sword/Shield",
    region: "Galar",
    regionAr: "جالار",
    image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&h=300&fit=crop",
  },
  {
    id: "letsgo",
    labelAr: "ليتس غو",
    labelEn: "Let's Go",
    region: "Kanto",
    regionAr: "كانتو",
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&h=300&fit=crop",
  },
  {
    id: "arceus",
    labelAr: "آرسيوس",
    labelEn: "Arceus",
    region: "Hisui",
    regionAr: "هيسوي",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=300&fit=crop",
  },
];

// Location category images
const categoryImages: Record<string, string> = {
  town: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop",
  route: "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=200&fit=crop",
  wild: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop",
  cave: "https://images.unsplash.com/photo-1504699439244-a5c0e56abc81?w=400&h=200&fit=crop",
  other: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop",
};

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[] | { name: string }[];
  available_in: string[] | null;
  is_legendary: boolean | null;
  is_starter: boolean | null;
}

interface Encounter {
  id: number;
  pokemon_id: number;
  location_id: number;
  method: string;
  min_lvl: number;
  max_lvl: number;
  chance: number | null;
  time_of_day: string | null;
  weather: string | null;
  available_in: string[] | null;
}

interface Gym {
  id: number;
  city_en: string;
  city_ar: string;
  leader_name_en: string;
  leader_name_ar: string;
  type: string;
  badge_order: number;
  available_in?: string[];
}

interface NPC {
  id: number;
  name_en: string;
  name_ar: string;
  location_en: string;
  location_ar: string;
  category: string;
  specialty_type?: string | null;
}

export default function MapPage() {
  const { t, language, tr } = useLanguage();
  const navigate = useNavigate();
  const isArabic = language === "ar";

  const [selectedGame, setSelectedGame] = useState<GameId>("swsh");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<
    (Location & { available_in?: string[] }) | null
  >(null);
  const [viewMode, setViewMode] = useState<"grid" | "map" | "mapbox">("grid");
  const [activeLayers, setActiveLayers] = useState<MapLayer[]>(["locations", "gyms"]);
  const [advancedFilters, setAdvancedFilters] = useState<MapFilters>({
    pokemonType: "all",
    minLevel: 1,
    maxLevel: 100,
    legendaryOnly: false,
    exclusiveOnly: false,
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState("");

  const {
    data: locations,
    loading: locationsLoading,
    error,
  } = useOfflineData<Location & { available_in?: string[] }>({ table: "locations" });
  const { data: pokemon, loading: pokemonLoading } = useOfflineData<Pokemon>({ table: "pokemon" });
  const { data: encounters, loading: encountersLoading } = useOfflineData<Encounter>({
    table: "encounters",
  });
  const { data: gyms, loading: gymsLoading } = useOfflineData<Gym>({ table: "gyms" });
  const { data: npcs, loading: npcsLoading } = useOfflineData<NPC>({ table: "npcs" });

  const loading =
    locationsLoading || pokemonLoading || encountersLoading || gymsLoading || npcsLoading;

  // Load favorites on mount
  useEffect(() => {
    setFavorites(getFavoriteLocations());
  }, []);

  // Load note when location is selected
  useEffect(() => {
    if (selectedLocation) {
      setCurrentNote(getLocationNote(selectedLocation.id));
      markLocationVisited(selectedLocation.id);
    }
  }, [selectedLocation]);

  // Categorize location based on name/notes
  const getLocationCategory = (loc: Location): string => {
    const name = loc.name_en.toLowerCase();
    const notes = (loc.notes_en || "").toLowerCase();

    if (name.includes("route") || name.includes("path")) return "route";
    if (name.includes("wild area") || name.includes("wild") || name.includes("area")) return "wild";
    if (
      name.includes("mine") ||
      name.includes("cave") ||
      name.includes("tunnel") ||
      name.includes("den")
    )
      return "cave";
    if (
      notes.includes("town") ||
      notes.includes("city") ||
      notes.includes("village") ||
      name.includes("town") ||
      name.includes("city") ||
      name.includes("village")
    )
      return "town";
    if (notes.includes("gym") || notes.includes("lab")) return "town";

    return "other";
  };

  // Filter locations by selected game
  const gameLocations = useMemo(() => {
    if (!locations) return [];
    return locations.filter((loc) => {
      const availableIn = loc.available_in as string[] | null;
      if (!availableIn || !Array.isArray(availableIn)) return false;
      return availableIn.includes(selectedGame);
    });
  }, [locations, selectedGame]);

  const filteredLocations = useMemo(() => {
    return gameLocations.filter((loc) => {
      const matchesSearch =
        search === "" ||
        loc.name_en.toLowerCase().includes(search.toLowerCase()) ||
        loc.name_ar.includes(search);

      let matchesCategory = true;
      if (selectedCategory === "favorites") {
        matchesCategory = favorites.includes(loc.id);
      } else if (selectedCategory !== "all") {
        matchesCategory = getLocationCategory(loc) === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [gameLocations, search, selectedCategory, favorites]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedGame]);

  // Pagination
  const totalPages = Math.ceil(filteredLocations.length / LOCATIONS_PER_PAGE);
  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * LOCATIONS_PER_PAGE;
    return filteredLocations.slice(startIndex, startIndex + LOCATIONS_PER_PAGE);
  }, [filteredLocations, currentPage]);

  // Get encounters for a location
  const getLocationEncounters = (locationId: number) => {
    if (!encounters) return [];
    return encounters.filter((enc) => {
      if (enc.location_id !== locationId) return false;
      const availableIn = enc.available_in as string[] | null;
      if (!availableIn || !Array.isArray(availableIn)) return true;
      return availableIn.includes(selectedGame);
    });
  };

  // Get Pokemon by ID
  const getPokemonById = (id: number) => {
    return pokemon?.find((p) => p.id === id);
  };

  // Check if Pokemon is exclusive to this location in the selected game
  const isExclusivePokemon = (pokemonId: number, locationId: number) => {
    if (!encounters) return false;
    const pokemonEncounters = encounters.filter((enc) => {
      if (enc.pokemon_id !== pokemonId) return false;
      const availableIn = enc.available_in as string[] | null;
      if (!availableIn || !Array.isArray(availableIn)) return true;
      return availableIn.includes(selectedGame);
    });
    const uniqueLocations = [...new Set(pokemonEncounters.map((e) => e.location_id))];
    return uniqueLocations.length === 1 && uniqueLocations[0] === locationId;
  };

  // Get exclusive Pokemon for a location
  const getExclusivePokemon = (locationId: number) => {
    const locationEncounters = getLocationEncounters(locationId);
    const exclusiveIds = new Set<number>();

    locationEncounters.forEach((enc) => {
      if (isExclusivePokemon(enc.pokemon_id, locationId)) {
        exclusiveIds.add(enc.pokemon_id);
      }
    });

    return Array.from(exclusiveIds)
      .map((id) => getPokemonById(id))
      .filter(Boolean) as Pokemon[];
  };

  // Group encounters by method
  const groupEncountersByMethod = (locationEncounters: Encounter[]) => {
    const groups: Record<string, { pokemon: Pokemon; encounter: Encounter }[]> = {};

    locationEncounters.forEach((enc) => {
      const poke = getPokemonById(enc.pokemon_id);
      if (poke) {
        if (!groups[enc.method]) {
          groups[enc.method] = [];
        }
        if (!groups[enc.method].some((g) => g.pokemon.id === poke.id)) {
          groups[enc.method].push({ pokemon: poke, encounter: enc });
        }
      }
    });

    return groups;
  };

  // Helper to get type string from various formats
  const getTypeString = (types: string[] | { name: string }[]): string[] => {
    if (!types || !Array.isArray(types)) return [];
    return types.map((t) => (typeof t === "string" ? t : t.name));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      town: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      route: "bg-green-500/20 text-green-300 border-green-500/30",
      wild: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      cave: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      other: "bg-muted text-muted-foreground border-border",
    };
    return colors[category] || colors.other;
  };

  // Get counts for map component
  const getLocationPokemonCount = (locId: number): number => {
    const enc = getLocationEncounters(locId);
    return new Set(enc.map((e) => e.pokemon_id)).size;
  };

  const getLocationExclusiveCount = (locId: number): number => {
    return getExclusivePokemon(locId).length;
  };

  // Filter gyms by game
  const gameGyms = useMemo(() => {
    if (!gyms) return [];
    return gyms
      .filter((gym) => {
        const availableIn = gym.available_in as string[] | null;
        if (!availableIn || !Array.isArray(availableIn)) return selectedGame === "swsh";
        return availableIn.includes(selectedGame);
      })
      .sort((a, b) => a.badge_order - b.badge_order);
  }, [gyms, selectedGame]);

  // Filter NPCs
  const gameNpcs = useMemo(() => {
    if (!npcs) return [];
    return npcs.slice(0, 20);
  }, [npcs]);

  // Get similar locations (same category)
  const getSimilarLocations = (location: Location, limit = 3) => {
    const category = getLocationCategory(location);
    return gameLocations
      .filter((loc) => loc.id !== location.id && getLocationCategory(loc) === category)
      .slice(0, limit);
  };

  const currentGameConfig = gameTabsConfig.find((g) => g.id === selectedGame);
  const visitedCount = getVisitedCount();
  const totalLocationsCount = gameLocations.length;
  const progressPercent = totalLocationsCount > 0 ? (visitedCount / totalLocationsCount) * 100 : 0;

  // Handle favorite toggle
  const handleToggleFavorite = (locationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleFavoriteLocation(locationId);
    setFavorites(getFavoriteLocations());
  };

  // Handle save note
  const handleSaveNote = () => {
    if (selectedLocation) {
      saveLocationNote(selectedLocation.id, currentNote);
      toast.success(tr("page.map.noteSaved"));
    }
  };

  if (error) {
    return (
      <Layout>
        <EmptyState type="error" message={error} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-4 pb-24">
        {/* Breadcrumb */}
        {currentGameConfig && (
          <MapBreadcrumb
            game={selectedGame}
            gameName={isArabic ? currentGameConfig.labelAr : currentGameConfig.labelEn}
            regionName={isArabic ? currentGameConfig.regionAr : currentGameConfig.region}
            locationName={
              selectedLocation
                ? isArabic
                  ? selectedLocation.name_ar
                  : selectedLocation.name_en
                : undefined
            }
            onNavigateToRegion={() => setSelectedLocation(null)}
          />
        )}

        {/* Header */}
        <PageHeader
          title={tr("page.map.title")}
          description={tr("page.map.subtitle")}
          icon={MapPin}
        >
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
              title={isArabic ? "عرض الشبكة" : "Grid View"}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="h-8 w-8 p-0"
              title={isArabic ? "خريطة المناطق" : "Region Map"}
            >
              <Map className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "mapbox" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mapbox")}
              className="h-8 w-8 p-0"
              title={isArabic ? "خريطة تفاعلية" : "Interactive Map"}
            >
              <Compass className="w-4 h-4" />
            </Button>
          </div>
        </PageHeader>

        {/* Exploration Progress */}
        {viewMode === "grid" && totalLocationsCount > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {tr("page.map.progress")
                      .replace("{visited}", String(visitedCount))
                      .replace("{total}", String(totalLocationsCount))}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Game Tabs */}
        <Tabs
          value={selectedGame}
          onValueChange={(v) => setSelectedGame(v as GameId)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full">
            {gameTabsConfig.map((game) => (
              <TabsTrigger key={game.id} value={game.id} className="text-xs sm:text-sm">
                {isArabic ? game.labelAr : game.labelEn}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Map View Controls */}
        {(viewMode === "map" || viewMode === "mapbox") && (
          <div className="space-y-3">
            <MapLayerToggle activeLayers={activeLayers} onChange={setActiveLayers} />
            {viewMode === "map" && (
              <AdvancedMapFilters
                filters={advancedFilters}
                onChange={setAdvancedFilters}
                availableTypes={[]}
              />
            )}
          </div>
        )}

        {/* Region Banner - only in grid view */}
        {viewMode === "grid" && currentGameConfig && (
          <div className="relative h-28 sm:h-36 rounded-lg overflow-hidden">
            <OfflineImage
              src={currentGameConfig.image}
              alt={currentGameConfig.region}
              className="w-full h-full object-cover"
              placeholderType="default"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
            <div className="absolute bottom-3 start-3">
              <h2 className="text-lg font-bold text-foreground">
                {tr("page.map.regionTitle").replace(
                  "{region}",
                  isArabic ? currentGameConfig.regionAr : currentGameConfig.region,
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {tr("page.map.locationsAvailable").replace(
                  "{count}",
                  String(filteredLocations.length),
                )}
              </p>
            </div>
          </div>
        )}

        {/* Interactive Map View */}
        {viewMode === "map" && (
          <InteractiveRegionMap
            game={selectedGame}
            locations={filteredLocations}
            gyms={gameGyms}
            npcs={gameNpcs}
            activeLayers={activeLayers}
            filters={advancedFilters}
            onLocationClick={(loc) =>
              setSelectedLocation(loc as Location & { available_in?: string[] })
            }
            onGymClick={(gym) => navigate(`/gyms/${gym.id}`)}
            getLocationCategory={getLocationCategory}
            getLocationPokemonCount={getLocationPokemonCount}
            getLocationExclusiveCount={getLocationExclusiveCount}
          />
        )}

        {/* Mapbox Interactive Map */}
        {viewMode === "mapbox" && (
          <MapboxRegionMap
            game={selectedGame}
            locations={filteredLocations}
            gyms={gameGyms}
            npcs={gameNpcs}
            activeLayers={activeLayers}
            onLocationClick={(loc) =>
              setSelectedLocation(loc as Location & { available_in?: string[] })
            }
            onGymClick={(gym) => navigate(`/gyms/${gym.id}`)}
          />
        )}

        {viewMode === "grid" && (
          <>
            {/* Search */}
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={{ en: "Search locations...", ar: "ابحث عن موقع..." }}
            />

            {/* Category Filters with helper text */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {locationCategories.map((cat) => {
                const Icon = categoryIcons[cat] || MapPin;
                const isFavoritesFilter = cat === "favorites";
                const favCount = favorites.length;

                return (
                  <div key={cat} className="flex flex-col items-center shrink-0">
                    <Button
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="gap-1.5 whitespace-nowrap min-h-[44px]"
                    >
                      <Icon
                        className={`w-4 h-4 ${isFavoritesFilter && favCount > 0 ? "fill-amber-400 text-amber-400" : ""}`}
                      />
                      {isFavoritesFilter
                        ? `${tr("filter.favorites")} ${favCount > 0 ? `(${favCount})` : ""}`
                        : getLocalizedLocationCategory(cat, isArabic ? "ar" : "en")}
                    </Button>
                    {/* Helper text for categories */}
                    {cat !== "all" && cat !== "favorites" && (
                      <span className="text-[9px] text-muted-foreground mt-1">
                        {getCategoryHelper(cat, isArabic ? "ar" : "en")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Locations Grid */}
        {loading ? (
          <LoadingSkeleton count={10} type="list" />
        ) : filteredLocations.length === 0 ? (
          <EmptyState
            type={gameLocations.length === 0 ? "empty" : "no-results"}
            message={
              gameLocations.length === 0
                ? tr("page.map.noLocations")
                : selectedCategory === "favorites"
                  ? isArabic
                    ? "لا توجد مواقع مفضلة بعد"
                    : "No favorite locations yet"
                  : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {paginatedLocations.map((loc) => {
                const category = getLocationCategory(loc);
                const CategoryIcon = categoryIcons[category] || MapPin;
                const locationEncounters = getLocationEncounters(loc.id);
                const exclusivePokemon = getExclusivePokemon(loc.id);
                const uniquePokemonCount = new Set(locationEncounters.map((e) => e.pokemon_id))
                  .size;
                const isFavorite = favorites.includes(loc.id);
                const discoveryStatus = getDiscoveryStatus(loc.id, uniquePokemonCount > 0);

                return (
                  <Card
                    key={loc.id}
                    className="overflow-hidden hover:border-primary transition-colors cursor-pointer group"
                    onClick={() => setSelectedLocation(loc)}
                  >
                    {/* Location Image */}
                    <div className="relative h-24">
                      <OfflineImage
                        src={categoryImages[category] || categoryImages.other}
                        alt={isArabic ? loc.name_ar : loc.name_en}
                        className="w-full h-full object-cover"
                        placeholderType="default"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />

                      {/* Favorite Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 start-1 h-7 w-7 bg-background/50 hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleToggleFavorite(loc.id, e)}
                      >
                        <Star
                          className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
                        />
                      </Button>

                      {/* Category Badge */}
                      <div className="absolute top-1 end-1">
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <CategoryIcon className="h-3 w-3" />
                          {getLocalizedLocationCategory(category, isArabic ? "ar" : "en")}
                        </Badge>
                      </div>

                      {/* Discovery Status Badge */}
                      <div className="absolute bottom-1 end-1">
                        <Badge
                          variant="outline"
                          className={`text-[9px] gap-0.5 ${getDiscoveryStatusColor(discoveryStatus)}`}
                        >
                          {discoveryStatus === "visited" && <Check className="h-2.5 w-2.5" />}
                          {discoveryStatus === "incomplete" && <Clock className="h-2.5 w-2.5" />}
                          {getDiscoveryStatusLabel(discoveryStatus, isArabic ? "ar" : "en")}
                        </Badge>
                      </div>

                      {/* Exclusive Badge */}
                      {exclusivePokemon.length > 0 && (
                        <div className="absolute bottom-1 start-1">
                          <Badge className="gap-1 bg-amber-500/90 text-white border-0 text-[9px]">
                            <Sparkles className="h-2.5 w-2.5" />
                            {exclusivePokemon.length}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-3">
                      {/* Location Name */}
                      <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-1 mb-1">
                        {isArabic ? loc.name_ar : loc.name_en}
                      </h3>
                      {!isArabic && (
                        <p className="text-[10px] text-muted-foreground mb-2">{loc.name_ar}</p>
                      )}

                      {/* Content Indicators */}
                      <div className="flex items-center gap-2 mb-2">
                        {uniquePokemonCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Footprints className="h-3 w-3 text-green-500" />
                            <span>{uniquePokemonCount}</span>
                          </div>
                        )}
                        {category !== "town" && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Package className="h-3 w-3 text-amber-500" />
                          </div>
                        )}
                        {(category === "route" || category === "cave") && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Users className="h-3 w-3 text-blue-500" />
                          </div>
                        )}
                      </div>

                      {/* Pokemon Count or Coming Soon */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {uniquePokemonCount > 0
                            ? tr("page.map.pokemon").replace("{count}", String(uniquePokemonCount))
                            : tr("page.map.dataComingSoon")}
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2">
                          {tr("action.details")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                        className="w-8 h-8 p-0 min-h-[44px] min-w-[44px]"
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
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Page Info */}
            <p className="text-center text-sm text-muted-foreground">
              {tr("pagination.page")} {currentPage} {tr("pagination.of")} {totalPages}
            </p>
          </>
        )}

        {/* Location Detail Dialog */}
        <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
            {selectedLocation &&
              (() => {
                const category = getLocationCategory(selectedLocation);
                const CategoryIcon = categoryIcons[category] || MapPin;
                const locationEncounters = getLocationEncounters(selectedLocation.id);
                const exclusivePokemon = getExclusivePokemon(selectedLocation.id);
                const groupedEncounters = groupEncountersByMethod(locationEncounters);
                const hasPokemonData = Object.keys(groupedEncounters).length > 0;
                const similarLocations = getSimilarLocations(selectedLocation);
                const isFavorite = favorites.includes(selectedLocation.id);

                return (
                  <>
                    {/* Header Image */}
                    <div className="relative h-36">
                      <img
                        src={categoryImages[category] || categoryImages.other}
                        alt={isArabic ? selectedLocation.name_ar : selectedLocation.name_en}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                      {/* Action Buttons */}
                      <div className="absolute top-2 end-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-background/50 hover:bg-background/80 h-8 w-8"
                          onClick={() => handleToggleFavorite(selectedLocation.id)}
                        >
                          <Star
                            className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-background/50 hover:bg-background/80 h-8 w-8"
                          onClick={() => setSelectedLocation(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="absolute bottom-3 start-4 end-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(category)}`}
                          >
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <Badge variant="outline" className={`${getCategoryColor(category)}`}>
                            {getLocalizedLocationCategory(category, isArabic ? "ar" : "en")}
                          </Badge>
                          {isFavorite && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <Star className="h-3 w-3 fill-current me-1" />
                              {tr("filter.favorites")}
                            </Badge>
                          )}
                        </div>
                        <DialogTitle className="text-xl font-bold text-foreground">
                          {isArabic ? selectedLocation.name_ar : selectedLocation.name_en}
                        </DialogTitle>
                        {!isArabic && (
                          <p className="text-sm text-muted-foreground">
                            {selectedLocation.name_ar}
                          </p>
                        )}
                      </div>
                    </div>

                    <ScrollArea className="max-h-[55vh]">
                      <div className="p-4 space-y-5">
                        {/* About This Location */}
                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-primary" />
                            {tr("page.map.aboutLocation")}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {getCategoryDescription(category, isArabic ? "ar" : "en")}
                          </p>
                        </div>

                        {/* Region */}
                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                          <div className="flex items-center gap-2">
                            <Waves className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">
                              {tr("page.map.region")}
                            </span>
                            <span className="font-bold text-foreground ms-auto">
                              {isArabic ? currentGameConfig?.regionAr : selectedLocation.region}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {(selectedLocation.notes_en || selectedLocation.notes_ar) && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Info className="w-4 h-4" />
                              {tr("page.map.description")}
                            </h4>
                            <p className="text-foreground bg-muted/50 rounded-lg p-3 text-sm">
                              {isArabic
                                ? selectedLocation.notes_ar || tr("page.map.descBeingAdded")
                                : selectedLocation.notes_en}
                            </p>
                          </div>
                        )}

                        {/* Exclusive Pokemon */}
                        {exclusivePokemon.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                              <Star className="h-4 w-4 text-amber-500" />
                              {tr("page.map.exclusivePokemon")}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {exclusivePokemon.map((poke) => (
                                <div
                                  key={poke.id}
                                  className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                                >
                                  <img
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`}
                                    alt={isArabic ? poke.name_ar : poke.name_en}
                                    className="w-10 h-10"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-xs truncate">
                                      {isArabic ? poke.name_ar : poke.name_en}
                                    </p>
                                    <div className="flex gap-1 mt-0.5">
                                      {getTypeString(poke.types)
                                        .slice(0, 2)
                                        .map((type) => (
                                          <TypeBadge key={type} type={type} size="sm" />
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* All Pokemon by Method OR Smart Empty State */}
                        {hasPokemonData ? (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                              <Sparkles className="h-4 w-4 text-primary" />
                              {tr("page.map.allPokemon")}
                            </h4>
                            <div className="space-y-4">
                              {Object.entries(groupedEncounters).map(([method, pokemons]) => (
                                <div key={method}>
                                  <Badge variant="outline" className="mb-2">
                                    {getLocalizedEncounterMethod(method, isArabic ? "ar" : "en")}
                                  </Badge>
                                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                    {pokemons.map(({ pokemon: poke, encounter }) => {
                                      const isExclusive = isExclusivePokemon(
                                        poke.id,
                                        selectedLocation.id,
                                      );
                                      return (
                                        <div
                                          key={poke.id}
                                          className={`flex flex-col items-center p-2 rounded-lg text-center relative ${
                                            isExclusive
                                              ? "bg-amber-500/10 border border-amber-500/30"
                                              : "bg-muted/50"
                                          }`}
                                        >
                                          {isExclusive && (
                                            <Star className="h-3 w-3 text-amber-500 absolute -top-1 -end-1" />
                                          )}
                                          <img
                                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`}
                                            alt={isArabic ? poke.name_ar : poke.name_en}
                                            className="w-10 h-10"
                                          />
                                          <p className="text-[10px] font-medium truncate w-full">
                                            {isArabic ? poke.name_ar : poke.name_en}
                                          </p>
                                          <p className="text-[9px] text-muted-foreground">
                                            {tr("page.map.level")} {encounter.min_lvl}-
                                            {encounter.max_lvl}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Smart Empty State */
                          <div className="bg-muted/30 rounded-lg p-4 border border-border">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">
                                  {tr("page.map.whyNoData")}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {getCategoryWhyNoData(category, isArabic ? "ar" : "en")}
                                </p>

                                {/* Similar Locations */}
                                {similarLocations.length > 0 && (
                                  <div className="mt-3">
                                    <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                      {tr("page.map.similarLocations")}
                                    </h5>
                                    <div className="flex gap-2 flex-wrap">
                                      {similarLocations.map((loc) => (
                                        <Button
                                          key={loc.id}
                                          variant="outline"
                                          size="sm"
                                          className="text-xs h-7"
                                          onClick={() => setSelectedLocation(loc)}
                                        >
                                          {isArabic ? loc.name_ar : loc.name_en}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* What to Find - Static info based on category */}
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            {tr("page.map.whatToFind")}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {category === "town" && (
                              <>
                                <div className="bg-blue-500/10 rounded-lg p-2 text-center border border-blue-500/20">
                                  <span className="text-blue-300 text-xs">
                                    {tr("page.map.pokemonCenter")}
                                  </span>
                                </div>
                                <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
                                  <span className="text-red-300 text-xs">
                                    {tr("page.map.pokeMart")}
                                  </span>
                                </div>
                              </>
                            )}
                            {(category === "route" ||
                              category === "wild" ||
                              category === "cave") && (
                              <>
                                <div className="bg-green-500/10 rounded-lg p-2 text-center border border-green-500/20">
                                  <span className="text-green-300 text-xs">
                                    {tr("page.map.wildPokemon")}
                                  </span>
                                </div>
                                <div className="bg-amber-500/10 rounded-lg p-2 text-center border border-amber-500/20">
                                  <span className="text-amber-300 text-xs">
                                    {tr("page.map.hiddenItems")}
                                  </span>
                                </div>
                              </>
                            )}
                            {category === "other" && (
                              <div className="bg-purple-500/10 rounded-lg p-2 text-center border border-purple-500/20 col-span-2">
                                <span className="text-purple-300 text-xs">
                                  {isArabic ? "منطقة خاصة" : "Special Area"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rare Pokémon Section */}
                        {hasPokemonData && (
                          <LocationRarePokemon
                            rarePokemon={Object.values(groupedEncounters)
                              .flat()
                              .map((e) => e.pokemon)
                              .filter((p) => p.is_legendary)}
                            exclusivePokemon={exclusivePokemon}
                          />
                        )}

                        {/* Best Catching Times */}
                        {hasPokemonData && <BestCatchingTimes encounters={locationEncounters} />}

                        {/* Personal Notes */}
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            {tr("page.map.yourNotes")}
                          </h4>
                          <Textarea
                            placeholder={tr("page.map.addNote")}
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            onBlur={handleSaveNote}
                            className="min-h-[80px] text-sm"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant={isFavorite ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleToggleFavorite(selectedLocation.id)}
                          >
                            <Star className={`h-4 w-4 me-1 ${isFavorite ? "fill-current" : ""}`} />
                            {isFavorite
                              ? tr("page.map.removeFromFavorites")
                              : tr("page.map.addToFavorites")}
                          </Button>
                          {similarLocations.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLocation(similarLocations[0])}
                            >
                              <Compass className="h-4 w-4 me-1" />
                              {tr("page.map.exploreSimilar")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </>
                );
              })()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
