import { useState } from "react";
import { MapPin, ArrowRight, Swords, Volume2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/original/components/ui/card";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Button } from "@/original/components/ui/button";
import { getTypeColor } from "@/original/lib/typeChart";
import { playPokemonCry } from "@/original/lib/audioCache";
import { AnimatedPokemonSprite } from "@/original/components/pokemon/AnimatedPokemonSprite";
import type { Pokemon } from "@/original/data/pokemon";
interface PokemonCardProps {
  pokemon: Pokemon;
  index?: number;
}

// Map Arabic type names to English keys for TypeBadge
const arabicToEnglishType: Record<string, string> = {
  القتال: "fighting",
  العشب: "grass",
  النار: "fire",
  الماء: "water",
  التنين: "dragon",
  الشبح: "ghost",
  الصلب: "steel",
  الصخر: "rock",
  الظلام: "dark",
  العادي: "normal",
  السم: "poison",
  الكهرباء: "electric",
  الجنية: "fairy",
  النفسي: "psychic",
  الحشرات: "bug",
  الأرض: "ground",
  الجليد: "ice",
  الطيران: "flying",
};

const PokemonCard = ({ pokemon, index = 0 }: PokemonCardProps) => {
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

  return (
    <Card
      className="group overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-0 relative overflow-hidden bg-gradient-to-br from-muted to-secondary/20">
        <div className="absolute top-2 right-2 text-muted-foreground font-mono text-sm">
          #{pokemon.id}
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

        {/* Static image - hidden on hover */}
        <img
          src={pokemon.image}
          alt={pokemon.name}
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
              pokemonName={pokemon.name}
              size="lg"
              className="animate-fade-in"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">{pokemon.name}</h3>
            <p className="text-muted-foreground text-sm">{pokemon.nameAr}</p>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {pokemon.type.map((t) => {
              const typeKey = arabicToEnglishType[t] || t.toLowerCase();
              return <TypeBadge key={t} type={typeKey} size="sm" />;
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{pokemon.description}</p>

        {/* Evolution Info */}
        {(pokemon.evolvesFrom || pokemon.evolvesTo) && (
          <div className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
            <ArrowRight className="w-3 h-3 text-primary shrink-0" />
            <div>
              {pokemon.evolvesFrom && (
                <span className="text-muted-foreground">
                  من: <span className="text-foreground font-medium">{pokemon.evolvesFrom}</span>
                </span>
              )}
              {pokemon.evolvesFrom && pokemon.evolvesTo && <span className="mx-1">|</span>}
              {pokemon.evolvesTo && (
                <span className="text-muted-foreground">
                  إلى: <span className="text-foreground font-medium">{pokemon.evolvesTo}</span>
                </span>
              )}
              {pokemon.evolutionMethod && (
                <span className="block text-muted-foreground mt-0.5">
                  ({pokemon.evolutionMethod})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Best Moves */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Swords className="w-3 h-3 text-accent shrink-0" />
            <span className="text-xs font-semibold text-foreground">أفضل الحركات:</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {pokemon.bestMoves.slice(0, 4).map((move) => (
              <div
                key={move.name}
                className="text-xs bg-secondary/50 p-1.5 rounded flex items-center justify-between"
              >
                <span className="text-foreground font-medium truncate">{move.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${getTypeColor(move.type.toLowerCase())}`}
                  title={move.type}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="flex items-start gap-1">
          <MapPin className="w-3 h-3 text-secondary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground line-clamp-2">
            {pokemon.locations.join(" • ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PokemonCard;
