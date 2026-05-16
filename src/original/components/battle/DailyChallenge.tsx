import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Progress } from "@/original/components/ui/progress";
import { Calendar, Trophy, Zap, Clock, Check, Star } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Challenge {
  id: string;
  type: "win" | "use_type" | "no_faint" | "quick_win";
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  description_en: string;
  description_ar: string;
}

const STORAGE_KEY = "pokemon-daily-challenges";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function generateDailyChallenges(): Challenge[] {
  const types = ["fire", "water", "grass", "electric", "psychic", "fighting"];
  const randomType = types[Math.floor(Math.random() * types.length)];

  return [
    {
      id: "win_3",
      type: "win",
      target: 3,
      current: 0,
      reward: 50,
      completed: false,
      description_en: "Win 3 battles",
      description_ar: "اربح 3 معارك",
    },
    {
      id: `use_${randomType}`,
      type: "use_type",
      target: 5,
      current: 0,
      reward: 30,
      completed: false,
      description_en: `Use ${randomType}-type moves 5 times`,
      description_ar: `استخدم حركات نوع ${randomType} 5 مرات`,
    },
    {
      id: "no_faint",
      type: "no_faint",
      target: 1,
      current: 0,
      reward: 75,
      completed: false,
      description_en: "Win without any Pokémon fainting",
      description_ar: "اربح بدون إغماء أي بوكيمون",
    },
    {
      id: "quick_win",
      type: "quick_win",
      target: 1,
      current: 0,
      reward: 40,
      completed: false,
      description_en: "Win a battle in under 5 turns",
      description_ar: "اربح معركة في أقل من 5 أدوار",
    },
  ];
}

function loadChallenges(): { date: string; challenges: Challenge[] } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return { date: "", challenges: [] };
}

function saveChallenges(date: string, challenges: Challenge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, challenges }));
}

export function DailyChallenge() {
  const { language } = useLanguage();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const today = getTodayKey();
    const stored = loadChallenges();

    if (stored.date === today) {
      setChallenges(stored.challenges);
    } else {
      const newChallenges = generateDailyChallenges();
      setChallenges(newChallenges);
      saveChallenges(today, newChallenges);
    }
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalRewards = challenges.reduce((sum, c) => sum + (c.completed ? c.reward : 0), 0);

  return (
    <Card className="border-chart-3/30 bg-gradient-to-br from-chart-3/10 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-chart-3" />
            {language === "ar" ? "التحديات اليومية" : "Daily Challenges"}
          </CardTitle>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            {timeLeft}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-chart-3" />
            <span className="text-sm font-medium">
              {completedCount}/{challenges.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-chart-3" />
            <span className="text-sm font-bold text-chart-3">{totalRewards} XP</span>
          </div>
        </div>

        {/* Challenges List */}
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                challenge.completed
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-muted/20 border-border/50",
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium flex-1">
                  {language === "ar" ? challenge.description_ar : challenge.description_en}
                </p>
                {challenge.completed ? (
                  <Check className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <Badge variant="outline" className="text-xs shrink-0">
                    +{challenge.reward} XP
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {challenge.current}/{challenge.target}
                  </span>
                  <span>{Math.round((challenge.current / challenge.target) * 100)}%</span>
                </div>
                <Progress value={(challenge.current / challenge.target) * 100} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Export function to update challenges from battle
export function updateDailyChallenge(
  type: "win" | "use_type" | "no_faint" | "quick_win",
  value: number = 1,
  moveType?: string,
) {
  const today = getTodayKey();
  const stored = loadChallenges();

  if (stored.date !== today) return;

  const updatedChallenges = stored.challenges.map((challenge) => {
    if (challenge.completed) return challenge;

    let shouldUpdate = false;

    if (type === "win" && challenge.type === "win") {
      shouldUpdate = true;
    } else if (type === "use_type" && challenge.type === "use_type" && moveType) {
      if (challenge.id.includes(moveType)) {
        shouldUpdate = true;
      }
    } else if (type === "no_faint" && challenge.type === "no_faint") {
      shouldUpdate = true;
    } else if (type === "quick_win" && challenge.type === "quick_win") {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      const newCurrent = Math.min(challenge.current + value, challenge.target);
      return {
        ...challenge,
        current: newCurrent,
        completed: newCurrent >= challenge.target,
      };
    }

    return challenge;
  });

  saveChallenges(today, updatedChallenges);
}
