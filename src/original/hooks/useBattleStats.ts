import { useState, useEffect, useCallback } from "react";

export interface BattleRecord {
  id: string;
  result: "win" | "loss";
  format: "1v1" | "3v3" | "6v6";
  playerTeam: { id: number; name_en: string; name_ar: string }[];
  enemyTeam: { id: number; name_en: string; name_ar: string }[];
  timestamp: number;
}

export interface BattleStats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  pokemonUsage: Record<number, { count: number; wins: number; name_en: string; name_ar: string }>;
  recentBattles: BattleRecord[];
}

const STORAGE_KEY = "pokemon-battle-stats";
const MAX_RECENT_BATTLES = 20;

function loadStats(): BattleStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load battle stats:", e);
  }
  return {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    pokemonUsage: {},
    recentBattles: [],
  };
}

function saveStats(stats: BattleStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save battle stats:", e);
  }
}

export function useBattleStats() {
  const [stats, setStats] = useState<BattleStats>(loadStats);

  // Reload stats when component mounts
  useEffect(() => {
    setStats(loadStats());
  }, []);

  const recordBattle = useCallback(
    (
      result: "win" | "loss",
      format: "1v1" | "3v3" | "6v6",
      playerTeam: { id: number; name_en: string; name_ar: string }[],
      enemyTeam: { id: number; name_en: string; name_ar: string }[],
    ) => {
      setStats((prev) => {
        const newWins = result === "win" ? prev.wins + 1 : prev.wins;
        const newLosses = result === "loss" ? prev.losses + 1 : prev.losses;
        const newTotal = prev.totalBattles + 1;

        // Update Pokemon usage
        const newUsage = { ...prev.pokemonUsage };
        playerTeam.forEach((poke) => {
          if (!newUsage[poke.id]) {
            newUsage[poke.id] = { count: 0, wins: 0, name_en: poke.name_en, name_ar: poke.name_ar };
          }
          newUsage[poke.id].count += 1;
          if (result === "win") {
            newUsage[poke.id].wins += 1;
          }
        });

        // Add to recent battles
        const newRecord: BattleRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          result,
          format,
          playerTeam: playerTeam.map((p) => ({ id: p.id, name_en: p.name_en, name_ar: p.name_ar })),
          enemyTeam: enemyTeam.map((p) => ({ id: p.id, name_en: p.name_en, name_ar: p.name_ar })),
          timestamp: Date.now(),
        };

        const newRecentBattles = [newRecord, ...prev.recentBattles].slice(0, MAX_RECENT_BATTLES);

        const newStats: BattleStats = {
          totalBattles: newTotal,
          wins: newWins,
          losses: newLosses,
          winRate: newTotal > 0 ? Math.round((newWins / newTotal) * 100) : 0,
          pokemonUsage: newUsage,
          recentBattles: newRecentBattles,
        };

        saveStats(newStats);
        return newStats;
      });
    },
    [],
  );

  const clearStats = useCallback(() => {
    const emptyStats: BattleStats = {
      totalBattles: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      pokemonUsage: {},
      recentBattles: [],
    };
    saveStats(emptyStats);
    setStats(emptyStats);
  }, []);

  // Get top Pokemon by usage
  const getTopPokemon = useCallback(
    (limit: number = 5) => {
      return Object.entries(stats.pokemonUsage)
        .map(([id, data]) => ({ id: Number(id), ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    [stats.pokemonUsage],
  );

  return {
    stats,
    recordBattle,
    clearStats,
    getTopPokemon,
  };
}
