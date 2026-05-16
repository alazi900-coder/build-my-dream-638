import { useState, useEffect, useCallback } from "react";
import {
  saveScore,
  getStats,
  getAllStats,
  getHighScore,
  getUnlockedAchievements,
  checkAndUnlockAchievements,
  ACHIEVEMENTS,
  type MiniGameScore,
  type MiniGameStats,
  type Achievement,
} from "@/original/lib/miniGameStorage";

export function useMiniGameStats(gameType?: string) {
  const [stats, setStats] = useState<MiniGameStats | null>(null);
  const [allStats, setAllStats] = useState<MiniGameStats[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      if (gameType) {
        const gameStats = await getStats(gameType);
        setStats(gameStats || null);
        const hs = await getHighScore(gameType);
        setHighScore(hs);
      }

      const all = await getAllStats();
      setAllStats(all);

      const unlocked = await getUnlockedAchievements();
      setAchievements(unlocked);
    } catch (error) {
      console.error("Error loading mini game stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [gameType]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const submitScore = useCallback(
    async (score: Omit<MiniGameScore, "id" | "gameType" | "playedAt">) => {
      if (!gameType) return;

      try {
        await saveScore({
          ...score,
          gameType,
          playedAt: Date.now(),
        });

        // Check for achievements
        const all = await getAllStats();
        const gameStats = all.find((s) => s.gameType === gameType);

        const unlocked = await checkAndUnlockAchievements({
          totalGames: gameStats?.totalGames,
          streak: score.streak,
          gameType,
          score: score.score,
          correctAnswers: score.correctAnswers,
        });

        if (unlocked.length > 0) {
          const newlyUnlocked = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id));
          setNewAchievements(newlyUnlocked);

          // Clear after 5 seconds
          setTimeout(() => setNewAchievements([]), 5000);
        }

        await loadStats();
      } catch (error) {
        console.error("Error saving score:", error);
      }
    },
    [gameType, loadStats],
  );

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  return {
    stats,
    allStats,
    highScore,
    achievements,
    newAchievements,
    allAchievements: ACHIEVEMENTS,
    isLoading,
    submitScore,
    clearNewAchievements,
    refresh: loadStats,
  };
}
