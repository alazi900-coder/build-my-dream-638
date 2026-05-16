import { useLanguage } from "@/original/contexts/LanguageContext";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { ScrollArea, ScrollBar } from "@/original/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/original/components/ui/tooltip";
import {
  ALL_TYPES,
  getDefensiveMultiplier,
  getMultiplierColor,
  getMultiplierLabel,
} from "@/original/lib/typeEffectiveness";
import { Grid3X3, Info, AlertTriangle, Shield, Ban } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
}

interface Props {
  team: (Pokemon | null)[];
}

export function TeamCoverageHeatmap({ team }: Props) {
  const { tr, language } = useLanguage();
  const validTeam = team.filter(Boolean) as Pokemon[];

  if (validTeam.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {language === "ar"
              ? "أضف بوكيمون لرؤية خريطة الضرر"
              : "Add Pokémon to see the damage heatmap"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "ar"
              ? "ستظهر نقاط القوة والضعف لكل نوع ضد فريقك"
              : "Shows how each type affects your team"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate danger levels for each type
  const typeAnalysis = ALL_TYPES.map((attackerType) => {
    const multipliers = validTeam.map((poke) => getDefensiveMultiplier(attackerType, poke.types));
    const weakCount = multipliers.filter((m) => m >= 2).length;
    const resistCount = multipliers.filter((m) => m > 0 && m < 1).length;
    const immuneCount = multipliers.filter((m) => m === 0).length;

    let danger: "high" | "medium" | "low" | "safe" = "safe";
    if (weakCount >= 3) danger = "high";
    else if (weakCount >= 2 && resistCount === 0 && immuneCount === 0) danger = "medium";
    else if (weakCount >= 1 && resistCount === 0 && immuneCount === 0) danger = "low";

    return { attackerType, multipliers, weakCount, resistCount, immuneCount, danger };
  });

  const dangerLabels = {
    high: {
      ar: "خطر مرتفع",
      en: "High Risk",
      color: "text-red-500 bg-red-500/10",
      icon: AlertTriangle,
    },
    medium: {
      ar: "ثغرة واضحة",
      en: "Clear Gap",
      color: "text-amber-500 bg-amber-500/10",
      icon: AlertTriangle,
    },
    low: {
      ar: "مخاطرة محدودة",
      en: "Minor Risk",
      color: "text-yellow-500 bg-yellow-500/10",
      icon: Info,
    },
    safe: {
      ar: "تغطية جيدة",
      en: "Good Coverage",
      color: "text-green-500 bg-green-500/10",
      icon: Shield,
    },
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              {language === "ar" ? "خريطة الضرر" : "Damage Heatmap"}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                <p className="text-sm">
                  {language === "ar"
                    ? "تظهر هذه الخريطة كيف يتأثر كل عضو في فريقك بالهجمات من كل نوع. الصفوف الحمراء تعني خطورة عالية."
                    : "This map shows how each team member is affected by attacks of each type. Red rows indicate high danger."}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {/* Quick Summary */}
          <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg bg-muted/50">
            {(["high", "medium", "safe"] as const).map((level) => {
              const count = typeAnalysis.filter((t) => t.danger === level).length;
              if (count === 0 && level !== "safe") return null;
              const config = dangerLabels[level];
              const Icon = config.icon;
              return (
                <div
                  key={level}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                    config.color,
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{config[language]}</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          <ScrollArea className="w-full">
            <div className="min-w-[600px]">
              {/* Header row with Pokémon names */}
              <div className="flex border-b border-border">
                <div className="w-24 shrink-0 p-2 text-xs font-medium text-muted-foreground">
                  {language === "ar" ? "النوع المهاجم" : "Attack Type"}
                </div>
                {validTeam.map((poke) => (
                  <div
                    key={poke.id}
                    className="flex-1 min-w-[80px] p-2 text-center text-xs font-medium truncate border-l border-border"
                    title={language === "ar" ? poke.name_ar : poke.name_en}
                  >
                    {language === "ar" ? poke.name_ar : poke.name_en}
                  </div>
                ))}
                <div className="w-28 shrink-0 p-2 text-center text-xs font-medium border-l border-border">
                  {language === "ar" ? "الحالة" : "Status"}
                </div>
              </div>

              {/* Type rows */}
              {typeAnalysis.map(({ attackerType, multipliers, danger }) => {
                const config = dangerLabels[danger];
                const Icon = config.icon;

                return (
                  <div
                    key={attackerType}
                    className={cn(
                      "flex border-b border-border/50 hover:bg-muted/50",
                      danger === "high" && "bg-destructive/10",
                      danger === "medium" && "bg-amber-500/10",
                    )}
                  >
                    <div className="w-24 shrink-0 p-1.5 flex items-center">
                      <TypeBadge type={attackerType} size="sm" />
                    </div>
                    {multipliers.map((mult, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "flex-1 min-w-[80px] p-1.5 text-center text-xs font-bold border-l border-border/50 cursor-help",
                              getMultiplierColor(mult),
                            )}
                          >
                            {getMultiplierLabel(mult)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {mult === 0 &&
                              (language === "ar" ? "محصن - لا يتأثر" : "Immune - No effect")}
                            {mult === 0.25 &&
                              (language === "ar"
                                ? "مقاوم جداً - ¼ ضرر"
                                : "Very resistant - ¼ damage")}
                            {mult === 0.5 &&
                              (language === "ar" ? "مقاوم - ½ ضرر" : "Resistant - ½ damage")}
                            {mult === 1 &&
                              (language === "ar" ? "عادي - ضرر طبيعي" : "Normal - regular damage")}
                            {mult === 2 &&
                              (language === "ar" ? "ضعيف - ×2 ضرر" : "Weak - ×2 damage")}
                            {mult === 4 &&
                              (language === "ar" ? "ضعيف جداً - ×4 ضرر" : "Very weak - ×4 damage")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    <div
                      className={cn(
                        "w-28 shrink-0 p-1.5 text-center text-xs border-l border-border flex items-center justify-center gap-1",
                        config.color,
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{config[language]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border text-xs">
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-6 h-4 rounded text-center text-[10px] font-bold flex items-center justify-center",
                  getMultiplierColor(0),
                )}
              >
                <Ban className="w-3 h-3" />
              </div>
              <span className="text-muted-foreground">{language === "ar" ? "محصن" : "Immune"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-6 h-4 rounded text-center text-[10px] font-bold",
                  getMultiplierColor(0.5),
                )}
              >
                ×½
              </div>
              <span className="text-muted-foreground">
                {language === "ar" ? "مقاوم" : "Resist"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-6 h-4 rounded text-center text-[10px] font-bold",
                  getMultiplierColor(2),
                )}
              >
                ×2
              </div>
              <span className="text-muted-foreground">{language === "ar" ? "ضعيف" : "Weak"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-6 h-4 rounded text-center text-[10px] font-bold",
                  getMultiplierColor(4),
                )}
              >
                ×4
              </div>
              <span className="text-muted-foreground">
                {language === "ar" ? "ضعيف جداً" : "Very Weak"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
