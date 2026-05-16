import { useLanguage } from "@/original/contexts/LanguageContext";
import { Progress } from "@/original/components/ui/progress";
import { Badge } from "@/original/components/ui/badge";
import { Trophy, Star, Target } from "lucide-react";

interface AdventureProgressProps {
  points: number;
  choicesMade: number;
  achievements: string[];
  isComplete: boolean;
}

export function AdventureProgress({
  points,
  choicesMade,
  achievements,
  isComplete,
}: AdventureProgressProps) {
  const { t } = useLanguage();

  // Progress is based on choices made (max 10 for a typical story)
  const progressPercent = Math.min((choicesMade / 8) * 100, 100);

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="w-4 h-4" />
            {t("Progress", "التقدم")}
          </span>
          <span className="font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Points */}
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-bold">{points}</span>
            <span className="text-muted-foreground">{t("pts", "نقطة")}</span>
          </div>

          {/* Choices */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{choicesMade}</span>
            <span>{t("choices", "اختيارات")}</span>
          </div>
        </div>

        {/* Achievements Badge */}
        {achievements.length > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            {achievements.length}
          </Badge>
        )}
      </div>

      {/* Complete Badge */}
      {isComplete && (
        <div className="flex justify-center">
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
            ✨ {t("Adventure Complete!", "اكتملت المغامرة!")}
          </Badge>
        </div>
      )}
    </div>
  );
}
