import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getPokemonSpriteUrl } from "@/original/lib/imageCache";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import { getDailySpotlightPokemonId, getGenericFunFact } from "@/original/lib/pokemonEnhancedData";
import { usePokemon } from "@/original/hooks/useDataStore";
import { pokemonNamesArabic } from "@/original/data/arabicTranslations";
import { cn } from "@/original/lib/utils";

export function PokemonSpotlight() {
  const { language, tr } = useLanguage();
  const { data: allPokemon, loading } = usePokemon();
  const [spotlightId, setSpotlightId] = useState(getDailySpotlightPokemonId);

  const pokemon = allPokemon.find((p) => p.id === spotlightId);

  if (loading || !pokemon) {
    return null;
  }

  const name =
    language === "ar"
      ? pokemon.name_ar && pokemon.name_ar !== pokemon.name_en
        ? pokemon.name_ar
        : pokemonNamesArabic[pokemon.id] || pokemon.name_en
      : pokemon.name_en;

  const funFact = getGenericFunFact(pokemon.types as string[], pokemon.id, language);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Pokemon Image */}
          <Link
            to={`/pokemon/${pokemon.id}`}
            className="shrink-0 w-20 h-20 bg-muted/30 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
          >
            <OfflineImage
              src={getPokemonSpriteUrl(pokemon.id)}
              alt={name}
              className="w-full h-full object-contain"
              placeholderType="pokemon"
            />
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/30 text-primary text-xs gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {language === "ar" ? "بوكيمون اليوم" : "Today's Spotlight"}
              </Badge>
            </div>

            <Link to={`/pokemon/${pokemon.id}`} className="group">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>

            {/* Types */}
            <div className="flex gap-1 mt-1 mb-2">
              {(pokemon.types as string[])?.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>

            {/* Fun Fact */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              <Star className="w-3 h-3 inline-block text-primary me-1" />
              {funFact}
            </p>
          </div>

          {/* Arrow */}
          <Link
            to={`/pokemon/${pokemon.id}`}
            className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          >
            <ArrowRight className={cn("w-4 h-4", language === "ar" && "rotate-180")} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
