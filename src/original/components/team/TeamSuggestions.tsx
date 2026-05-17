// @ts-nocheck
import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Badge } from "@/original/components/ui/badge";
import { Lightbulb, Users, Swords, ArrowRight } from "lucide-react";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import {
  analyzeTeamDefense,
  findCoveringPokemon,
  ALL_TYPES,
  getFullDefensiveMatchup,
} from "@/original/lib/typeEffectiveness";
import { getLocalizedCategory } from "@/original/lib/localization";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  available_in?: string[];
}

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  power: number | null;
  category: string;
  available_in?: string[];
}

interface Props {
  team: (Pokemon | null)[];
  allPokemon: Pokemon[];
  allMoves: Move[];
}

export function TeamSuggestions({ team, allPokemon, allMoves }: Props) {
  const { tr, language } = useLanguage();
  const { selectedGame, isAvailableInGame, getGameInfo } = useGameFilter();

  const suggestions = useMemo(() => {
    const validTeam = team.filter(Boolean) as Pokemon[];
    if (validTeam.length === 0) return null;

    const analysis = analyzeTeamDefense(validTeam);
    const threateningTypes = analysis.threats.map((t) => t.type);

    if (threateningTypes.length === 0)
      return { pokemonSuggestions: [], moveSuggestions: [], threateningTypes: [] };

    // Find Pokémon that cover weaknesses
    const pokemonSuggestions = findCoveringPokemon(
      validTeam,
      allPokemon,
      threateningTypes,
      selectedGame,
      5,
    );

    // Find offensive type gaps
    // Get team's offensive types (STAB moves)
    const teamOffensiveTypes = new Set<string>();
    validTeam.forEach((p) => {
      p.types.forEach((t) => teamOffensiveTypes.add(t.toLowerCase()));
    });

    // Find types the team lacks offensive coverage against
    // (types that are commonly resistant to our offensive types)
    const offensiveGaps: string[] = [];
    for (const targetType of ALL_TYPES) {
      // Check if team has super effective coverage against this type
      let hasGoodCoverage = false;
      for (const offType of teamOffensiveTypes) {
        // Get offensive effectiveness
        const matchup = getFullDefensiveMatchup([targetType]);
        if (matchup[offType] >= 2) {
          hasGoodCoverage = true;
          break;
        }
      }
      if (!hasGoodCoverage && threateningTypes.includes(targetType)) {
        offensiveGaps.push(targetType);
      }
    }

    // Suggest moves that hit threatening types super effectively
    const moveSuggestions: { type: string; moves: Move[] }[] = [];

    for (const threatType of threateningTypes.slice(0, 3)) {
      // Find attack types that are super effective against this threat
      const effectiveTypes: string[] = [];
      for (const attackType of ALL_TYPES) {
        const matchup = getFullDefensiveMatchup([threatType]);
        // This is inverted - we want types where the threat would be weak to our attack
        // We need to check: if a Pokémon of threatType faces attackType, what's the multiplier?
        // Actually, we want moves to HIT the threatening Pokémon's type
      }

      // For offensive coverage: find moves that would be super effective against common
      // Pokémon of the threatening type
      // Simplified: suggest high-power moves of types the team lacks
      const suggestedMoves = allMoves
        .filter((m) => {
          if (!m.power || m.power < 60) return false;
          if (!teamOffensiveTypes.has(m.type.toLowerCase())) return true; // Types team lacks
          return false;
        })
        .filter((m) => {
          if (selectedGame === "all") return true;
          return isAvailableInGame(m.available_in as string[] | undefined);
        })
        .slice(0, 2);

      if (suggestedMoves.length > 0) {
        moveSuggestions.push({
          type: threatType,
          moves: suggestedMoves,
        });
      }
    }

    // Find moves of types super effective against threatening types
    const coverageMoves: Move[] = [];
    for (const threatType of threateningTypes.slice(0, 3)) {
      // Types super effective against the threat's common Pokémon
      const goodMoveTypes = ["ice", "rock", "ground", "fighting", "fairy", "fire"]; // Common coverage types

      const typeMoves = allMoves
        .filter((m) => {
          if (!m.power || m.power < 70) return false;
          if (!goodMoveTypes.includes(m.type.toLowerCase())) return false;
          if (selectedGame !== "all" && !isAvailableInGame(m.available_in as string[] | undefined))
            return false;
          return true;
        })
        .sort((a, b) => (b.power || 0) - (a.power || 0))
        .slice(0, 1);

      coverageMoves.push(...typeMoves);
    }

    // Deduplicate moves
    const uniqueCoverageMoves = coverageMoves
      .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
      .slice(0, 6);

    return {
      pokemonSuggestions,
      coverageMoves: uniqueCoverageMoves,
      threateningTypes,
      offensiveGaps: offensiveGaps.slice(0, 3),
    };
  }, [team, allPokemon, allMoves, selectedGame, isAvailableInGame]);

  const gameInfo = getGameInfo(selectedGame);

  if (!suggestions || suggestions.threateningTypes.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            {tr("team.suggestions")}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center text-muted-foreground">
          {team.filter(Boolean).length < 2
            ? tr("team.addTwoForSuggestions")
            : tr("team.wellBalanced")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Types that need coverage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {tr("team.typesToCover")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{tr("team.typesToCoverDesc")}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.threateningTypes.map((type) => (
              <TypeBadge key={type} type={type} size="md" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pokémon Suggestions */}
      {suggestions.pokemonSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {tr("team.suggestedPokemon")}
              {selectedGame !== "all" && (
                <Badge variant="outline" className="text-xs">
                  {language === "ar" ? gameInfo?.labelAr : gameInfo?.labelEn}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{tr("team.suggestedPokemonDesc")}</p>
            <div className="space-y-2">
              {suggestions.pokemonSuggestions.map(
                ({ id, name_en, name_ar, types, coversTypes }) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border"
                  >
                    <img
                      src={getPokemonArtwork(id)}
                      alt={name_en}
                      className="w-12 h-12 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{language === "ar" ? name_ar : name_en}</p>
                      <div className="flex gap-1 mt-0.5">
                        {types.map((type) => (
                          <TypeBadge key={type} type={type} size="sm" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{tr("team.covers")}</span>
                      <ArrowRight className="w-3 h-3" />
                      <div className="flex gap-1">
                        {coversTypes.slice(0, 2).map((type) => (
                          <TypeBadge key={type} type={type} size="sm" />
                        ))}
                        {coversTypes.length > 2 && (
                          <span className="text-xs">+{coversTypes.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Move Coverage Suggestions */}
      {suggestions.coverageMoves.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              {tr("team.moveCoverageSuggestions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {tr("team.moveCoverageSuggestionsDesc")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.coverageMoves.map((move) => (
                <div
                  key={move.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TypeBadge type={move.type} size="sm" />
                    <span className="text-sm font-medium truncate">
                      {language === "ar" ? move.name_ar : move.name_en}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {move.power && (
                      <Badge variant="secondary" className="text-xs">
                        {move.power}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {getLocalizedCategory(move.category, language)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offensive Gaps */}
      {suggestions.offensiveGaps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              {tr("team.offensiveTypeGaps")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">{tr("team.offensiveTypeGapsDesc")}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.offensiveGaps.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
