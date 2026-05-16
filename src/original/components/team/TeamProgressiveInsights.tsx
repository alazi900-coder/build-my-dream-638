import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Progress } from "@/original/components/ui/progress";
import { AlertTriangle, CheckCircle, TrendingUp, Shield } from "lucide-react";
import { getDefensiveMultiplier, ALL_TYPES } from "@/original/lib/typeEffectiveness";
import { cn } from "@/original/lib/utils";
import { LtrToken } from "@/original/components/ui/ltr-token";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
}

interface Props {
  team: (Pokemon | null)[];
}

type AnalysisLevel = "initial" | "partial" | "full";

export function TeamProgressiveInsights({ team }: Props) {
  const { language } = useLanguage();
  const validTeam = team.filter(Boolean) as Pokemon[];
  const teamCount = validTeam.length;

  const analysisLevel: AnalysisLevel =
    teamCount >= 6 ? "full" : teamCount >= 3 ? "partial" : "initial";

  const analysis = useMemo(() => {
    if (teamCount === 0) return null;

    // Get all types in the team
    const teamTypes = new Set<string>();
    validTeam.forEach((p) => p.types.forEach((t) => teamTypes.add(t)));

    // Calculate weaknesses and resistances
    const typeMultipliers: Record<string, number[]> = {};
    ALL_TYPES.forEach((attackType) => {
      typeMultipliers[attackType] = validTeam.map((p) =>
        getDefensiveMultiplier(attackType, p.types),
      );
    });

    // Find major weaknesses (>=2 Pokémon weak to same type)
    const weaknesses: { type: string; count: number; affected: string[] }[] = [];
    const resistances: string[] = [];

    ALL_TYPES.forEach((attackType) => {
      const mults = typeMultipliers[attackType];
      const weakCount = mults.filter((m) => m >= 2).length;
      const resistCount = mults.filter((m) => m < 1).length;

      if (weakCount >= 2) {
        const affected = validTeam
          .filter((_, i) => mults[i] >= 2)
          .map((p) => (language === "ar" ? p.name_ar : p.name_en));
        weaknesses.push({ type: attackType, count: weakCount, affected });
      }
      if (resistCount >= Math.ceil(teamCount / 2)) {
        resistances.push(attackType);
      }
    });

    // Calculate coverage score
    const coveredTypes = ALL_TYPES.filter((t) => {
      const mults = typeMultipliers[t];
      return mults.some((m) => m < 1) || mults.some((m) => m === 0);
    });

    const score = Math.min(
      100,
      Math.round(
        (coveredTypes.length / ALL_TYPES.length) * 100 +
          resistances.length * 3 -
          weaknesses.length * 10,
      ),
    );

    return {
      teamTypes: Array.from(teamTypes),
      weaknesses: weaknesses.sort((a, b) => b.count - a.count).slice(0, 5),
      resistances,
      coveredTypes,
      score: Math.max(0, Math.min(100, score)),
    };
  }, [validTeam, teamCount, language]);

  if (!analysis) return null;

  const levelLabels = {
    initial: { ar: "تحليل مبدئي", en: "Initial Analysis" },
    partial: { ar: "تحليل جزئي", en: "Partial Analysis" },
    full: { ar: "تحليل كامل", en: "Full Analysis" },
  };

  const levelColors = {
    initial: "bg-blue-500/20 text-blue-500",
    partial: "bg-amber-500/20 text-amber-500",
    full: "bg-green-500/20 text-green-500",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {language === "ar" ? "نظرة سريعة" : "Quick Insights"}
          </CardTitle>
          <Badge className={cn("text-xs", levelColors[analysisLevel])}>
            {levelLabels[analysisLevel][language]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{language === "ar" ? "اكتمال الفريق" : "Team Completion"}</span>
            <span>
              <LtrToken>{teamCount}/6</LtrToken>
            </span>
          </div>
          <Progress value={(teamCount / 6) * 100} className="h-2" />
        </div>

        {/* Coverage Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm font-medium">
              {language === "ar" ? "درجة التغطية" : "Coverage Score"}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === "ar"
                ? `${analysis.coveredTypes.length} نوع مغطى`
                : `${analysis.coveredTypes.length} types covered`}
            </p>
          </div>
          <div
            className={cn(
              "text-2xl font-bold",
              analysis.score >= 70
                ? "text-green-500"
                : analysis.score >= 40
                  ? "text-amber-500"
                  : "text-red-500",
            )}
          >
            <LtrToken>{analysis.score}</LtrToken>%
          </div>
        </div>

        {/* Types in Team */}
        <div>
          <p className="text-sm font-medium mb-2">
            {language === "ar" ? "أنواع الفريق" : "Team Types"}
          </p>
          <div className="flex flex-wrap gap-1">
            {analysis.teamTypes.map((type) => (
              <TypeBadge key={type} type={type} size="sm" />
            ))}
          </div>
        </div>

        {/* Warnings (show after 3+ Pokémon) */}
        {analysisLevel !== "initial" && analysis.weaknesses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              {language === "ar" ? "تحذيرات" : "Warnings"}
            </p>
            <div className="space-y-2">
              {analysis.weaknesses.slice(0, analysisLevel === "full" ? 5 : 2).map((w) => (
                <div
                  key={w.type}
                  className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-sm"
                >
                  <TypeBadge type={w.type} size="sm" />
                  <span className="text-destructive">
                    {language === "ar" ? `${w.count} بوكيمون ضعيف` : `${w.count} Pokémon weak`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Good Coverage (show after 3+ Pokémon) */}
        {analysisLevel !== "initial" && analysis.resistances.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-green-500">
              <Shield className="w-4 h-4" />
              {language === "ar" ? "تغطية جيدة" : "Good Coverage"}
            </p>
            <div className="flex flex-wrap gap-1">
              {analysis.resistances.slice(0, 6).map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-xs"
                >
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <TypeBadge type={type} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Analysis Message */}
        {analysisLevel === "full" && analysis.weaknesses.length === 0 && (
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-500">
              {language === "ar" ? "فريق متوازن ممتاز!" : "Excellent balanced team!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
