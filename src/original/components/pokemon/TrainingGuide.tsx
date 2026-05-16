import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { GraduationCap, Target, Zap, Shield, Swords, Heart } from "lucide-react";
import {
  getPokemonRole,
  getRoleLabel,
  trainingTips,
  bestHeldItems,
} from "@/original/lib/pokemonEnhancedData";

interface TrainingGuideProps {
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
}

export function TrainingGuide({ stats }: TrainingGuideProps) {
  const { language } = useLanguage();

  const role = getPokemonRole(stats);
  const roleLabel = getRoleLabel(role, language);
  const tip = trainingTips[role];
  const items = bestHeldItems[role] || [];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "physical_attacker":
        return Swords;
      case "special_attacker":
        return Zap;
      case "physical_tank":
        return Shield;
      case "special_tank":
        return Shield;
      case "support":
        return Heart;
      default:
        return Target;
    }
  };

  const RoleIcon = getRoleIcon(role);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          {language === "ar" ? "دليل التربية" : "Training Guide"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <RoleIcon className="w-3 h-3" />
            {roleLabel}
          </Badge>
        </div>

        {/* Training Tip */}
        <div className="p-3 rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">{language === "ar" ? tip?.ar : tip?.en}</p>
        </div>

        {/* Recommended Items */}
        {items.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">
              {language === "ar" ? "العناصر الموصى بها" : "Recommended Items"}
            </h4>
            <div className="space-y-2">
              {items.slice(0, 3).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                >
                  <span className="text-sm font-medium text-foreground capitalize">
                    {item.item.replace(/-/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {language === "ar" ? item.reason.ar : item.reason.en}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
