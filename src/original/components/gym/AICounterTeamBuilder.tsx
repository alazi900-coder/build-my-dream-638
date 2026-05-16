import { useState } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { supabase } from "@/original/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getPokemonArtworkUrl } from "@/original/lib/imageCache";
import { Loader2, Sparkles, Users, Swords, Target, AlertCircle, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

interface GymRosterPokemon {
  name: string;
  level: number;
  types: string[];
}

interface AvailablePokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
}

interface TeamMember {
  pokemon_id: number;
  pokemon_name: string;
  role: string;
  suggested_moves: string[];
  suggested_item: string;
  strategy_tip: string;
}

interface TeamSuggestion {
  team: TeamMember[];
  overall_strategy: string;
  key_threats: string[];
  battle_order: string;
}

interface Props {
  gymLeader: string;
  gymType: string;
  gymRoster: GymRosterPokemon[];
  availablePokemon: AvailablePokemon[];
}

export function AICounterTeamBuilder({ gymLeader, gymType, gymRoster, availablePokemon }: Props) {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<TeamSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateCounterTeam = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-gym-counter-team", {
        body: {
          gymLeader,
          gymType,
          gymRoster,
          availablePokemon,
          language,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error(
            t(
              "Rate limit exceeded. Please try again later.",
              "تم تجاوز الحد الأقصى. حاول مرة أخرى لاحقاً.",
            ),
          );
        } else if (data.error.includes("credits")) {
          toast.error(t("AI credits exhausted.", "نفذت أرصدة الذكاء الاصطناعي."));
        }
        throw new Error(data.error);
      }

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        toast.success(t("Counter team generated!", "تم إنشاء الفريق المضاد!"));
      } else if (data?.rawAnalysis) {
        setError(
          t(
            "Could not parse AI response. Try again.",
            "تعذر تحليل استجابة الذكاء الاصطناعي. حاول مرة أخرى.",
          ),
        );
      }
    } catch (err) {
      console.error("Error generating counter team:", err);
      setError(
        err instanceof Error ? err.message : t("Failed to generate team", "فشل في إنشاء الفريق"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "attacker":
        return <Swords className="w-3 h-3" />;
      case "defender":
        return <Shield className="w-3 h-3" />;
      case "support":
        return <Zap className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (
    role: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (role.toLowerCase()) {
      case "attacker":
        return "destructive";
      case "defender":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t("AI Counter Team Builder", "بناء فريق مضاد بالذكاء الاصطناعي")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t(
            `Get AI-powered team suggestions to defeat ${gymLeader}`,
            `احصل على اقتراحات فريق بالذكاء الاصطناعي للتغلب على ${gymLeader}`,
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestion && (
          <Button onClick={generateCounterTeam} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("Analyzing...", "جارٍ التحليل...")}
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                {t("Generate Counter Team", "إنشاء فريق مضاد")}
              </>
            )}
          </Button>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {suggestion && (
          <div className="space-y-4">
            {/* Overall Strategy */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {t("Overall Strategy", "الاستراتيجية العامة")}
              </h4>
              <p className="text-sm text-muted-foreground">{suggestion.overall_strategy}</p>
            </div>

            {/* Battle Order */}
            {suggestion.battle_order && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-medium text-sm mb-1">{t("Battle Order", "ترتيب المعركة")}</h4>
                <p className="text-sm text-muted-foreground">{suggestion.battle_order}</p>
              </div>
            )}

            {/* Key Threats */}
            {suggestion.key_threats && suggestion.key_threats.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {t("Watch Out For", "انتبه من")}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {suggestion.key_threats.map((threat, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-destructive/30">
                      {threat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("Suggested Team", "الفريق المقترح")} ({suggestion.team.length}/6)
              </h4>
              <div className="grid gap-3">
                {suggestion.team.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <OfflineImage
                          src={getPokemonArtworkUrl(member.pokemon_id)}
                          alt={member.pokemon_name}
                          className="w-16 h-16 object-contain"
                          placeholderType="pokemon"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{member.pokemon_name}</span>
                          <Badge
                            variant={getRoleBadgeVariant(member.role)}
                            className="text-xs gap-1"
                          >
                            {getRoleIcon(member.role)}
                            {member.role}
                          </Badge>
                        </div>

                        {/* Moves */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {member.suggested_moves.map((move, mIdx) => (
                            <Badge key={mIdx} variant="secondary" className="text-xs">
                              {move}
                            </Badge>
                          ))}
                        </div>

                        {/* Item */}
                        {member.suggested_item && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">{t("Item:", "العنصر:")}</span>{" "}
                            {member.suggested_item}
                          </p>
                        )}

                        {/* Strategy Tip */}
                        {member.strategy_tip && (
                          <p className="text-xs text-primary mt-1 italic">
                            💡 {member.strategy_tip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regenerate Button */}
            <Button
              onClick={generateCounterTeam}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Regenerating...", "جارٍ إعادة الإنشاء...")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("Regenerate Team", "إعادة إنشاء الفريق")}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
