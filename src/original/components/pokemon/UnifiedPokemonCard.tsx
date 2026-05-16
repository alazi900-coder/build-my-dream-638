import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/original/components/ui/card";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { playPokemonCry } from "@/original/lib/audioCache";
import { AnimatedPokemonSprite } from "@/original/components/pokemon/AnimatedPokemonSprite";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { getLocalizedName } from "@/original/lib/localization";
import type { UnifiedPokemon } from "@/original/hooks/useUnifiedPokemonData";

interface UnifiedPokemonCardProps {
  pokemon: UnifiedPokemon;
  index?: number;
}

export function UnifiedPokemonCard({ pokemon, index = 0 }: UnifiedPokemonCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAboveFold = index < 8;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePlayCry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      const audio = await playPokemonCry(pokemon.id, "latest", 0.5);
      if (audio) {
        audio.onended = () => setIsPlaying(false);
      } else {
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const handleClick = () => {
    navigate(`/pokemon/${pokemon.id}`);
  };

  return (
    <Card
      className="group overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg bg-card cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <CardHeader className="p-0 relative overflow-hidden bg-gradient-to-br from-muted to-secondary/20">
        <div className="absolute top-2 right-2 text-muted-foreground font-mono text-sm z-10">
          #{pokemon.id.toString().padStart(3, "0")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayCry}
          disabled={isPlaying}
          className="absolute top-2 left-2 h-7 w-7 bg-background/80 hover:bg-background backdrop-blur-sm z-10"
        >
          {isPlaying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Badges */}
        <div className="absolute bottom-2 left-2 flex gap-1 z-10">
          {pokemon.is_legendary && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {language === "ar" ? "أسطوري" : "Legendary"}
            </Badge>
          )}
          {pokemon.is_starter && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background/80">
              {language === "ar" ? "بداية" : "Starter"}
            </Badge>
          )}
        </div>

        {/* Static image - hidden on hover */}
        <img
          src={getPokemonArtwork(pokemon.id)}
          alt={getLocalizedName(pokemon.name_en, pokemon.name_ar, language)}
          className={`w-full h-40 object-contain p-4 transition-all duration-300 ${
            isHovered ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          loading={isAboveFold ? "eager" : "lazy"}
          fetchPriority={isAboveFold ? "high" : "auto"}
        />

        {/* Animated sprite - shown on hover */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <AnimatedPokemonSprite
              pokemonId={pokemon.id}
              pokemonName={pokemon.name_en}
              size="lg"
              className="animate-fade-in"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">
              {getLocalizedName(pokemon.name_en, pokemon.name_ar, language)}
            </h3>
            <p className="text-muted-foreground text-xs truncate">
              {language === "ar" ? pokemon.name_en : pokemon.name_ar}
            </p>
          </div>
          <div className="flex gap-1 flex-wrap justify-end shrink-0">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t.toLowerCase()} size="sm" />
            ))}
          </div>
        </div>

        {/* Stats preview */}
        <div className="grid grid-cols-6 gap-1 text-[10px]">
          {[
            { key: "hp", label: "HP", value: pokemon.stats.hp },
            { key: "atk", label: "ATK", value: pokemon.stats.atk },
            { key: "def", label: "DEF", value: pokemon.stats.def },
            { key: "spa", label: "SPA", value: pokemon.stats.spa },
            { key: "spd", label: "SPD", value: pokemon.stats.spd },
            { key: "spe", label: "SPE", value: pokemon.stats.spe },
          ].map((stat) => (
            <div key={stat.key} className="text-center">
              <div className="text-muted-foreground">{stat.label}</div>
              <div className="font-medium text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
