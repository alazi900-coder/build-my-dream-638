import { useState, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Button } from "@/original/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/original/components/ui/dialog";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Sparkles, AlertTriangle, Info } from "lucide-react";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import { getDefensiveMultiplier, ALL_TYPES } from "@/original/lib/typeEffectiveness";
import { toast } from "sonner";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  available_in?: string[];
}

interface Props {
  allPokemon: Pokemon[];
  onApplyTeam: (team: Pokemon[]) => void;
}

export function TeamSuggestButton({ allPokemon, onApplyTeam }: Props) {
  const { language } = useLanguage();
  const { selectedGame, isAvailableInGame } = useGameFilter();
  const [open, setOpen] = useState(false);
  const [suggestedTeam, setSuggestedTeam] = useState<Pokemon[]>([]);

  const generateBalancedTeam = () => {
    // Filter by game availability
    const available =
      selectedGame === "all"
        ? allPokemon
        : allPokemon.filter((p) => isAvailableInGame(p.available_in));

    if (available.length < 6) {
      toast.error(language === "ar" ? "لا يوجد بوكيمون كافي" : "Not enough Pokémon available");
      return;
    }

    const team: Pokemon[] = [];
    const usedTypes = new Set<string>();
    const teamWeaknesses: Record<string, number> = {};

    // Initialize weakness tracker
    ALL_TYPES.forEach((t) => (teamWeaknesses[t] = 0));

    // Sort by stat total for better picks
    const sorted = [...available].sort((a, b) => {
      const totalA = a.stats ? Object.values(a.stats).reduce((s, v) => s + v, 0) : 0;
      const totalB = b.stats ? Object.values(b.stats).reduce((s, v) => s + v, 0) : 0;
      return totalB - totalA;
    });

    // Pick 6 diverse Pokémon
    for (const pokemon of sorted) {
      if (team.length >= 6) break;

      // Check type diversity
      const hasNewType = pokemon.types.some((t) => !usedTypes.has(t));

      // Calculate how many weaknesses this would add
      let weaknessScore = 0;
      ALL_TYPES.forEach((attackType) => {
        const mult = getDefensiveMultiplier(attackType, pokemon.types);
        if (mult >= 2 && teamWeaknesses[attackType] >= 2) {
          weaknessScore += 2; // Avoid stacking weaknesses
        } else if (mult >= 2 && teamWeaknesses[attackType] >= 1) {
          weaknessScore += 1;
        }
      });

      // Skip if too many stacked weaknesses (unless we're desperate)
      if (weaknessScore > 3 && team.length < 4) continue;

      // Prefer diversity in first 4 slots
      if (team.length < 4 && !hasNewType && sorted.indexOf(pokemon) < sorted.length * 0.7) {
        continue;
      }

      // Add to team
      team.push(pokemon);
      pokemon.types.forEach((t) => usedTypes.add(t));

      // Update weakness tracker
      ALL_TYPES.forEach((attackType) => {
        const mult = getDefensiveMultiplier(attackType, pokemon.types);
        if (mult >= 2) teamWeaknesses[attackType]++;
      });
    }

    // Fill remaining slots if needed
    while (team.length < 6 && sorted.length > team.length) {
      const remaining = sorted.filter((p) => !team.includes(p));
      if (remaining.length > 0) {
        team.push(remaining[Math.floor(Math.random() * Math.min(10, remaining.length))]);
      }
    }

    setSuggestedTeam(team);
    setOpen(true);
  };

  const handleApply = () => {
    onApplyTeam(suggestedTeam);
    setOpen(false);
    toast.success(language === "ar" ? "تم تطبيق الفريق المقترح" : "Suggested team applied");
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={generateBalancedTeam} className="gap-2">
        <Sparkles className="w-4 h-4" />
        {language === "ar" ? "فريق متوازن" : "Balanced Team"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {language === "ar" ? "فريق مقترح" : "Suggested Team"}
            </DialogTitle>
            <DialogDescription className="flex items-start gap-2 pt-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                {language === "ar"
                  ? "هذا الاقتراح مبني على تنوع الأنواع وتقليل الثغرات المشتركة. إنه إرشاد وليس قاعدة!"
                  : "This suggestion is based on type diversity and minimizing shared weaknesses. It's guidance, not a rule!"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 my-4">
            {suggestedTeam.map((pokemon) => (
              <div key={pokemon.id} className="text-center p-2 rounded-lg bg-muted/50">
                <img
                  src={getPokemonArtwork(pokemon.id)}
                  alt={pokemon.name_en}
                  className="w-16 h-16 mx-auto object-contain"
                />
                <p className="text-sm font-medium mt-1 truncate">
                  {language === "ar" ? pokemon.name_ar : pokemon.name_en}
                </p>
                <div className="flex justify-center gap-1 mt-1">
                  {pokemon.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleApply} className="flex-1">
              {language === "ar" ? "استخدم هذا الفريق" : "Use This Team"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
