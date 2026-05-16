import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";
import { Play, BookOpen, Trophy, Star, Zap, CheckCircle2, Target } from "lucide-react";
import { Button } from "@/original/components/ui/button";
import { LevelProgressBar } from "./LevelProgressBar";
import { DailyStreak } from "./DailyStreak";
import { AchievementsPanel } from "./AchievementsPanel";
import {
  useAdventureStats,
  STORY_TYPES,
  TOTAL_ACHIEVEMENTS,
} from "@/original/hooks/useAdventureStats";

interface AdventureHubProps {
  onClose?: () => void;
}

export function AdventureHub({ onClose }: AdventureHubProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const stats = useAdventureStats();

  const handleContinue = () => {
    if (stats.latestIncompleteAdventure) {
      navigate("/story", { state: { continueAdventure: stats.latestIncompleteAdventure.id } });
    } else {
      navigate("/story");
    }
    onClose?.();
  };

  const handleNewAdventure = () => {
    navigate("/story");
    onClose?.();
  };

  if (stats.isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Hub Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative space-y-4">
          {/* Header with streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{isAr ? "مركز المغامرات" : "Adventure Hub"}</h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "تقدمك في القصص" : "Your story progress"}
                </p>
              </div>
            </div>
            {stats.dailyStreak > 0 && <DailyStreak streak={stats.dailyStreak} compact />}
          </div>

          {/* Level Progress */}
          <LevelProgressBar levelInfo={stats.levelInfo} />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <StatBadge
              icon={<Star className="w-4 h-4 text-amber-500" />}
              value={stats.totalPoints}
              label={isAr ? "نقاط" : "pts"}
              color="amber"
            />
            <StatBadge
              icon={<Trophy className="w-4 h-4 text-purple-500" />}
              value={`${stats.totalAchievements}/${TOTAL_ACHIEVEMENTS}`}
              label={isAr ? "إنجاز" : "ach"}
              color="purple"
            />
            <StatBadge
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              value={stats.completedAdventures}
              label={isAr ? "مكتمل" : "done"}
              color="emerald"
            />
            <StatBadge
              icon={<Target className="w-4 h-4 text-blue-500" />}
              value={`${stats.usedStoryTypes.length}/${STORY_TYPES.length}`}
              label={isAr ? "أنواع" : "types"}
              color="blue"
            />
          </div>

          {/* Continue/New Adventure Button */}
          {stats.latestIncompleteAdventure ? (
            <Button
              onClick={handleContinue}
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              <Zap className="w-4 h-4" />
              {isAr ? "متابعة المغامرة" : "Continue Adventure"}
              <span className="text-xs opacity-75">
                ({stats.latestIncompleteAdventure.pokemonName})
              </span>
            </Button>
          ) : (
            <Button onClick={handleNewAdventure} className="w-full gap-2" variant="outline">
              <Play className="w-4 h-4" />
              {isAr ? "مغامرة جديدة" : "New Adventure"}
            </Button>
          )}
        </div>
      </div>

      {/* Achievements Section */}
      {stats.totalAchievements > 0 && (
        <div className="rounded-xl border bg-card/50 p-4">
          <AchievementsPanel
            unlockedAchievements={stats.unlockedAchievements}
            recentAchievements={stats.recentAchievements}
            compact
          />
        </div>
      )}

      {/* Top Adventures */}
      {stats.topAdventures.length > 0 && (
        <div className="rounded-xl border bg-card/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Trophy className="w-4 h-4 text-amber-500" />
            {isAr ? "أفضل المغامرات" : "Top Adventures"}
          </div>
          <div className="space-y-2">
            {stats.topAdventures.map((adventure, index) => (
              <div
                key={adventure.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <span className="text-lg">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${adventure.pokemonId}.png`}
                  alt={adventure.pokemonName}
                  className="w-8 h-8"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{adventure.heroName}</div>
                  <div className="text-xs text-muted-foreground">{adventure.pokemonName}</div>
                </div>
                <div className="text-sm font-bold text-amber-500">{adventure.points}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-card/50 p-3 space-y-1">
          <div className="text-xs text-muted-foreground">
            {isAr ? "الاختيارات" : "Choices Made"}
          </div>
          <div className="text-xl font-bold">{stats.totalChoices}</div>
        </div>
        <div className="rounded-xl border bg-card/50 p-3 space-y-1">
          <div className="text-xs text-muted-foreground">
            {isAr ? "معدل الإكمال" : "Completion Rate"}
          </div>
          <div className="text-xl font-bold">{Math.round(stats.completionRate)}%</div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-500/10 border-amber-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20",
    blue: "bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg border",
        colorClasses[color] || "bg-muted",
      )}
    >
      {icon}
      <span className="font-bold text-sm">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
