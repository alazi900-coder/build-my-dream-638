import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Badge } from "@/original/components/ui/badge";
import { AlertTriangle, Shield, CheckCircle, Target } from "lucide-react";
import { analyzeTeamDefense, TeamDefensiveAnalysis } from "@/original/lib/typeEffectiveness";
import { cn } from "@/original/lib/utils";
import { getLocalizedType } from "@/original/lib/localization";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
}

interface Props {
  team: (Pokemon | null)[];
}

export function TeamThreatAnalysis({ team }: Props) {
  const { tr, language } = useLanguage();

  const analysis = useMemo((): TeamDefensiveAnalysis | null => {
    const validTeam = team.filter(Boolean) as Pokemon[];
    if (validTeam.length === 0) return null;
    return analyzeTeamDefense(validTeam);
  }, [team]);

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {tr("team.addToSeeThreats")}
        </CardContent>
      </Card>
    );
  }

  const validTeam = team.filter(Boolean) as Pokemon[];
  const teamSize = validTeam.length;

  // Calculate team score
  const getTeamScore = () => {
    const criticalThreats = analysis.threats.filter(
      (threat) => threat.quadWeakCount > 0 || threat.weakCount >= 3,
    );
    const majorThreats = analysis.threats.filter(
      (threat) => threat.weakCount >= 2 && !criticalThreats.includes(threat),
    );

    if (criticalThreats.length >= 2)
      return { label: tr("team.scoreCritical"), color: "text-destructive", score: 1 };
    if (criticalThreats.length === 1 || majorThreats.length >= 3)
      return { label: tr("team.scoreWeak"), color: "text-orange-500", score: 2 };
    if (majorThreats.length >= 1)
      return { label: tr("team.scoreFair"), color: "text-yellow-500", score: 3 };
    if (analysis.threats.length <= 2)
      return { label: tr("team.scoreExcellent"), color: "text-green-500", score: 5 };
    return { label: tr("team.scoreGood"), color: "text-green-400", score: 4 };
  };

  const teamScore = getTeamScore();

  // Generate bilingual explanation for each threat
  const getThreatExplanation = (threat: TeamDefensiveAnalysis["threats"][0]) => {
    const affectedNames = threat.affectedPokemon.slice(0, 3);
    const moreCount = threat.affectedPokemon.length - 3;
    const localizedType = getLocalizedType(threat.type, language);

    if (language === "ar") {
      let text = `فريقك ضعيف ضد ${localizedType} لأن `;
      if (threat.quadWeakCount > 0) {
        text += `${threat.quadWeakCount} بوكيمون يتلقى ×4 ضرر`;
        if (threat.weakCount > 0) text += ` و${threat.weakCount} يتلقى ×2`;
      } else {
        text += `${threat.weakCount} بوكيمون يتلقى ×2 ضرر`;
      }
      text += ` (${affectedNames.join("، ")}${moreCount > 0 ? ` +${moreCount}` : ""})`;
      return text;
    } else {
      let text = `Your team is weak to ${localizedType} because `;
      if (threat.quadWeakCount > 0) {
        text += `${threat.quadWeakCount} Pokémon take ×4 damage`;
        if (threat.weakCount > 0) text += ` and ${threat.weakCount} take ×2`;
      } else {
        text += `${threat.weakCount} Pokémon take ×2 damage`;
      }
      text += ` (${affectedNames.join(", ")}${moreCount > 0 ? ` +${moreCount}` : ""})`;
      return text;
    }
  };

  return (
    <div className="space-y-4">
      {/* Team Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {tr("team.defensiveSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", teamScore.color)}>{teamScore.label}</span>
                <Badge variant="outline" className="text-xs">
                  {teamSize}/6 {tr("team.pokemon")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "ar"
                  ? `${analysis.threats.length} أنواع مهددة • ${analysis.coveredTypes.length} مغطاة جيداً`
                  : `${analysis.threats.length} threatening types • ${analysis.coveredTypes.length} well covered`}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-destructive/10">
              <div className="text-xl font-bold text-destructive">{analysis.threats.length}</div>
              <div className="text-xs text-muted-foreground">{tr("team.threats")}</div>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10">
              <div className="text-xl font-bold text-green-500">{analysis.coveredTypes.length}</div>
              <div className="text-xs text-muted-foreground">{tr("team.covered")}</div>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <div className="text-xl font-bold text-primary">
                {new Set(validTeam.flatMap((p) => p.types)).size}
              </div>
              <div className="text-xs text-muted-foreground">{tr("team.typeDiversity")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Threats */}
      {analysis.threats.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <Target className="w-5 h-5" />
              {tr("team.biggestThreats")}
              <Badge variant="destructive" className="text-xs">
                {tr("team.top5")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.threats.map((threat, idx) => {
              const isCritical = threat.quadWeakCount > 0 || threat.weakCount >= 3;
              return (
                <div
                  key={threat.type}
                  className={cn(
                    "p-3 rounded-lg border",
                    isCritical
                      ? "bg-destructive/10 border-destructive/30"
                      : "bg-orange-500/10 border-orange-500/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                      <TypeBadge type={threat.type} size="md" />
                      <div className="flex gap-1">
                        {threat.quadWeakCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {threat.quadWeakCount}×4
                          </Badge>
                        )}
                        {threat.weakCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-orange-500 text-orange-500"
                          >
                            {threat.weakCount}×2
                          </Badge>
                        )}
                        {threat.resistCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-green-500 text-green-500"
                          >
                            {threat.resistCount} {tr("team.resist")}
                          </Badge>
                        )}
                        {threat.immuneCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-500 text-slate-500"
                          >
                            {threat.immuneCount} {tr("team.immune")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isCritical && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                  </div>
                  <p
                    className="text-sm text-muted-foreground mt-2"
                    dir={language === "ar" ? "rtl" : "ltr"}
                  >
                    {getThreatExplanation(threat)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Well Covered Types */}
      {analysis.coveredTypes.length > 0 && (
        <Card className="border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              {tr("team.wellCoveredTypes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{tr("team.wellCoveredTypesDesc")}</p>
            <div className="flex flex-wrap gap-2">
              {analysis.coveredTypes.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No threats message */}
      {analysis.threats.length === 0 && (
        <Card className="border-green-500/30">
          <CardContent className="py-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-500 font-medium">{tr("team.excellentBalance")}</p>
            <p className="text-sm text-muted-foreground mt-1">{tr("team.noMajorWeaknesses")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
