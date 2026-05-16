import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { Sparkles, Star, Crown } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[] | { name: string }[];
  is_legendary?: boolean | null;
  is_starter?: boolean | null;
}

interface LocationRarePokemonProps {
  rarePokemon: Pokemon[];
  exclusivePokemon: Pokemon[];
}

export function LocationRarePokemon({ rarePokemon, exclusivePokemon }: LocationRarePokemonProps) {
  const { language } = useLanguage();

  const getTypeString = (types: string[] | { name: string }[]): string[] => {
    if (!types || !Array.isArray(types)) return [];
    return types.map((t) => (typeof t === "string" ? t : t.name));
  };

  const allSpecial = [
    ...exclusivePokemon,
    ...rarePokemon.filter((p) => !exclusivePokemon.some((e) => e.id === p.id)),
  ];

  if (allSpecial.length === 0) return null;

  return (
    <Card className="border-chart-3/30 bg-gradient-to-br from-chart-3/10 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-chart-3" />
          {language === "ar" ? "البوكيمون النادرة" : "Rare Pokémon"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {allSpecial.slice(0, 6).map((poke) => {
          const isExclusive = exclusivePokemon.some((e) => e.id === poke.id);
          const isLegendary = poke.is_legendary;

          return (
            <div
              key={poke.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg",
                isLegendary ? "bg-chart-3/20 border border-chart-3/30" : "bg-muted/30",
              )}
            >
              <OfflineImage
                src={getPokemonSprite(poke.id)}
                alt={language === "ar" ? poke.name_ar : poke.name_en}
                className="w-10 h-10"
                placeholderType="pokemon"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {language === "ar" ? poke.name_ar || poke.name_en : poke.name_en}
                </p>
                <div className="flex gap-1 mt-1">
                  {getTypeString(poke.types).map((type) => (
                    <TypeBadge key={type} type={type} size="sm" />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                {isLegendary && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-chart-3/20 text-chart-3 border-chart-3/30"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    {language === "ar" ? "أسطوري" : "Legendary"}
                  </Badge>
                )}
                {isExclusive && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-primary/20 text-primary border-primary/30"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {language === "ar" ? "حصري" : "Exclusive"}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        {allSpecial.length > 6 && (
          <p className="text-xs text-center text-muted-foreground">
            {language === "ar"
              ? `+${allSpecial.length - 6} بوكيمون آخر`
              : `+${allSpecial.length - 6} more Pokémon`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
