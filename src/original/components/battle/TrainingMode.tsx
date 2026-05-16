import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Switch } from "@/original/components/ui/switch";
import {
  GraduationCap,
  Lightbulb,
  Info,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/original/lib/utils";
import { getDefensiveMultiplier } from "@/original/lib/typeEffectiveness";

interface TrainingTip {
  type: "advantage" | "disadvantage" | "neutral" | "suggestion";
  message_en: string;
  message_ar: string;
}

interface TrainingModeProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  tips: TrainingTip[];
  playerType?: string;
  enemyType?: string;
}

const tipIcons: Record<string, React.ElementType> = {
  advantage: CheckCircle,
  disadvantage: AlertTriangle,
  neutral: Info,
  suggestion: Lightbulb,
};

const tipColors: Record<string, string> = {
  advantage: "bg-green-500/20 border-green-500/30 text-green-300",
  disadvantage: "bg-red-500/20 border-red-500/30 text-red-300",
  neutral: "bg-muted border-border text-muted-foreground",
  suggestion: "bg-chart-2/20 border-chart-2/30 text-chart-2",
};

export function TrainingMode({
  enabled,
  onToggle,
  tips,
  playerType,
  enemyType,
}: TrainingModeProps) {
  const { language } = useLanguage();

  return (
    <Card
      className={cn(
        "border-chart-4/30 transition-all",
        enabled ? "bg-gradient-to-br from-chart-4/10 to-transparent" : "opacity-50",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-chart-4" />
            {language === "ar" ? "وضع التدريب" : "Training Mode"}
          </CardTitle>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-3">
          {/* Type Matchup Quick View */}
          {playerType && enemyType && (
            <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/30">
              <Badge className="capitalize">{playerType}</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge className="capitalize">{enemyType}</Badge>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 ? (
            <div className="space-y-2">
              {tips.map((tip, idx) => {
                const Icon = tipIcons[tip.type] || Info;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg border",
                      tipColors[tip.type],
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      {language === "ar" ? tip.message_ar : tip.message_en}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4">
              <Lightbulb className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "اختر حركة لرؤية النصائح" : "Select a move to see tips"}
              </p>
            </div>
          )}

          {/* Quick Tips Toggle */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              {language === "ar"
                ? "💡 وضع التدريب يعطيك نصائح في الوقت الفعلي"
                : "💡 Training mode gives you real-time battle tips"}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Type name translations
const TYPE_NAMES_AR: Record<string, string> = {
  normal: "عادي",
  fire: "ناري",
  water: "مائي",
  electric: "كهربائي",
  grass: "عشبي",
  ice: "جليدي",
  fighting: "قتالي",
  poison: "سام",
  ground: "أرضي",
  flying: "طائر",
  psychic: "نفسي",
  bug: "حشري",
  rock: "صخري",
  ghost: "شبحي",
  dragon: "تنيني",
  dark: "مظلم",
  steel: "فولاذي",
  fairy: "خيالي",
};

interface BattleContext {
  playerTypes: string[];
  enemyTypes: string[];
  playerHpPercent: number;
  enemyHpPercent: number;
  availableMoveTypes: string[];
}

// Helper function to generate dynamic training tips based on battle state
export function generateTrainingTips(context: BattleContext): TrainingTip[] {
  const tips: TrainingTip[] = [];
  const { playerTypes, enemyTypes, playerHpPercent, enemyHpPercent, availableMoveTypes } = context;

  // Find super effective moves
  const superEffectiveMoves: string[] = [];
  const notEffectiveMoves: string[] = [];
  const normalMoves: string[] = [];

  for (const moveType of availableMoveTypes) {
    const multiplier = getDefensiveMultiplier(moveType, enemyTypes);
    if (multiplier >= 2) {
      superEffectiveMoves.push(moveType);
    } else if (multiplier < 1 && multiplier > 0) {
      notEffectiveMoves.push(moveType);
    } else if (multiplier === 0) {
      notEffectiveMoves.push(moveType);
    } else {
      normalMoves.push(moveType);
    }
  }

  // Add tip for super effective moves
  if (superEffectiveMoves.length > 0) {
    const typesEn = superEffectiveMoves.join(", ");
    const typesAr = superEffectiveMoves.map((t) => TYPE_NAMES_AR[t] || t).join("، ");
    tips.push({
      type: "advantage",
      message_en: `Use ${typesEn}-type moves for super effective damage!`,
      message_ar: `استخدم حركات ${typesAr} للحصول على ضرر مضاعف!`,
    });
  }

  // Warn about not effective moves
  if (notEffectiveMoves.length > 0) {
    const typesEn = notEffectiveMoves.join(", ");
    const typesAr = notEffectiveMoves.map((t) => TYPE_NAMES_AR[t] || t).join("، ");
    tips.push({
      type: "disadvantage",
      message_en: `Avoid ${typesEn}-type moves - they're not very effective`,
      message_ar: `تجنب حركات ${typesAr} - ليست فعالة جداً`,
    });
  }

  // Check enemy threat to player
  for (const enemyType of enemyTypes) {
    const threatMultiplier = getDefensiveMultiplier(enemyType, playerTypes);
    if (threatMultiplier >= 2) {
      const typeAr = TYPE_NAMES_AR[enemyType] || enemyType;
      tips.push({
        type: "disadvantage",
        message_en: `Watch out! Enemy's ${enemyType}-type attacks are super effective against you`,
        message_ar: `احترس! هجمات العدو من نوع ${typeAr} فعالة ضدك`,
      });
      break;
    }
  }

  // HP-based suggestions
  if (playerHpPercent < 30) {
    tips.push({
      type: "suggestion",
      message_en: "Your HP is low - consider switching if possible",
      message_ar: "صحتك منخفضة - فكر في التبديل إن أمكن",
    });
  }

  if (enemyHpPercent < 20 && superEffectiveMoves.length > 0) {
    tips.push({
      type: "suggestion",
      message_en: "Enemy is weak - finish them with a super effective move!",
      message_ar: "العدو ضعيف - أنهِ عليه بحركة فعالة!",
    });
  }

  // If no specific tips, add general advice
  if (tips.length === 0) {
    tips.push({
      type: "neutral",
      message_en: "No type advantages - choose your strongest move",
      message_ar: "لا مميزات للنوع - اختر أقوى حركاتك",
    });
  }

  return tips;
}
