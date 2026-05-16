import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Progress } from "@/original/components/ui/progress";
import { Trophy, Star, Zap, Shield, Flame, Crown, Medal, Target, Swords } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useBattleProgress, BattleAchievement } from "@/original/hooks/useBattleProgress";

const achievementIcons: Record<string, React.ElementType> = {
  "🏆": Trophy,
  "⭐": Star,
  "⚡": Zap,
  "🛡️": Shield,
  "🔥": Flame,
  "👑": Crown,
  "🎖️": Medal,
  "🎯": Target,
  "⚔️": Swords,
  "✅": Trophy,
  "💥": Zap,
  "🗡️": Swords,
  "💯": Medal,
  "💀": Shield,
  "🏛️": Crown,
  "♾️": Star,
  "📅": Target,
  "🎮": Star,
};

export function BattleAchievements() {
  const { language } = useLanguage();
  const { progress } = useBattleProgress();

  // Get achievements from progress
  const achievementList = progress.achievements || [];
  const unlockedCount = achievementList.filter((a) => a.unlocked).length;

  // Show first 6 achievements
  const displayAchievements = achievementList.slice(0, 8);

  return (
    <Card className="border-chart-3/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-chart-3" />
            {language === "ar" ? "الإنجازات" : "Achievements"}
          </CardTitle>
          <Badge variant="outline" className="bg-chart-3/10 text-chart-3">
            {unlockedCount}/{achievementList.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAchievements.map((achievement) => {
          const IconComponent = achievementIcons[achievement.icon] || Trophy;

          return (
            <div
              key={achievement.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                achievement.unlocked
                  ? "bg-chart-3/10 border-chart-3/30"
                  : "bg-muted/20 border-border/30 opacity-70",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    achievement.unlocked ? "bg-chart-3/20" : "bg-muted",
                  )}
                >
                  <IconComponent
                    className={cn(
                      "w-5 h-5",
                      achievement.unlocked ? "text-chart-3" : "text-muted-foreground",
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {language === "ar" ? achievement.name_ar : achievement.name_en}
                    </p>
                    {achievement.unlocked && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"
                      >
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === "ar" ? achievement.description_ar : achievement.description_en}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {achievementList.length > 8 && (
          <p className="text-xs text-center text-muted-foreground">
            {language === "ar"
              ? `+${achievementList.length - 8} إنجاز آخر`
              : `+${achievementList.length - 8} more achievements`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
