import { useState, useEffect, useCallback } from "react";
import {
  getAllAdventures,
  getUnlockedAchievements,
  getTotalPoints,
  getTotalChoices,
  getUsedStoryTypes,
  ACHIEVEMENTS,
  type SavedAdventure,
  type AdventureAchievement,
} from "@/original/lib/adventureStorage";

// Level system configuration
export const LEVELS = [
  {
    level: 1,
    minPoints: 0,
    maxPoints: 49,
    nameEn: "Rookie",
    nameAr: "مبتدئ",
    icon: "🌱",
    color: "emerald",
  },
  {
    level: 2,
    minPoints: 50,
    maxPoints: 149,
    nameEn: "Explorer",
    nameAr: "مستكشف",
    icon: "🧭",
    color: "blue",
  },
  {
    level: 3,
    minPoints: 150,
    maxPoints: 299,
    nameEn: "Warrior",
    nameAr: "محارب",
    icon: "⚔️",
    color: "orange",
  },
  {
    level: 4,
    minPoints: 300,
    maxPoints: 499,
    nameEn: "Hero",
    nameAr: "بطل",
    icon: "🦸",
    color: "purple",
  },
  {
    level: 5,
    minPoints: 500,
    maxPoints: 749,
    nameEn: "Expert",
    nameAr: "خبير",
    icon: "🎓",
    color: "indigo",
  },
  {
    level: 6,
    minPoints: 750,
    maxPoints: 999,
    nameEn: "Legend",
    nameAr: "أسطورة",
    icon: "🏆",
    color: "amber",
  },
  {
    level: 7,
    minPoints: 1000,
    maxPoints: 1499,
    nameEn: "Master",
    nameAr: "سيد",
    icon: "👑",
    color: "rose",
  },
  {
    level: 8,
    minPoints: 1500,
    maxPoints: 1999,
    nameEn: "King",
    nameAr: "ملك",
    icon: "🤴",
    color: "pink",
  },
  {
    level: 9,
    minPoints: 2000,
    maxPoints: 2999,
    nameEn: "Emperor",
    nameAr: "إمبراطور",
    icon: "🏛️",
    color: "cyan",
  },
  {
    level: 10,
    minPoints: 3000,
    maxPoints: Infinity,
    nameEn: "Divine",
    nameAr: "إلهي",
    icon: "⭐",
    color: "gold",
  },
];

export interface LevelInfo {
  level: number;
  nameEn: string;
  nameAr: string;
  icon: string;
  color: string;
  currentPoints: number;
  minPoints: number;
  maxPoints: number;
  progress: number; // 0-100
  pointsToNextLevel: number;
  nextLevel: (typeof LEVELS)[0] | null;
}

export interface AdventureStats {
  totalPoints: number;
  totalAchievements: number;
  unlockedAchievements: AdventureAchievement[];
  totalAdventures: number;
  activeAdventures: number;
  completedAdventures: number;
  totalChoices: number;
  usedStoryTypes: string[];
  completionRate: number;
  levelInfo: LevelInfo;
  recentAchievements: AdventureAchievement[];
  latestAdventure: SavedAdventure | null;
  latestIncompleteAdventure: SavedAdventure | null;
  topAdventures: SavedAdventure[];
  mostUsedPokemon: { id: number; name: string; count: number } | null;
  dailyStreak: number;
  isLoading: boolean;
}

export function calculateLevelInfo(points: number): LevelInfo {
  const currentLevel =
    LEVELS.find((l) => points >= l.minPoints && points <= l.maxPoints) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1) || null;

  const pointsInLevel = points - currentLevel.minPoints;
  const levelRange =
    currentLevel.maxPoints === Infinity
      ? 1000
      : currentLevel.maxPoints - currentLevel.minPoints + 1;
  const progress = Math.min(100, (pointsInLevel / levelRange) * 100);

  return {
    level: currentLevel.level,
    nameEn: currentLevel.nameEn,
    nameAr: currentLevel.nameAr,
    icon: currentLevel.icon,
    color: currentLevel.color,
    currentPoints: points,
    minPoints: currentLevel.minPoints,
    maxPoints: currentLevel.maxPoints,
    progress,
    pointsToNextLevel: nextLevel ? nextLevel.minPoints - points : 0,
    nextLevel,
  };
}

export function useAdventureStats() {
  const [stats, setStats] = useState<AdventureStats>({
    totalPoints: 0,
    totalAchievements: 0,
    unlockedAchievements: [],
    totalAdventures: 0,
    activeAdventures: 0,
    completedAdventures: 0,
    totalChoices: 0,
    usedStoryTypes: [],
    completionRate: 0,
    levelInfo: calculateLevelInfo(0),
    recentAchievements: [],
    latestAdventure: null,
    latestIncompleteAdventure: null,
    topAdventures: [],
    mostUsedPokemon: null,
    dailyStreak: 0,
    isLoading: true,
  });

  const loadStats = useCallback(async () => {
    try {
      const [adventures, achievements, totalPoints, totalChoices, usedStoryTypes] =
        await Promise.all([
          getAllAdventures(),
          getUnlockedAchievements(),
          getTotalPoints(),
          getTotalChoices(),
          getUsedStoryTypes(),
        ]);

      const completedAdventures = adventures.filter((a) => a.isComplete).length;
      const activeAdventures = adventures.filter((a) => !a.isComplete).length;
      const completionRate =
        adventures.length > 0 ? (completedAdventures / adventures.length) * 100 : 0;

      // Get recent achievements (last 3)
      const recentAchievements = achievements
        .filter((a) => a.unlockedAt)
        .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
        .slice(0, 3);

      // Latest adventure
      const latestAdventure = adventures.length > 0 ? adventures[0] : null;

      // Latest incomplete adventure
      const latestIncompleteAdventure = adventures.find((a) => !a.isComplete) || null;

      // Top 3 adventures by points
      const topAdventures = [...adventures].sort((a, b) => b.points - a.points).slice(0, 3);

      // Most used Pokémon
      const pokemonCounts: Record<number, { name: string; count: number }> = {};
      adventures.forEach((a) => {
        if (a.pokemonId) {
          if (!pokemonCounts[a.pokemonId]) {
            pokemonCounts[a.pokemonId] = { name: a.pokemonName, count: 0 };
          }
          pokemonCounts[a.pokemonId].count++;
        }
      });
      const mostUsedPokemon = Object.entries(pokemonCounts).sort(
        ([, a], [, b]) => b.count - a.count,
      )[0];

      // Daily streak (simplified - based on adventures created in consecutive days)
      const dailyStreak = calculateDailyStreak(adventures);

      setStats({
        totalPoints,
        totalAchievements: achievements.length,
        unlockedAchievements: achievements,
        totalAdventures: adventures.length,
        activeAdventures,
        completedAdventures,
        totalChoices,
        usedStoryTypes,
        completionRate,
        levelInfo: calculateLevelInfo(totalPoints),
        recentAchievements,
        latestAdventure,
        latestIncompleteAdventure,
        topAdventures,
        mostUsedPokemon: mostUsedPokemon
          ? { id: parseInt(mostUsedPokemon[0]), ...mostUsedPokemon[1] }
          : null,
        dailyStreak,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading adventure stats:", error);
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { ...stats, refresh: loadStats };
}

function calculateDailyStreak(adventures: SavedAdventure[]): number {
  if (adventures.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const adventureDays = new Set(
    adventures.map((a) => {
      const date = new Date(a.updatedAt || a.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }),
  );

  let streak = 0;
  let checkDate = today.getTime();

  while (adventureDays.has(checkDate)) {
    streak++;
    checkDate -= 24 * 60 * 60 * 1000; // Go back one day
  }

  return streak;
}

// Export constants for use in components
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
export const STORY_TYPES = ["rescue", "treasure", "journey", "mystery"];
