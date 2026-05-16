import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";
import { Star, Trophy, BookOpen, Target, Flame, TrendingUp } from "lucide-react";
import {
  useAdventureStats,
  STORY_TYPES,
  TOTAL_ACHIEVEMENTS,
} from "@/original/hooks/useAdventureStats";
import { LevelProgressBar } from "./LevelProgressBar";

export function AdventureStatsCard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const stats = useAdventureStats();

  if (stats.isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level Progress */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <LevelProgressBar levelInfo={stats.levelInfo} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Points */}
        <StatCard
          icon={<Star className="w-5 h-5" />}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/20"
          title={isAr ? "النقاط الإجمالية" : "Total Points"}
          value={stats.totalPoints}
          glow="shadow-amber-500/20"
        />

        {/* Achievements */}
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/20"
          title={isAr ? "الإنجازات" : "Achievements"}
          value={`${stats.totalAchievements}/${TOTAL_ACHIEVEMENTS}`}
          glow="shadow-purple-500/20"
        />

        {/* Adventures */}
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/20"
          title={isAr ? "المغامرات" : "Adventures"}
          value={stats.totalAdventures}
          subtitle={`${stats.completedAdventures} ${isAr ? "مكتملة" : "completed"}`}
          glow="shadow-blue-500/20"
        />

        {/* Story Types */}
        <StatCard
          icon={<Target className="w-5 h-5" />}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/20"
          title={isAr ? "أنواع القصص" : "Story Types"}
          value={`${stats.usedStoryTypes.length}/${STORY_TYPES.length}`}
          glow="shadow-emerald-500/20"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-2">
        {/* Daily Streak */}
        <MiniStatCard
          icon={<Flame className="w-4 h-4 text-orange-500" />}
          label={isAr ? "السلسلة" : "Streak"}
          value={`${stats.dailyStreak} ${isAr ? "يوم" : "d"}`}
        />

        {/* Choices */}
        <MiniStatCard
          icon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
          label={isAr ? "اختيارات" : "Choices"}
          value={stats.totalChoices}
        />

        {/* Completion Rate */}
        <MiniStatCard
          icon={<Target className="w-4 h-4 text-cyan-500" />}
          label={isAr ? "الإكمال" : "Rate"}
          value={`${Math.round(stats.completionRate)}%`}
        />
      </div>

      {/* Most Used Pokémon */}
      {stats.mostUsedPokemon && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stats.mostUsedPokemon.id}.png`}
            alt={stats.mostUsedPokemon.name}
            className="w-12 h-12"
          />
          <div>
            <div className="text-xs text-muted-foreground">
              {isAr ? "البوكيمون المفضل" : "Favorite Pokémon"}
            </div>
            <div className="font-bold">{stats.mostUsedPokemon.name}</div>
            <div className="text-xs text-muted-foreground">
              {stats.mostUsedPokemon.count} {isAr ? "مغامرات" : "adventures"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  iconBg,
  title,
  value,
  subtitle,
  glow,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string | number;
  subtitle?: string;
  glow?: string;
}) {
  return (
    <div className={cn("p-4 rounded-xl bg-card border transition-shadow hover:shadow-lg", glow)}>
      <div className={cn("inline-flex p-2 rounded-lg mb-2", iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
    </div>
  );
}

function MiniStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
      {icon}
      <div className="font-bold text-sm">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
