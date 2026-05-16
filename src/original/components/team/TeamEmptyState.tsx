import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Users, Shield, Zap, Lightbulb, Sparkles } from "lucide-react";

interface Props {
  onSuggestTeam: () => void;
}

export function TeamEmptyState({ onSuggestTeam }: Props) {
  const { language } = useLanguage();

  const benefits =
    language === "ar"
      ? [
          { icon: Shield, label: "تحليل التوازن" },
          { icon: Zap, label: "كشف الثغرات" },
          { icon: Lightbulb, label: "اقتراحات ذكية" },
        ]
      : [
          { icon: Shield, label: "Balance Analysis" },
          { icon: Zap, label: "Gap Detection" },
          { icon: Lightbulb, label: "Smart Suggestions" },
        ];

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="py-8 space-y-6">
        {/* Team Silhouette */}
        <div className="flex justify-center gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center"
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground/30" />
            </div>
          ))}
        </div>

        {/* Coach Message */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            {language === "ar"
              ? "ابدأ بإضافة بوكيمونك الأول، وسنحلل فريقك خطوة بخطوة."
              : "Add your first Pokémon, and we'll analyze your team step by step."}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === "ar"
              ? "اضغط على أي خانة فارغة بالأعلى لبدء البناء"
              : "Tap any empty slot above to start building"}
          </p>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-4">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
            >
              <benefit.icon className="w-4 h-4" />
              <span>{benefit.label}</span>
            </div>
          ))}
        </div>

        {/* Suggest Team Button */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={onSuggestTeam} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {language === "ar" ? "اقترح فريقًا متوازنًا" : "Suggest a balanced team"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
