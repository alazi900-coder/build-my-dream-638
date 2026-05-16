import { useState, useEffect, useCallback } from "react";
import { getDB } from "@/original/lib/db";

export interface BattleTeamMember {
  pokemonId: number;
  moveIds: (number | null)[];
}

export interface SavedBattleTeam {
  id: string;
  name: string;
  format: "1v1" | "3v3";
  party: BattleTeamMember[];
  updatedAt: string;
}

const TEAMS_STORE_KEY = "battle-teams";

/**
 * Hook for managing battle teams in IndexedDB/localStorage
 */
export function useBattleTeams() {
  const [teams, setTeams] = useState<SavedBattleTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Load teams from localStorage (simpler than adding new IndexedDB store)
  const loadTeams = useCallback(() => {
    try {
      const stored = localStorage.getItem(TEAMS_STORE_KEY);
      if (stored) {
        setTeams(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load battle teams:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const saveTeam = useCallback((team: Omit<SavedBattleTeam, "id" | "updatedAt">) => {
    const newTeam: SavedBattleTeam = {
      ...team,
      id: `team-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    setTeams((prev) => {
      const updated = [...prev, newTeam];
      localStorage.setItem(TEAMS_STORE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newTeam;
  }, []);

  const updateTeam = useCallback((id: string, updates: Partial<SavedBattleTeam>) => {
    setTeams((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
      );
      localStorage.setItem(TEAMS_STORE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTeam = useCallback((id: string) => {
    setTeams((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(TEAMS_STORE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getTeam = useCallback(
    (id: string) => {
      return teams.find((t) => t.id === id) || null;
    },
    [teams],
  );

  return {
    teams,
    loading,
    saveTeam,
    updateTeam,
    deleteTeam,
    getTeam,
    reload: loadTeams,
  };
}
