import React from "react";
import { Trophy, Flame, Target, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Button } from "@/original/components/ui/button";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";

interface ScoreBoardProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  streak: number;
  bestStreak: number;
  highScore: number;
  timeElapsed?: number;
  isNewHighScore?: boolean;
  onPlayAgain: () => void;
  onGoBack: () => void;
}

export function ScoreBoard({
  score,
  correctAnswers,
  totalQuestions,
  streak,
  bestStreak,
  highScore,
  timeElapsed,
  isNewHighScore = false,
  onPlayAgain,
  onGoBack,
}: ScoreBoardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-primary" />
          {isAr ? "انتهت اللعبة!" : "Game Over!"}
        </CardTitle>
        {isNewHighScore && (
          <Badge className="mx-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse">
            🎉 {isAr ? "رقم قياسي جديد!" : "New High Score!"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <div className="text-6xl font-bold text-primary mb-2">{score}</div>
          <div className="text-muted-foreground">{isAr ? "النقاط" : "Points"}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Target className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-lg font-bold">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">{isAr ? "الدقة" : "Accuracy"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Star className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-lg font-bold">
                {correctAnswers}/{totalQuestions}
              </div>
              <div className="text-xs text-muted-foreground">{isAr ? "الصحيحة" : "Correct"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Flame
              className={cn(
                "w-5 h-5",
                streak >= bestStreak ? "text-orange-400" : "text-muted-foreground",
              )}
            />
            <div>
              <div className="text-lg font-bold">{streak}</div>
              <div className="text-xs text-muted-foreground">
                {isAr ? "أفضل سلسلة" : "Best Streak"}
              </div>
            </div>
          </div>

          {timeElapsed !== undefined && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-lg font-bold">
                  {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
                </div>
                <div className="text-xs text-muted-foreground">{isAr ? "الوقت" : "Time"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Previous High Score */}
        {highScore > 0 && !isNewHighScore && (
          <div className="text-center text-sm text-muted-foreground">
            {isAr ? "أعلى نتيجة: " : "High Score: "}
            {highScore}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onGoBack}>
            {isAr ? "العودة" : "Back"}
          </Button>
          <Button className="flex-1" onClick={onPlayAgain}>
            {isAr ? "العب مجدداً" : "Play Again"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
