import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Trophy, Star, Flame } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";

interface GameCardProps {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ReactNode;
  highScore?: number;
  bestStreak?: number;
  totalGames?: number;
  difficulty?: "easy" | "medium" | "hard";
  onClick?: () => void;
}

export function GameCard({
  id,
  title,
  titleAr,
  description,
  descriptionAr,
  icon,
  highScore = 0,
  bestStreak = 0,
  totalGames = 0,
  difficulty,
  onClick,
}: GameCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const difficultyColors = {
    easy: "bg-green-500/20 text-green-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    hard: "bg-red-500/20 text-red-400",
  };

  const difficultyLabels = {
    easy: { en: "Easy", ar: "سهل" },
    medium: { en: "Medium", ar: "متوسط" },
    hard: { en: "Hard", ar: "صعب" },
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        "active:scale-[0.98] touch-manipulation",
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 text-primary">{icon}</div>
            <div>
              <CardTitle className="text-lg">{isAr ? titleAr : title}</CardTitle>
              {difficulty && (
                <Badge className={cn("mt-1", difficultyColors[difficulty])}>
                  {isAr ? difficultyLabels[difficulty].ar : difficultyLabels[difficulty].en}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{isAr ? descriptionAr : description}</p>

        <div className="flex items-center gap-4 text-sm">
          {highScore > 0 && (
            <div className="flex items-center gap-1 text-primary">
              <Trophy className="w-4 h-4" />
              <span>{highScore}</span>
            </div>
          )}
          {bestStreak > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-4 h-4" />
              <span>{bestStreak}</span>
            </div>
          )}
          {totalGames > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="w-4 h-4" />
              <span>
                {totalGames} {isAr ? "لعبة" : "games"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
