import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { MapPin, Users, Star, Swords } from "lucide-react";

type TooltipData = {
  type: "location" | "gym" | "npc";
  name: string;
  nameAr: string;
  subtitle?: string;
  pokemonCount?: number;
  exclusiveCount?: number;
  pokemonPreview?: { id: number; name: string }[];
};

interface LocationTooltipProps {
  data: TooltipData;
  position: { x: number; y: number };
}

export function LocationTooltip({ data, position }: LocationTooltipProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const getIcon = () => {
    switch (data.type) {
      case "gym":
        return <Swords className="w-4 h-4 text-red-500" />;
      case "npc":
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <MapPin className="w-4 h-4 text-green-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (data.type) {
      case "gym":
        return isArabic ? "صالة" : "Gym";
      case "npc":
        return isArabic ? "شخصية" : "NPC";
      default:
        return isArabic ? "موقع" : "Location";
    }
  };

  return (
    <Card
      className="absolute z-50 w-56 shadow-lg border-primary/20 animate-scale-in"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%) translateY(-8px)",
      }}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{isArabic ? data.nameAr : data.name}</p>
            {data.subtitle && <p className="text-xs text-muted-foreground">{data.subtitle}</p>}
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {getTypeLabel()}
          </Badge>
        </div>

        {/* Pokemon Preview */}
        {data.pokemonPreview && data.pokemonPreview.length > 0 && (
          <div className="flex items-center gap-1">
            {data.pokemonPreview.slice(0, 4).map((poke) => (
              <img
                key={poke.id}
                src={getPokemonSprite(poke.id)}
                alt={poke.name}
                className="w-8 h-8"
                title={poke.name}
              />
            ))}
            {data.pokemonPreview.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{data.pokemonPreview.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {(data.pokemonCount !== undefined || data.exclusiveCount !== undefined) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {data.pokemonCount !== undefined && (
              <span>
                {data.pokemonCount} {isArabic ? "بوكيمون" : "Pokémon"}
              </span>
            )}
            {data.exclusiveCount !== undefined && data.exclusiveCount > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3 h-3" />
                {data.exclusiveCount} {isArabic ? "حصري" : "exclusive"}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
