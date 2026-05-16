import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";
import type { LevelInfo } from "@/original/hooks/useAdventureStats";

interface LevelProgressBarProps {
  levelInfo: LevelInfo;
  compact?: boolean;
  showNextLevel?: boolean;
}

const levelColors: Record<string, string> = {
  emerald: "from-emerald-500 to-emerald-400",
  blue: "from-blue-500 to-blue-400",
  orange: "from-orange-500 to-orange-400",
  purple: "from-purple-500 to-purple-400",
  indigo: "from-indigo-500 to-indigo-400",
  amber: "from-amber-500 to-amber-400",
  rose: "from-rose-500 to-rose-400",
  pink: "from-pink-500 to-pink-400",
  cyan: "from-cyan-500 to-cyan-400",
  gold: "from-yellow-500 via-amber-400 to-yellow-300",
};

const levelBgColors: Record<string, string> = {
  emerald: "bg-emerald-500/20",
  blue: "bg-blue-500/20",
  orange: "bg-orange-500/20",
  purple: "bg-purple-500/20",
  indigo: "bg-indigo-500/20",
  amber: "bg-amber-500/20",
  rose: "bg-rose-500/20",
  pink: "bg-pink-500/20",
  cyan: "bg-cyan-500/20",
  gold: "bg-yellow-500/20",
};

export function LevelProgressBar({
  levelInfo,
  compact = false,
  showNextLevel = true,
}: LevelProgressBarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const levelName = isAr ? levelInfo.nameAr : levelInfo.nameEn;
  const nextLevelName = levelInfo.nextLevel
    ? isAr
      ? levelInfo.nextLevel.nameAr
      : levelInfo.nextLevel.nameEn
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{levelInfo.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">{levelName}</span>
            <span className="text-muted-foreground">{Math.round(levelInfo.progress)}%</span>
          </div>
          <div
            className={cn(
              "h-1.5 rounded-full overflow-hidden",
              levelBgColors[levelInfo.color] || "bg-muted",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                levelColors[levelInfo.color],
              )}
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-bounce">{levelInfo.icon}</span>
          <div>
            <div className="font-bold text-sm">{levelName}</div>
            <div className="text-xs text-muted-foreground">
              {isAr ? `المستوى ${levelInfo.level}` : `Level ${levelInfo.level}`}
            </div>
          </div>
        </div>
        <div className="text-end">
          <div className="font-bold text-sm">{levelInfo.currentPoints}</div>
          <div className="text-xs text-muted-foreground">{isAr ? "نقطة" : "pts"}</div>
        </div>
      </div>

      <div
        className={cn(
          "h-2.5 rounded-full overflow-hidden",
          levelBgColors[levelInfo.color] || "bg-muted",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r relative",
            levelColors[levelInfo.color],
          )}
          style={{ width: `${levelInfo.progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {showNextLevel && levelInfo.nextLevel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{Math.round(levelInfo.progress)}%</span>
          <span className="flex items-center gap-1">
            {isAr ? "← التالي:" : "Next →"} {levelInfo.nextLevel.icon} {nextLevelName}
            <span className="text-primary font-medium">({levelInfo.pointsToNextLevel})</span>
          </span>
        </div>
      )}
    </div>
  );
}
