/**
 * Quick Insight Card Component
 * Displays a compact summary of Pokemon role, difficulty, strengths and weaknesses
 */

import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Lightbulb, Sparkles } from "lucide-react";
import { Stats } from "@/original/types/pokemon";
import { determineRole, getDifficulty, getStrengths } from "@/original/lib/pokemonAnalysis";
import { cn } from "@/original/lib/utils";

interface TypeEffectiveness {
  type: string;
  multiplier: number;
}

interface Props {
  stats: Stats;
  types: string[];
  isStarter?: boolean;
  isLegendary?: boolean;
  weaknesses: TypeEffectiveness[];
}

export function QuickInsightCard({ stats, types, isStarter, isLegendary, weaknesses }: Props) {
  const { tr, language } = useLanguage();
  const isArabic = language === "ar";

  const role = determineRole(stats);
  const difficulty = getDifficulty(isStarter, isLegendary);
  const strengths = getStrengths(stats, types, language);

  // Get top 2 weaknesses
  const topWeaknesses = weaknesses.slice(0, 2);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
      <CardContent className="p-4">
        <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          {tr("pokemon.quickInsight")}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Role */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{tr("pokemon.role")}</span>
            <p className="font-semibold flex items-center gap-1.5">
              <span>{role.icon}</span>
              <span>{isArabic ? role.ar : role.en}</span>
            </p>
          </div>

          {/* Difficulty */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{tr("pokemon.difficulty")}</span>
            <p className={cn("font-semibold flex items-center gap-1.5", difficulty.color)}>
              {isStarter && <Sparkles className="w-4 h-4" />}
              <span>{isArabic ? difficulty.ar : difficulty.en}</span>
            </p>
          </div>

          {/* Strengths */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{tr("pokemon.strengths")}</span>
            <div className="flex flex-wrap gap-1">
              {strengths.length > 0 ? (
                strengths.map((strength, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {strength}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {isArabic ? "متوازن" : "Balanced"}
                </span>
              )}
            </div>
          </div>

          {/* Warnings */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{tr("pokemon.warnings")}</span>
            <div className="flex flex-wrap gap-1">
              {topWeaknesses.length > 0 ? (
                topWeaknesses.map(({ type }) => <TypeBadge key={type} type={type} size="sm" />)
              ) : (
                <span className="text-sm text-green-400">
                  {isArabic ? "لا نقاط ضعف!" : "No weaknesses!"}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
