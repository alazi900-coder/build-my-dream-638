import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";
import { Trophy, Lock, Sparkles } from "lucide-react";
import { ACHIEVEMENTS, type AdventureAchievement } from "@/original/lib/adventureStorage";
import { TOTAL_ACHIEVEMENTS } from "@/original/hooks/useAdventureStats";

interface AchievementsPanelProps {
  unlockedAchievements: AdventureAchievement[];
  recentAchievements?: AdventureAchievement[];
  compact?: boolean;
  showAll?: boolean;
}

export function AchievementsPanel({
  unlockedAchievements,
  recentAchievements = [],
  compact = false,
  showAll = false,
}: AchievementsPanelProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const progress = (unlockedAchievements.length / TOTAL_ACHIEVEMENTS) * 100;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Recent achievements row */}
        <div className="flex items-center gap-1 flex-wrap">
          {recentAchievements.slice(0, 4).map((achievement, index) => (
            <div
              key={achievement.id}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-lg",
                "bg-amber-500/20 border border-amber-500/30",
                "animate-in zoom-in-50 duration-300",
                index === 0 && "ring-2 ring-amber-500/50 animate-pulse",
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              title={isAr ? achievement.nameAr : achievement.nameEn}
            >
              {achievement.icon}
            </div>
          ))}
          {unlockedAchievements.length > 4 && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium bg-muted text-muted-foreground">
              +{unlockedAchievements.length - 4}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {unlockedAchievements.length}/{TOTAL_ACHIEVEMENTS}
          </span>
        </div>
      </div>
    );
  }

  const displayAchievements = showAll ? ACHIEVEMENTS : ACHIEVEMENTS.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="font-bold">{isAr ? "الإنجازات" : "Achievements"}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {unlockedAchievements.length}/{TOTAL_ACHIEVEMENTS}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 transition-all duration-700 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-4 gap-2">
        {displayAchievements.map((achievement, index) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const isRecent = recentAchievements.some((a) => a.id === achievement.id);

          return (
            <div
              key={achievement.id}
              className={cn(
                "relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all duration-300",
                isUnlocked
                  ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30"
                  : "bg-muted/50 border border-transparent opacity-50",
                isRecent && "ring-2 ring-amber-500 animate-pulse",
                "hover:scale-105",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              title={`${isAr ? achievement.nameAr : achievement.nameEn}: ${isAr ? achievement.descriptionAr : achievement.descriptionEn}`}
            >
              {isUnlocked ? (
                <>
                  <span className="text-2xl">{achievement.icon}</span>
                  {isRecent && (
                    <Sparkles className="absolute top-1 right-1 w-3 h-3 text-amber-500 animate-spin" />
                  )}
                </>
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-[9px] text-center mt-1 line-clamp-1 text-muted-foreground">
                {isAr ? achievement.nameAr : achievement.nameEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
