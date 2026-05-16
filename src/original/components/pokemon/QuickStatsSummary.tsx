import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Zap, Shield, MapPin, AlertTriangle } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface QuickStatsSummaryProps {
  totalStats: number;
  weaknessCount: number;
  locationCount: number;
  resistanceCount: number;
}

/**
 * QuickStatsSummary - Displays key info at a glance above collapsible sections
 */
export function QuickStatsSummary({
  totalStats,
  weaknessCount,
  locationCount,
  resistanceCount,
}: QuickStatsSummaryProps) {
  const { language } = useLanguage();

  const stats = [
    {
      icon: Zap,
      label: language === "ar" ? "إجمالي القوة" : "Total Stats",
      value: totalStats,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: AlertTriangle,
      label: language === "ar" ? "نقاط الضعف" : "Weaknesses",
      value: weaknessCount,
      color:
        weaknessCount > 4
          ? "text-destructive"
          : weaknessCount > 2
            ? "text-amber-500"
            : "text-green-500",
      bgColor:
        weaknessCount > 4
          ? "bg-destructive/10"
          : weaknessCount > 2
            ? "bg-amber-500/10"
            : "bg-green-500/10",
    },
    {
      icon: Shield,
      label: language === "ar" ? "المقاومات" : "Resistances",
      value: resistanceCount,
      color:
        resistanceCount > 4
          ? "text-green-500"
          : resistanceCount > 2
            ? "text-amber-500"
            : "text-muted-foreground",
      bgColor:
        resistanceCount > 4
          ? "bg-green-500/10"
          : resistanceCount > 2
            ? "bg-amber-500/10"
            : "bg-muted/50",
    },
    {
      icon: MapPin,
      label: language === "ar" ? "المواقع" : "Locations",
      value: locationCount,
      color: locationCount > 0 ? "text-chart-4" : "text-muted-foreground",
      bgColor: locationCount > 0 ? "bg-chart-4/10" : "bg-muted/50",
    },
  ];

  return (
    <Card className="border-border bg-card/50">
      <CardContent className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg",
                stat.bgColor,
              )}
            >
              <stat.icon className={cn("w-4 h-4 mb-1", stat.color)} />
              <span className={cn("text-lg font-bold", stat.color)}>{stat.value}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
