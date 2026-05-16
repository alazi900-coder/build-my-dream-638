import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Trophy, Lock } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { ACHIEVEMENTS, type Achievement } from "@/original/lib/miniGameStorage";

interface AchievementsDisplayProps {
  unlockedAchievements: Achievement[];
  category?: "emulator" | "minigame" | "all";
}

export function AchievementsDisplay({
  unlockedAchievements,
  category = "all",
}: AchievementsDisplayProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const filteredAchievements =
    category === "all" ? ACHIEVEMENTS : ACHIEVEMENTS.filter((a) => a.category === category);

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const totalUnlocked = unlockedAchievements.filter(
    (a) => category === "all" || a.category === category,
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            {isAr ? "الإنجازات" : "Achievements"}
          </CardTitle>
          <Badge variant="secondary">
            {totalUnlocked}/{filteredAchievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            return (
              <div
                key={achievement.id}
                className={cn(
                  "relative flex flex-col items-center p-2 rounded-lg transition-all",
                  isUnlocked ? "bg-primary/10 hover:bg-primary/20" : "bg-muted/50 opacity-50",
                )}
                title={isAr ? achievement.descriptionAr : achievement.description}
              >
                <div className="text-2xl mb-1">
                  {isUnlocked ? achievement.icon : <Lock className="w-6 h-6" />}
                </div>
                <span className="text-[10px] text-center leading-tight line-clamp-2">
                  {isAr ? achievement.nameAr : achievement.name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
