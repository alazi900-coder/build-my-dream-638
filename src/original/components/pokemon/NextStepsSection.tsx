/**
 * Next Steps Section Component
 * Displays navigation options at the end of Pokemon detail page
 */

import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Compass, TrendingUp, Map, Users, Sparkles } from "lucide-react";

interface Props {
  pokemonId: number;
  primaryType: string;
  nextEvolutionId?: number;
  hasLocations: boolean;
}

export function NextStepsSection({ pokemonId, primaryType, nextEvolutionId, hasLocations }: Props) {
  const navigate = useNavigate();
  const { tr } = useLanguage();

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          {tr("pokemon.nextSteps")}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* View next evolution */}
          {nextEvolutionId && (
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 h-auto py-3"
              onClick={() => navigate(`/pokemon/${nextEvolutionId}`)}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="text-sm">{tr("pokemon.viewEvolution")}</span>
            </Button>
          )}

          {/* Explore habitats */}
          {hasLocations && (
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 h-auto py-3"
              onClick={() => navigate("/map")}
            >
              <Map className="w-4 h-4 shrink-0" />
              <span className="text-sm">{tr("pokemon.exploreHabitats")}</span>
            </Button>
          )}

          {/* Add to team */}
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-auto py-3"
            onClick={() => navigate("/team", { state: { addPokemon: pokemonId } })}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-sm">{tr("pokemon.addToTeam")}</span>
          </Button>

          {/* Similar Pokemon */}
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-auto py-3"
            onClick={() => navigate("/", { state: { filterType: primaryType } })}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-sm">{tr("pokemon.similarPokemon")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
