import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Lightbulb, Sparkles, History, Star } from "lucide-react";
import { pokemonFunFacts, getGenericFunFact } from "@/original/lib/pokemonEnhancedData";

interface PokemonFunFactsProps {
  pokemonId: number;
  types: string[];
}

export function PokemonFunFacts({ pokemonId, types }: PokemonFunFactsProps) {
  const { language } = useLanguage();

  // Get specific facts or generate generic ones
  const specificFacts = pokemonFunFacts[pokemonId];
  const facts = specificFacts
    ? language === "ar"
      ? specificFacts.ar
      : specificFacts.en
    : [getGenericFunFact(types, pokemonId, language)];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          {language === "ar" ? "حقائق ممتعة" : "Fun Facts"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {facts.map((fact, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Star className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{fact}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
