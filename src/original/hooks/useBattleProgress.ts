/**
 * Battle Progress System
 * Tracks player level, XP, achievements, and unlocks
 */

import { useState, useEffect, useCallback } from "react";
import { Difficulty } from "@/original/lib/battleAI";

export interface BattleAchievement {
  id: string;
  icon: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface BattleProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  achievements: BattleAchievement[];
  unlockedModes: string[];
  dailyChallengeCompleted: boolean;
  lastDailyChallengeDate: string;
}

const STORAGE_KEY = "pokemon-battle-progress";

export const BATTLE_LEVELS = [
  { level: 1, xp: 0, name_en: "Novice", name_ar: "مبتدئ", icon: "🌱" },
  { level: 5, xp: 100, name_en: "Trainer", name_ar: "مدرب", icon: "⭐" },
  { level: 10, xp: 300, name_en: "Fighter", name_ar: "محارب", icon: "⚔️" },
  { level: 15, xp: 600, name_en: "Warrior", name_ar: "مقاتل", icon: "🛡️" },
  { level: 20, xp: 1000, name_en: "Champion", name_ar: "بطل", icon: "🏆" },
  { level: 30, xp: 1800, name_en: "Elite", name_ar: "نخبة", icon: "💎" },
  { level: 40, xp: 3000, name_en: "Master", name_ar: "سيد", icon: "👑" },
  { level: 50, xp: 5000, name_en: "Legend", name_ar: "أسطورة", icon: "🌟" },
  { level: 75, xp: 10000, name_en: "Mythic", name_ar: "أسطوري", icon: "🔱" },
  { level: 100, xp: 20000, name_en: "God", name_ar: "إله", icon: "⚡" },
];

export const ALL_ACHIEVEMENTS: Omit<BattleAchievement, "unlocked" | "unlockedAt">[] = [
  {
    id: "first_battle",
    icon: "🎮",
    name_en: "First Steps",
    name_ar: "الخطوات الأولى",
    description_en: "Complete your first battle",
    description_ar: "أكمل أول معركة",
  },
  {
    id: "first_win",
    icon: "✅",
    name_en: "Victory!",
    name_ar: "فوز!",
    description_en: "Win your first battle",
    description_ar: "فز بأول معركة",
  },
  {
    id: "streak_5",
    icon: "🔥",
    name_en: "On Fire",
    name_ar: "مشتعل",
    description_en: "Win 5 battles in a row",
    description_ar: "فز 5 معارك متتالية",
  },
  {
    id: "streak_10",
    icon: "💥",
    name_en: "Unstoppable",
    name_ar: "لا يُوقف",
    description_en: "Win 10 battles in a row",
    description_ar: "فز 10 معارك متتالية",
  },
  {
    id: "battles_10",
    icon: "⚔️",
    name_en: "Warrior",
    name_ar: "محارب",
    description_en: "Complete 10 battles",
    description_ar: "أكمل 10 معارك",
  },
  {
    id: "battles_50",
    icon: "🗡️",
    name_en: "Veteran",
    name_ar: "محارب قديم",
    description_en: "Complete 50 battles",
    description_ar: "أكمل 50 معركة",
  },
  {
    id: "battles_100",
    icon: "💯",
    name_en: "Centurion",
    name_ar: "المئة",
    description_en: "Complete 100 battles",
    description_ar: "أكمل 100 معركة",
  },
  {
    id: "flawless",
    icon: "🛡️",
    name_en: "Flawless",
    name_ar: "لا يُقهر",
    description_en: "Win without any Pokemon fainting",
    description_ar: "فز بدون إغماء أي بوكيمون",
  },
  {
    id: "quick_win",
    icon: "⚡",
    name_en: "Lightning Fast",
    name_ar: "سريع كالبرق",
    description_en: "Win in 3 turns or less",
    description_ar: "فز في 3 أدوار أو أقل",
  },
  {
    id: "hard_mode",
    icon: "💀",
    name_en: "Hardcore",
    name_ar: "صعب",
    description_en: "Win on Hard difficulty",
    description_ar: "فز في الصعوبة الصعبة",
  },
  {
    id: "expert_mode",
    icon: "👑",
    name_en: "Expert",
    name_ar: "خبير",
    description_en: "Win on Expert difficulty",
    description_ar: "فز في الصعوبة الخبير",
  },
  {
    id: "gym_master",
    icon: "🏛️",
    name_en: "Gym Master",
    name_ar: "سيد الصالات",
    description_en: "Defeat all gym leaders",
    description_ar: "اهزم جميع قادة الصالات",
  },
  {
    id: "tournament_winner",
    icon: "🏆",
    name_en: "Champion",
    name_ar: "البطل",
    description_en: "Win a tournament",
    description_ar: "فز ببطولة",
  },
  {
    id: "survival_20",
    icon: "♾️",
    name_en: "Survivor",
    name_ar: "ناجٍ",
    description_en: "Reach wave 20 in Survival mode",
    description_ar: "وصل للموجة 20 في وضع البقاء",
  },
  {
    id: "daily_7",
    icon: "📅",
    name_en: "Dedicated",
    name_ar: "ملتزم",
    description_en: "Complete 7 daily challenges",
    description_ar: "أكمل 7 تحديات يومية",
  },
];

function calculateXpToNextLevel(level: number): number {
  // XP formula: base + (level * multiplier)
  return 50 + level * 25;
}

function loadProgress(): BattleProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure achievements are up to date
      const achievements = ALL_ACHIEVEMENTS.map((a) => {
        const existing = parsed.achievements?.find((e: any) => e.id === a.id);
        return existing || { ...a, unlocked: false };
      });
      return { ...parsed, achievements };
    }
  } catch (e) {
    console.error("Failed to load battle progress:", e);
  }

  return {
    level: 1,
    xp: 0,
    xpToNextLevel: calculateXpToNextLevel(1),
    totalXp: 0,
    currentStreak: 0,
    bestStreak: 0,
    achievements: ALL_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
    unlockedModes: ["1v1"],
    dailyChallengeCompleted: false,
    lastDailyChallengeDate: "",
  };
}

function saveProgress(progress: BattleProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save battle progress:", e);
  }
}

export function useBattleProgress() {
  const [progress, setProgress] = useState<BattleProgress>(loadProgress);
  const [newAchievements, setNewAchievements] = useState<BattleAchievement[]>([]);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const getLevelInfo = useCallback((level: number) => {
    for (let i = BATTLE_LEVELS.length - 1; i >= 0; i--) {
      if (level >= BATTLE_LEVELS[i].level) {
        return BATTLE_LEVELS[i];
      }
    }
    return BATTLE_LEVELS[0];
  }, []);

  const addXp = useCallback((amount: number) => {
    setProgress((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let xpToNext = prev.xpToNextLevel;
      const unlockedModes = [...prev.unlockedModes];

      // Level up loop
      while (newXp >= xpToNext) {
        newXp -= xpToNext;
        newLevel++;
        xpToNext = calculateXpToNextLevel(newLevel);

        // Unlock modes at certain levels
        if (newLevel >= 3 && !unlockedModes.includes("3v3")) {
          unlockedModes.push("3v3");
        }
        if (newLevel >= 5 && !unlockedModes.includes("6v6")) {
          unlockedModes.push("6v6");
        }
        if (newLevel >= 10 && !unlockedModes.includes("gym")) {
          unlockedModes.push("gym");
        }
        if (newLevel >= 15 && !unlockedModes.includes("tournament")) {
          unlockedModes.push("tournament");
        }
        if (newLevel >= 20 && !unlockedModes.includes("survival")) {
          unlockedModes.push("survival");
        }
      }

      const newProgress = {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpToNextLevel: xpToNext,
        totalXp: prev.totalXp + amount,
        unlockedModes,
      };

      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const recordBattleResult = useCallback(
    (
      won: boolean,
      difficulty: Difficulty,
      turns: number,
      playerFainted: number,
      totalBattles: number,
    ) => {
      setProgress((prev) => {
        const newAchievementsList: BattleAchievement[] = [];
        const achievements = [...prev.achievements];

        // Calculate XP
        const difficultyMultiplier = { easy: 1, normal: 1.5, hard: 2, expert: 3 };
        let xpGained = won ? 20 : 5;
        xpGained = Math.round(xpGained * difficultyMultiplier[difficulty]);

        // Streak bonus
        const newStreak = won ? prev.currentStreak + 1 : 0;
        if (won && newStreak > 1) {
          xpGained += Math.min(newStreak * 2, 20); // Max +20 XP from streak
        }

        // Check achievements
        const unlockAchievement = (id: string) => {
          const idx = achievements.findIndex((a) => a.id === id);
          if (idx !== -1 && !achievements[idx].unlocked) {
            achievements[idx] = { ...achievements[idx], unlocked: true, unlockedAt: Date.now() };
            newAchievementsList.push(achievements[idx]);
          }
        };

        // First battle
        unlockAchievement("first_battle");

        // First win
        if (won) unlockAchievement("first_win");

        // Streak achievements
        if (newStreak >= 5) unlockAchievement("streak_5");
        if (newStreak >= 10) unlockAchievement("streak_10");

        // Battle count achievements
        if (totalBattles >= 10) unlockAchievement("battles_10");
        if (totalBattles >= 50) unlockAchievement("battles_50");
        if (totalBattles >= 100) unlockAchievement("battles_100");

        // Flawless victory
        if (won && playerFainted === 0) unlockAchievement("flawless");

        // Quick win
        if (won && turns <= 3) unlockAchievement("quick_win");

        // Difficulty achievements
        if (won && difficulty === "hard") unlockAchievement("hard_mode");
        if (won && difficulty === "expert") unlockAchievement("expert_mode");

        if (newAchievementsList.length > 0) {
          setNewAchievements(newAchievementsList);
        }

        // Add XP
        let newXp = prev.xp + xpGained;
        let newLevel = prev.level;
        let xpToNext = prev.xpToNextLevel;
        const unlockedModes = [...prev.unlockedModes];

        while (newXp >= xpToNext) {
          newXp -= xpToNext;
          newLevel++;
          xpToNext = calculateXpToNextLevel(newLevel);

          if (newLevel >= 3 && !unlockedModes.includes("3v3")) unlockedModes.push("3v3");
          if (newLevel >= 5 && !unlockedModes.includes("6v6")) unlockedModes.push("6v6");
          if (newLevel >= 10 && !unlockedModes.includes("gym")) unlockedModes.push("gym");
          if (newLevel >= 15 && !unlockedModes.includes("tournament"))
            unlockedModes.push("tournament");
          if (newLevel >= 20 && !unlockedModes.includes("survival")) unlockedModes.push("survival");
        }

        const newProgress = {
          ...prev,
          level: newLevel,
          xp: newXp,
          xpToNextLevel: xpToNext,
          totalXp: prev.totalXp + xpGained,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          achievements,
          unlockedModes,
        };

        saveProgress(newProgress);
        return newProgress;
      });
    },
    [],
  );

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  const resetProgress = useCallback(() => {
    const initialProgress: BattleProgress = {
      level: 1,
      xp: 0,
      xpToNextLevel: calculateXpToNextLevel(1),
      totalXp: 0,
      currentStreak: 0,
      bestStreak: 0,
      achievements: ALL_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
      unlockedModes: ["1v1"],
      dailyChallengeCompleted: false,
      lastDailyChallengeDate: "",
    };
    saveProgress(initialProgress);
    setProgress(initialProgress);
  }, []);

  return {
    progress,
    getLevelInfo,
    addXp,
    recordBattleResult,
    newAchievements,
    clearNewAchievements,
    resetProgress,
  };
}
