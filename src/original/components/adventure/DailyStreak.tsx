import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";
import { Flame } from "lucide-react";

interface DailyStreakProps {
  streak: number;
  compact?: boolean;
}

export function DailyStreak({ streak, compact = false }: DailyStreakProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (streak === 0) return null;

  const getStreakColor = () => {
    if (streak >= 30) return "text-purple-500";
    if (streak >= 14) return "text-amber-500";
    if (streak >= 7) return "text-orange-500";
    return "text-red-500";
  };

  const getStreakBg = () => {
    if (streak >= 30) return "bg-purple-500/20";
    if (streak >= 14) return "bg-amber-500/20";
    if (streak >= 7) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          getStreakBg(),
          getStreakColor(),
        )}
      >
        <Flame className="w-3 h-3 animate-pulse" />
        <span>{streak}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl", getStreakBg())}>
      <div className="relative">
        <Flame className={cn("w-8 h-8", getStreakColor(), "animate-fire")} />
        <div className={cn("absolute inset-0 blur-lg opacity-50", getStreakBg())} />
      </div>
      <div>
        <div className={cn("font-bold text-lg", getStreakColor())}>
          {streak} {isAr ? "أيام" : "days"}
        </div>
        <div className="text-xs text-muted-foreground">
          {isAr ? "سلسلة متتالية! 🔥" : "Streak! 🔥"}
        </div>
      </div>
    </div>
  );
}
