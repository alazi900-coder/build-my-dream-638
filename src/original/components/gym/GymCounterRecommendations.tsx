import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Swords, Shield, Sparkles } from "lucide-react";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import { ALL_TYPES, getFullDefensiveMatchup } from "@/original/lib/typeEffectiveness";

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
}

interface Item {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
  effect_en?: string;
  effect_ar?: string;
}

interface Props {
  gymType: string;
  allPokemon: Pokemon[];
  allMoves: Move[];
  allItems: Item[];
}

// Types that are super effective against each type
const superEffectiveAgainst: Record<string, string[]> = {
  normal: ["fighting"],
  fire: ["water", "ground", "rock"],
  water: ["electric", "grass"],
  electric: ["ground"],
  grass: ["fire", "ice", "poison", "flying", "bug"],
  ice: ["fire", "fighting", "rock", "steel"],
  fighting: ["flying", "psychic", "fairy"],
  poison: ["ground", "psychic"],
  ground: ["water", "grass", "ice"],
  flying: ["electric", "ice", "rock"],
  psychic: ["bug", "ghost", "dark"],
  bug: ["fire", "flying", "rock"],
  rock: ["water", "grass", "fighting", "ground", "steel"],
  ghost: ["ghost", "dark"],
  dragon: ["ice", "dragon", "fairy"],
  dark: ["fighting", "bug", "fairy"],
  steel: ["fire", "fighting", "ground"],
  fairy: ["poison", "steel"],
};

export function GymCounterRecommendations({ gymType, allPokemon, allMoves, allItems }: Props) {
  const { t, language } = useLanguage();
  const { selectedGame, isAvailableInGame } = useGameFilter();

  const recommendations = useMemo(() => {
    const gymTypeLower = gymType.toLowerCase();
    const counterTypes = superEffectiveAgainst[gymTypeLower] || [];

    // Find Pokémon that resist gym type and have STAB super-effective moves
    const counters = allPokemon
      .filter((p) => {
        if (selectedGame !== "all" && !isAvailableInGame(p.available_in)) return false;
        return true;
      })
      .map((p) => {
        const matchup = getFullDefensiveMatchup(p.types);
        const resistsGym = matchup[gymTypeLower] < 1;
        const immuneToGym = matchup[gymTypeLower] === 0;

        // Check if has STAB super-effective
        const hasCounterSTAB = p.types.some((t) => counterTypes.includes(t.toLowerCase()));

        let score = 0;
        let reasons: { en: string; ar: string }[] = [];

        if (immuneToGym) {
          score += 4;
          reasons.push({
            en: `Immune to ${gymType}`,
            ar: `محصن ضد ${gymType}`,
          });
        } else if (resistsGym) {
          score += 2;
          reasons.push({
            en: `Resists ${gymType}`,
            ar: `يقاوم ${gymType}`,
          });
        }

        if (hasCounterSTAB) {
          score += 3;
          const stabTypes = p.types.filter((t) => counterTypes.includes(t.toLowerCase()));
          reasons.push({
            en: `Has ${stabTypes.join("/")} STAB`,
            ar: `لديه STAB من ${stabTypes.join("/")}`,
          });
        }

        return { pokemon: p, score, reasons, resistsGym, immuneToGym, hasCounterSTAB };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // Recommended move types
    const recommendedMoveTypes = counterTypes.slice(0, 3);

    // Find example moves for each type
    const moveSuggestions = recommendedMoveTypes.map((type) => {
      const typeMoves = allMoves
        .filter((m) => {
          if (m.type.toLowerCase() !== type) return false;
          if (!m.power || m.power < 60) return false;
          return true;
        })
        .sort((a, b) => (b.power || 0) - (a.power || 0))
        .slice(0, 2);
      return { type, moves: typeMoves };
    });

    // Item suggestions based on gym type
    const itemSuggestions: { en: string; ar: string; category: string }[] = [];

    // Healing items always useful
    itemSuggestions.push({
      en: "Hyper Potion / Full Restore",
      ar: "جرعة فائقة / استعادة كاملة",
      category: "healing",
    });

    // Status protection based on gym type
    if (["poison", "grass"].includes(gymTypeLower)) {
      itemSuggestions.push({
        en: "Antidote / Pecha Berry",
        ar: "مضاد السم / توت بيتشا",
        category: "status",
      });
    }
    if (["electric"].includes(gymTypeLower)) {
      itemSuggestions.push({
        en: "Paralyze Heal / Cheri Berry",
        ar: "علاج الشلل / توت تشيري",
        category: "status",
      });
    }
    if (["fire", "ice"].includes(gymTypeLower)) {
      itemSuggestions.push({
        en: "Burn/Ice Heal",
        ar: "علاج الحروق/التجمد",
        category: "status",
      });
    }
    if (["psychic", "ghost", "dark"].includes(gymTypeLower)) {
      itemSuggestions.push({
        en: "Persim Berry / Mental Herb",
        ar: "توت بيرسيم / عشب ذهني",
        category: "status",
      });
    }

    // X items for tough battles
    itemSuggestions.push({
      en: "X Attack / X Special Attack",
      ar: "X هجوم / X هجوم خاص",
      category: "boost",
    });

    return { counters, counterTypes, moveSuggestions, itemSuggestions };
  }, [gymType, allPokemon, allMoves, selectedGame, isAvailableInGame]);

  return (
    <div className="space-y-4">
      {/* Counter Types */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            {t("Super Effective Types", "الأنواع الفعالة جداً")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t(`Use these types against ${gymType}:`, `استخدم هذه الأنواع ضد ${gymType}:`)}
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendations.counterTypes.map((type) => (
              <TypeBadge key={type} type={type} size="md" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Counter Pokémon */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            {t("Recommended Counters", "البوكيمون المضادة الموصى بها")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.counters.length > 0 ? (
            <div className="space-y-2">
              {recommendations.counters.map(({ pokemon, reasons }) => (
                <div
                  key={pokemon.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <img
                    src={getPokemonArtwork(pokemon.id)}
                    alt={pokemon.name_en}
                    className="w-12 h-12 object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {language === "ar" ? pokemon.name_ar : pokemon.name_en}
                    </p>
                    <div className="flex gap-1 mt-0.5">
                      {pokemon.types.map((type) => (
                        <TypeBadge key={type} type={type} size="sm" />
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    {reasons.map((reason, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {language === "ar" ? reason.ar : reason.en}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              {t("No specific counters found", "لم يتم العثور على بوكيمون مضادة")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Move Suggestions */}
      {recommendations.moveSuggestions.some((s) => s.moves.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              {t("Recommended Moves", "الحركات الموصى بها")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.moveSuggestions
                .filter((s) => s.moves.length > 0)
                .map(({ type, moves }) => (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <TypeBadge type={type} size="sm" />
                      <span className="text-sm text-muted-foreground">
                        {t("moves:", "الحركات:")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {moves.map((move) => (
                        <Badge key={move.id} variant="secondary" className="text-xs">
                          {language === "ar" ? move.name_ar : move.name_en}
                          {move.power && ` (${move.power})`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Suggestions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("Suggested Items", "العناصر المقترحة")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recommendations.itemSuggestions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm">{language === "ar" ? item.ar : item.en}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {item.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
