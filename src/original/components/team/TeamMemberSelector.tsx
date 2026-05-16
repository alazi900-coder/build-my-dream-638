import { useState, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Input } from "@/original/components/ui/input";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { TeamInsightBadges } from "@/original/components/team/TeamInsightBadges";
import { Search, Plus, X, Filter } from "lucide-react";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import { cn } from "@/original/lib/utils";
import { getLocalizedType } from "@/original/lib/localization";

const ALL_TYPES = [
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

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  available_in?: string[];
}

interface Props {
  pokemon: Pokemon[];
  selectedPokemon: Pokemon | null;
  onSelect: (pokemon: Pokemon | null) => void;
  slotNumber: number;
  existingTeam?: (Pokemon | null)[];
}

export function TeamMemberSelector({
  pokemon,
  selectedPokemon,
  onSelect,
  slotNumber,
  existingTeam = [],
}: Props) {
  const { tr, language } = useLanguage();
  const { selectedGame, isAvailableInGame } = useGameFilter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeFilters, setShowTypeFilters] = useState(false);

  const filteredPokemon = useMemo(() => {
    let result = pokemon;

    if (selectedGame !== "all") {
      result = result.filter((p) => isAvailableInGame(p.available_in));
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name_en.toLowerCase().includes(search) ||
          p.name_ar.includes(search) ||
          p.id.toString().includes(search),
      );
    }

    if (selectedType) {
      result = result.filter((p) => p.types?.includes(selectedType));
    }

    return result.slice(0, 50);
  }, [pokemon, selectedGame, searchTerm, selectedType, isAvailableInGame]);

  const handleSelect = (poke: Pokemon) => {
    onSelect(poke);
    setOpen(false);
    setSearchTerm("");
    setSelectedType(null);
  };

  // Get existing team excluding current slot for insight calculation
  const teamForInsights = existingTeam.filter((p, i) => p && p.id !== selectedPokemon?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {selectedPokemon ? (
          <button
            className="relative w-full p-3 rounded-xl border-2 border-primary/30 bg-primary/5 
                       transition-all hover:scale-[1.02] hover:border-primary/50"
          >
            <Badge className="absolute top-1 left-1 text-[10px] bg-primary">#{slotNumber}</Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="absolute top-1 right-1 p-1 rounded-full bg-muted hover:bg-destructive/20"
            >
              <X className="w-3 h-3" />
            </button>
            <img
              src={getPokemonArtwork(selectedPokemon.id)}
              alt={selectedPokemon.name_en}
              className="w-16 h-16 mx-auto object-contain"
            />
            <p className="font-medium text-foreground text-center mt-1 text-sm truncate">
              {language === "ar" ? selectedPokemon.name_ar : selectedPokemon.name_en}
            </p>
            <div className="flex justify-center gap-1 mt-1">
              {selectedPokemon.types?.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
            {/* Insight badges for this Pokémon */}
            {teamForInsights.length > 0 && (
              <TeamInsightBadges
                newPokemon={selectedPokemon}
                existingTeam={teamForInsights as (Pokemon | null)[]}
              />
            )}
          </button>
        ) : (
          <button
            className="w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 
                       flex flex-col items-center justify-center gap-1 hover:border-primary/50 
                       hover:bg-muted/50 transition-all"
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{tr("team.addPokemon")}</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{tr("team.selectPokemon")}</DialogTitle>
          {/* First-time helper message */}
          <p className="text-sm text-muted-foreground mt-1">
            {language === "ar"
              ? "ابحث عن البوكيمون بالاسم أو الرقم، ثم اضغط لإضافته لفريقك"
              : "Search by name or number, then tap to add to your team"}
          </p>
        </DialogHeader>

        <div className="space-y-3 mb-4">
          {/* Search input with filter toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tr("team.searchPlaceholder")}
                className="pl-10"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowTypeFilters(!showTypeFilters)}
              className={cn(
                "p-2 rounded-md border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
                showTypeFilters || selectedType
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border hover:border-primary",
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Type filter chips */}
          {showTypeFilters && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedType(null)}
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium transition-colors min-h-[32px]",
                  selectedType === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {language === "ar" ? "الكل" : "All"}
              </button>
              {ALL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type === selectedType ? null : type)}
                  className={cn("transition-transform", selectedType === type && "scale-105")}
                >
                  <TypeBadge
                    type={type}
                    size="sm"
                    className={cn(
                      selectedType === type
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "opacity-70 hover:opacity-100",
                    )}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Active filter indicator */}
          {selectedType && !showTypeFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {language === "ar" ? "فلتر:" : "Filter:"}
              </span>
              <TypeBadge type={selectedType} size="sm" />
              <button
                onClick={() => setSelectedType(null)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[350px] pr-4">
          <div className="grid grid-cols-2 gap-2">
            {filteredPokemon.map((poke) => (
              <button
                key={poke.id}
                onClick={() => handleSelect(poke)}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:border-primary",
                  selectedPokemon?.id === poke.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30",
                )}
              >
                <img
                  src={getPokemonArtwork(poke.id)}
                  alt={poke.name_en}
                  className="w-16 h-16 mx-auto object-contain"
                  loading="lazy"
                />
                <p className="text-xs font-medium text-foreground text-center mt-1 truncate">
                  {language === "ar" ? poke.name_ar : poke.name_en}
                </p>
                <p className="text-[10px] text-muted-foreground text-center">
                  #{poke.id.toString().padStart(3, "0")}
                </p>
              </button>
            ))}
          </div>

          {filteredPokemon.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {tr("team.noPokemonFound")}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
