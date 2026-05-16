import { useState, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Input } from "@/original/components/ui/input";
import { Button } from "@/original/components/ui/button";
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
import { Search, Plus, X } from "lucide-react";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import { cn } from "@/original/lib/utils";

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
  onSelect: (pokemon: Pokemon) => void;
  label: string;
  color: string;
}

export function PokemonSelector({ pokemon, selectedPokemon, onSelect, label, color }: Props) {
  const { t, language } = useLanguage();
  const { selectedGame, isAvailableInGame } = useGameFilter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPokemon = useMemo(() => {
    let result = pokemon;

    // Filter by game
    if (selectedGame !== "all") {
      result = result.filter((p) => isAvailableInGame(p.available_in));
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name_en.toLowerCase().includes(search) ||
          p.name_ar.includes(search) ||
          p.id.toString().includes(search),
      );
    }

    return result.slice(0, 50); // Limit for performance
  }, [pokemon, selectedGame, searchTerm, isAvailableInGame]);

  const handleSelect = (poke: Pokemon) => {
    onSelect(poke);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {selectedPokemon ? (
          <button
            className={cn(
              "relative w-full p-4 rounded-xl border-2 transition-all hover:scale-[1.02]",
              `border-${color}-500/50 bg-${color}-500/10`,
            )}
            style={{ borderColor: `var(--${color === "blue" ? "primary" : "destructive"})` }}
          >
            <Badge
              className="absolute top-2 left-2 text-xs"
              style={{
                backgroundColor:
                  color === "blue" ? "hsl(var(--primary))" : "hsl(var(--destructive))",
              }}
            >
              {label}
            </Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null as any);
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-muted-foreground/20"
            >
              <X className="w-3 h-3" />
            </button>
            <img
              src={getPokemonArtwork(selectedPokemon.id)}
              alt={selectedPokemon.name_en}
              className="w-24 h-24 mx-auto object-contain"
            />
            <p className="font-bold text-foreground text-center mt-2">
              {language === "ar" ? selectedPokemon.name_ar : selectedPokemon.name_en}
            </p>
            <div className="flex justify-center gap-1 mt-1">
              {selectedPokemon.types?.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </button>
        ) : (
          <button
            className="w-full h-48 rounded-xl border-2 border-dashed border-muted-foreground/30 
                       flex flex-col items-center justify-center gap-2 hover:border-primary/50 
                       hover:bg-muted/50 transition-all"
          >
            <Plus className="w-8 h-8 text-muted-foreground" />
            <span className="text-muted-foreground">{t(`Select ${label}`, `اختر ${label}`)}</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t(`Select ${label}`, `اختر ${label}`)}</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("Search by name or ID...", "ابحث بالاسم أو الرقم...")}
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
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
              {t("No Pokémon found", "لم يتم العثور على بوكيمون")}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
