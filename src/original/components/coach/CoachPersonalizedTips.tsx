import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Button } from "@/original/components/ui/button";
import { Lightbulb, RefreshCw, Zap, Shield, Target } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Tip {
  id: string;
  category: "battle" | "team" | "type" | "strategy";
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  icon: typeof Zap;
}

const TIPS: Tip[] = [
  {
    id: "1",
    category: "battle",
    titleEn: "Type Advantage",
    titleAr: "ميزة النوع",
    contentEn:
      "Always lead with a Pokémon that has type advantage. Water beats Fire, Fire beats Grass, Grass beats Water.",
    contentAr:
      "ابدأ دائماً ببوكيمون لديه ميزة النوع. الماء يتغلب على النار، النار على العشب، العشب على الماء.",
    icon: Zap,
  },
  {
    id: "2",
    category: "team",
    titleEn: "Team Balance",
    titleAr: "توازن الفريق",
    contentEn:
      "Build a balanced team with different types. Aim for at least 4-5 different types to cover weaknesses.",
    contentAr: "ابنِ فريقاً متوازناً بأنواع مختلفة. استهدف 4-5 أنواع مختلفة لتغطية نقاط الضعف.",
    icon: Shield,
  },
  {
    id: "3",
    category: "strategy",
    titleEn: "Status Moves",
    titleAr: "حركات الحالة",
    contentEn:
      "Status moves like Thunder Wave or Toxic can turn the tide of battle. Use them strategically!",
    contentAr: "حركات الحالة مثل موجة الرعد أو السم يمكن أن تغير مجرى المعركة. استخدمها بذكاء!",
    icon: Target,
  },
  {
    id: "4",
    category: "type",
    titleEn: "Ground Immunity",
    titleAr: "حصانة الأرض",
    contentEn:
      "Flying types and Pokémon with Levitate are immune to Ground moves. Use this to your advantage!",
    contentAr: "البوكيمون الطائر وذو قدرة الطفو محصن ضد حركات الأرض. استغل هذا لصالحك!",
    icon: Zap,
  },
  {
    id: "5",
    category: "battle",
    titleEn: "Priority Moves",
    titleAr: "الحركات ذات الأولوية",
    contentEn:
      "Quick Attack, Aqua Jet, and Extreme Speed go first regardless of Speed. Great for finishing weakened foes.",
    contentAr:
      "الهجوم السريع ودفقة الماء والسرعة القصوى تنفذ أولاً بغض النظر عن السرعة. ممتازة لإنهاء الأعداء الضعفاء.",
    icon: Zap,
  },
  {
    id: "6",
    category: "team",
    titleEn: "Coverage Moves",
    titleAr: "حركات التغطية",
    contentEn:
      "Teach your Pokémon moves of different types to handle more threats. Ice Beam on Water types is classic!",
    contentAr:
      "علّم بوكيمونك حركات من أنواع مختلفة للتعامل مع تهديدات أكثر. شعاع الجليد على نوع الماء كلاسيكي!",
    icon: Target,
  },
];

const categoryColors: Record<string, string> = {
  battle: "bg-destructive/10 text-destructive",
  team: "bg-primary/10 text-primary",
  type: "bg-yellow-500/10 text-yellow-600",
  strategy: "bg-green-500/10 text-green-600",
};

const categoryLabels: Record<string, { en: string; ar: string }> = {
  battle: { en: "Battle", ar: "معركة" },
  team: { en: "Team", ar: "فريق" },
  type: { en: "Type", ar: "نوع" },
  strategy: { en: "Strategy", ar: "استراتيجية" },
};

export function CoachPersonalizedTips() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [currentTip, setCurrentTip] = useState<Tip>(TIPS[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Show random tip on mount
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setCurrentTip(randomTip);
  }, []);

  const getNextTip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const currentIndex = TIPS.findIndex((t) => t.id === currentTip.id);
      const nextIndex = (currentIndex + 1) % TIPS.length;
      setCurrentTip(TIPS[nextIndex]);
      setIsAnimating(false);
    }, 200);
  };

  const Icon = currentTip.icon;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className={cn("flex items-center justify-between", isAr && "flex-row-reverse")}>
          <CardTitle
            className={cn("flex items-center gap-2 text-base", isAr && "flex-row-reverse")}
          >
            <Lightbulb className="h-5 w-5 text-primary" />
            {isAr ? "نصيحة اليوم" : "Today's Tip"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={getNextTip} className="h-8 w-8">
            <RefreshCw className={cn("h-4 w-4", isAnimating && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={cn("transition-opacity duration-200", isAnimating ? "opacity-0" : "opacity-100")}
      >
        <div className={cn("space-y-3", isAr && "text-right")}>
          <div className={cn("flex items-center gap-2", isAr && "flex-row-reverse")}>
            <Badge className={categoryColors[currentTip.category]}>
              {isAr
                ? categoryLabels[currentTip.category].ar
                : categoryLabels[currentTip.category].en}
            </Badge>
            <span className="font-semibold text-sm">
              {isAr ? currentTip.titleAr : currentTip.titleEn}
            </span>
          </div>
          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg bg-muted/50",
              isAr && "flex-row-reverse",
            )}
          >
            <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr ? currentTip.contentAr : currentTip.contentEn}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
