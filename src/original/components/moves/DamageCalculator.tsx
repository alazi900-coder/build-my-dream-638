import { useState, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Slider } from "@/original/components/ui/slider";
import { Calculator, Zap, Shield } from "lucide-react";
import { TYPE_CHART } from "@/original/lib/typeChart";
import { LtrToken } from "@/original/components/ui/ltr-token";

interface DamageCalculatorProps {
  movePower: number | null;
  moveType: string;
  moveCategory: string;
  defenderTypes?: string[];
}

// Helper function to get type effectiveness
function getTypeEffectiveness(attackType: string, defendType: string): number {
  const chart = TYPE_CHART[attackType.toLowerCase()];
  if (!chart) return 1;
  return chart[defendType.toLowerCase()] ?? 1;
}

export function DamageCalculator({
  movePower,
  moveType,
  moveCategory,
  defenderTypes = [],
}: DamageCalculatorProps) {
  const { language } = useLanguage();
  const [attackerLevel, setAttackerLevel] = useState(50);
  const [attackerStat, setAttackerStat] = useState(100);
  const [defenderStat, setDefenderStat] = useState(100);
  const [isSTAB, setIsSTAB] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const basePower = movePower || 0;

  // Calculate type effectiveness
  const effectiveness = useMemo(() => {
    if (defenderTypes.length === 0) return 1;
    let eff = 1;
    for (const defType of defenderTypes) {
      eff *= getTypeEffectiveness(moveType, defType);
    }
    return eff;
  }, [moveType, defenderTypes]);

  // Simplified damage formula
  const calculateDamage = () => {
    if (basePower === 0) return { min: 0, max: 0 };

    // Base damage calculation (simplified)
    const levelFactor = (2 * attackerLevel) / 5 + 2;
    const statRatio = attackerStat / defenderStat;
    const baseDamage = Math.floor((levelFactor * basePower * statRatio) / 50 + 2);

    // Apply modifiers
    let modifier = 1;
    if (isSTAB) modifier *= 1.5;
    if (isCritical) modifier *= 1.5;
    modifier *= effectiveness;

    const maxDamage = Math.floor(baseDamage * modifier);
    const minDamage = Math.floor(maxDamage * 0.85); // Random factor

    return { min: minDamage, max: maxDamage };
  };

  const damage = calculateDamage();

  const getEffectivenessLabel = () => {
    if (effectiveness === 0)
      return { en: "No Effect", ar: "لا تأثير", color: "text-muted-foreground" };
    if (effectiveness === 0.25)
      return { en: "¼× (Very Weak)", ar: "¼× (ضعيف جداً)", color: "text-red-400" };
    if (effectiveness === 0.5)
      return { en: "½× (Not Very Effective)", ar: "½× (غير فعال)", color: "text-orange-400" };
    if (effectiveness === 1)
      return { en: "1× (Normal)", ar: "1× (عادي)", color: "text-foreground" };
    if (effectiveness === 2)
      return { en: "2× (Super Effective)", ar: "2× (فعال جداً)", color: "text-green-400" };
    if (effectiveness === 4)
      return { en: "4× (Ultra Effective)", ar: "4× (فعال للغاية)", color: "text-emerald-400" };
    return { en: `${effectiveness}×`, ar: `${effectiveness}×`, color: "text-foreground" };
  };

  const effLabel = getEffectivenessLabel();

  if (moveCategory === "status") {
    return (
      <Card className="border-muted">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {language === "ar"
              ? "حركات الحالة لا تسبب ضرراً مباشراً"
              : "Status moves do not deal direct damage"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          {language === "ar" ? "حاسبة الضرر" : "Damage Calculator"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Slider */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{language === "ar" ? "المستوى" : "Level"}</span>
            <LtrToken className="font-bold">{attackerLevel}</LtrToken>
          </div>
          <Slider
            value={[attackerLevel]}
            onValueChange={([val]) => setAttackerLevel(val)}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Attack Stat */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {language === "ar"
                ? moveCategory === "physical"
                  ? "الهجوم"
                  : "الهجوم الخاص"
                : moveCategory === "physical"
                  ? "Attack"
                  : "Sp. Attack"}
            </span>
            <LtrToken className="font-bold">{attackerStat}</LtrToken>
          </div>
          <Slider
            value={[attackerStat]}
            onValueChange={([val]) => setAttackerStat(val)}
            min={10}
            max={400}
            step={5}
            className="w-full"
          />
        </div>

        {/* Defense Stat */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {language === "ar"
                ? moveCategory === "physical"
                  ? "دفاع الخصم"
                  : "الدفاع الخاص"
                : moveCategory === "physical"
                  ? "Foe's Defense"
                  : "Foe's Sp. Def"}
            </span>
            <LtrToken className="font-bold">{defenderStat}</LtrToken>
          </div>
          <Slider
            value={[defenderStat]}
            onValueChange={([val]) => setDefenderStat(val)}
            min={10}
            max={400}
            step={5}
            className="w-full"
          />
        </div>

        {/* Modifiers */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isSTAB ? "default" : "outline"}
            size="sm"
            onClick={() => setIsSTAB(!isSTAB)}
            className="text-xs"
          >
            STAB (×1.5)
          </Button>
          <Button
            variant={isCritical ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCritical(!isCritical)}
            className="text-xs"
          >
            {language === "ar" ? "ضربة حرجة" : "Critical Hit"}
          </Button>
        </div>

        {/* Type Effectiveness */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
          <span className="text-sm text-muted-foreground">
            {language === "ar" ? "فعالية النوع" : "Type Effectiveness"}
          </span>
          <span className={`text-sm font-bold ${effLabel.color}`}>
            {language === "ar" ? effLabel.ar : effLabel.en}
          </span>
        </div>

        {/* Result */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            {language === "ar" ? "الضرر المتوقع" : "Expected Damage"}
          </p>
          <p className="text-2xl font-bold text-primary">
            <LtrToken>
              {damage.min} - {damage.max}
            </LtrToken>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
