import { useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { GameId } from "@/original/contexts/GameFilterContext";
import { MapLayer } from "./MapLayerToggle";
import { MapFilters } from "./AdvancedMapFilters";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Button } from "@/original/components/ui/button";
import { MapPin, Swords, Users, Star, Navigation } from "lucide-react";
import { GalarMap, KantoMap, HisuiMap } from "./regions";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { LocationTooltip } from "./LocationTooltip";

interface Location {
  id: number;
  name_en: string;
  name_ar: string;
  region: string;
  notes_en: string | null;
  available_in?: string[];
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

interface Encounter {
  pokemon_id: number;
  pokemon?: { id: number; name_en: string; name_ar: string };
}

interface InteractiveRegionMapProps {
  game: GameId;
  locations: Location[];
  gyms: Gym[];
  npcs: NPC[];
  activeLayers: MapLayer[];
  filters: MapFilters;
  onLocationClick: (location: Location) => void;
  onGymClick: (gym: Gym) => void;
  getLocationCategory: (loc: Location) => string;
  getLocationPokemonCount: (locId: number) => number;
  getLocationExclusiveCount: (locId: number) => number;
  encounters?: Encounter[];
}

// Zone ID to location name mapping
const zoneToLocationName: Record<string, Record<string, string>> = {
  galar: {
    postwick: "Postwick",
    wedgehurst: "Wedgehurst",
    route1: "Route 1",
    route2: "Route 2",
    wild_area: "Wild Area",
    motostoke: "Motostoke",
    turffield: "Turffield",
    hulbury: "Hulbury",
    galar_mine: "Galar Mine",
    stow_on_side: "Stow-on-Side",
    ballonlea: "Ballonlea",
    circhester: "Circhester",
    spikemuth: "Spikemuth",
    hammerlocke: "Hammerlocke",
    wyndon: "Wyndon",
    slumbering_weald: "Slumbering Weald",
    lake_of_outrage: "Lake of Outrage",
    giants_mirror: "Giant's Mirror",
  },
  kanto: {
    pallet_town: "Pallet Town",
    viridian_city: "Viridian City",
    viridian_forest: "Viridian Forest",
    pewter_city: "Pewter City",
    mt_moon: "Mt. Moon",
    cerulean_city: "Cerulean City",
    vermilion_city: "Vermilion City",
    rock_tunnel: "Rock Tunnel",
    lavender_town: "Lavender Town",
    celadon_city: "Celadon City",
    saffron_city: "Saffron City",
    fuchsia_city: "Fuchsia City",
    safari_zone: "Safari Zone",
    seafoam_islands: "Seafoam Islands",
    cinnabar_island: "Cinnabar Island",
    power_plant: "Power Plant",
    victory_road: "Victory Road",
    indigo_plateau: "Indigo Plateau",
  },
  hisui: {
    jubilife_village: "Jubilife Village",
    obsidian_fieldlands: "Obsidian Fieldlands",
    crimson_mirelands: "Crimson Mirelands",
    cobalt_coastlands: "Cobalt Coastlands",
    coronet_highlands: "Coronet Highlands",
    alabaster_icelands: "Alabaster Icelands",
  },
};

export function InteractiveRegionMap({
  game,
  locations,
  gyms,
  npcs,
  activeLayers,
  filters,
  onLocationClick,
  onGymClick,
  getLocationCategory,
  getLocationPokemonCount,
  getLocationExclusiveCount,
  encounters = [],
}: InteractiveRegionMapProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [highlightedZone, setHighlightedZone] = useState<string | undefined>();
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<{
    zoneId: string;
    locations: Location[];
    gyms: Gym[];
  } | null>(null);

  // Navigation animation state
  const [navigationPath, setNavigationPath] = useState<{ from: string; to: string } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [previousZone, setPreviousZone] = useState<string | null>(null);

  // Tooltip state for Pokemon preview
  const [tooltipData, setTooltipData] = useState<{
    zoneId: string;
    position: { x: number; y: number };
    location: Location | null;
  } | null>(null);

  // Get region key from game
  const getRegionKey = (gameId: GameId): string => {
    switch (gameId) {
      case "swsh":
        return "galar";
      case "letsgo":
        return "kanto";
      case "arceus":
        return "hisui";
      default:
        return "galar";
    }
  };

  const regionKey = getRegionKey(game);
  const zoneMapping = zoneToLocationName[regionKey] || {};

  // Find location by zone ID
  const findLocationByZone = (zoneId: string): Location | undefined => {
    const locationName = zoneMapping[zoneId];
    if (!locationName) return undefined;
    return locations.find(
      (loc) =>
        loc.name_en.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(loc.name_en.toLowerCase()),
    );
  };

  // Get Pokemon for a location
  const getLocationPokemon = useCallback(
    (locId: number) => {
      return encounters
        .filter((e) => e.pokemon && e.pokemon_id)
        .filter((e, idx, arr) => arr.findIndex((x) => x.pokemon_id === e.pokemon_id) === idx)
        .slice(0, 6)
        .map((e) => ({ id: e.pokemon_id, name: e.pokemon?.name_en || "" }));
    },
    [encounters],
  );

  // Handle zone hover for tooltip
  const handleZoneHover = useCallback(
    (zoneId: string, event: React.MouseEvent) => {
      const location = findLocationByZone(zoneId);
      if (location) {
        const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
        setTooltipData({
          zoneId,
          position: { x: event.clientX - rect.left, y: event.clientY - rect.top },
          location,
        });
        setHighlightedZone(zoneId);
      }
    },
    [locations, zoneMapping],
  );

  const handleZoneLeave = useCallback(() => {
    setTooltipData(null);
    setHighlightedZone(undefined);
  }, []);

  // Handle zone click with navigation animation
  const handleZoneClick = useCallback(
    (zoneId: string) => {
      const location = findLocationByZone(zoneId);

      // Trigger navigation animation
      if (previousZone && previousZone !== zoneId) {
        setNavigationPath({ from: previousZone, to: zoneId });
        setIsNavigating(true);

        setTimeout(() => {
          setIsNavigating(false);
          setNavigationPath(null);
        }, 800);
      }

      setPreviousZone(zoneId);
      setHighlightedZone(zoneId);

      if (location) {
        onLocationClick(location);
      } else {
        // Show zone info panel if no exact location match
        const matchingLocations = locations.filter((loc) => {
          const zoneName = zoneMapping[zoneId]?.toLowerCase() || zoneId.replace(/_/g, " ");
          return (
            loc.name_en.toLowerCase().includes(zoneName) ||
            zoneName.includes(loc.name_en.toLowerCase().split(" ")[0])
          );
        });

        const matchingGyms = gyms.filter((gym) => {
          const zoneName = zoneMapping[zoneId]?.toLowerCase() || zoneId.replace(/_/g, " ");
          return (
            gym.city_en.toLowerCase().includes(zoneName) ||
            zoneName.includes(gym.city_en.toLowerCase())
          );
        });

        if (matchingLocations.length > 0 || matchingGyms.length > 0) {
          setSelectedZoneInfo({ zoneId, locations: matchingLocations, gyms: matchingGyms });
        }
      }
    },
    [previousZone, locations, gyms, zoneMapping, onLocationClick],
  );

  // Generate markers for the map
  const markers = useMemo(() => {
    const result: { zoneId: string; type: "location" | "gym" | "npc"; count?: number }[] = [];

    if (activeLayers.includes("locations")) {
      Object.keys(zoneMapping).forEach((zoneId) => {
        const loc = findLocationByZone(zoneId);
        if (loc) {
          const count = getLocationPokemonCount(loc.id);
          if (count > 0) {
            result.push({ zoneId, type: "location", count });
          }
        }
      });
    }

    return result;
  }, [activeLayers, locations, zoneMapping]);

  // Render the appropriate SVG map
  const renderMap = () => {
    const mapProps = {
      onZoneClick: handleZoneClick,
      onZoneHover: handleZoneHover,
      onZoneLeave: handleZoneLeave,
      highlightedZone,
      markers,
      isNavigating,
      navigationPath,
    };

    switch (game) {
      case "swsh":
        return <GalarMap {...mapProps} />;
      case "letsgo":
        return <KantoMap {...mapProps} />;
      case "arceus":
        return <HisuiMap {...mapProps} />;
      default:
        return <GalarMap {...mapProps} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation indicator */}
      {isNavigating && (
        <div className="flex items-center justify-center gap-2 p-2 bg-primary/10 rounded-lg animate-pulse">
          <Navigation className="w-4 h-4 text-primary animate-bounce" />
          <span className="text-sm text-primary font-medium">
            {isArabic ? "جاري التنقل..." : "Navigating..."}
          </span>
        </div>
      )}

      {/* Main Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="relative" onMouseLeave={handleZoneLeave}>
            {renderMap()}

            {/* Pokemon Preview Tooltip */}
            {tooltipData && tooltipData.location && (
              <LocationTooltip
                data={{
                  type: "location",
                  name: tooltipData.location.name_en,
                  nameAr: tooltipData.location.name_ar,
                  pokemonCount: getLocationPokemonCount(tooltipData.location.id),
                  exclusiveCount: getLocationExclusiveCount(tooltipData.location.id),
                  pokemonPreview: getLocationPokemon(tooltipData.location.id),
                }}
                position={tooltipData.position}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zone Info Panel */}
      {selectedZoneInfo && (
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">
                {zoneMapping[selectedZoneInfo.zoneId] || selectedZoneInfo.zoneId.replace(/_/g, " ")}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedZoneInfo(null)}>
                ✕
              </Button>
            </div>

            {/* Locations in this zone */}
            {selectedZoneInfo.locations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {isArabic ? "المواقع" : "Locations"}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedZoneInfo.locations.map((loc) => (
                    <Button
                      key={loc.id}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto py-2"
                      onClick={() => {
                        onLocationClick(loc);
                        setSelectedZoneInfo(null);
                      }}
                    >
                      <div className="text-start">
                        <p className="font-medium text-xs">
                          {isArabic ? loc.name_ar : loc.name_en}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {getLocationPokemonCount(loc.id)} {isArabic ? "بوكيمون" : "Pokémon"}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Gyms in this zone */}
            {selectedZoneInfo.gyms.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Swords className="w-4 h-4" />
                  {isArabic ? "الصالات" : "Gyms"}
                </h4>
                <div className="space-y-2">
                  {selectedZoneInfo.gyms.map((gym) => (
                    <Button
                      key={gym.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-2"
                      onClick={() => {
                        onGymClick(gym);
                        setSelectedZoneInfo(null);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {gym.type}
                        </Badge>
                        <span className="font-medium text-xs">
                          {isArabic ? gym.leader_name_ar : gym.leader_name_en}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? "موقع" : "Locations"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Swords className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="text-xl font-bold">{gyms.length}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? "صالة" : "Gyms"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold">
              {locations.reduce((sum, loc) => sum + getLocationExclusiveCount(loc.id), 0)}
            </p>
            <p className="text-xs text-muted-foreground">{isArabic ? "حصري" : "Exclusive"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
