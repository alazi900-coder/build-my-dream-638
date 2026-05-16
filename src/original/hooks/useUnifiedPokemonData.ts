/**
 * Unified Pokemon Data Hook
 * Provides access to Pokemon data with game filtering and offline support
 * Now backed by the centralized data store
 */

import { useState, useEffect, useCallback } from "react";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import * as dataStore from "@/original/lib/store/dataStore";

export interface UnifiedPokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  abilities: any[];
  evolution: any;
  notes_en: string | null;
  notes_ar: string | null;
  tags: string[];
  available_in?: string[];
  is_legendary?: boolean;
  is_starter?: boolean;
}

interface UseUnifiedPokemonDataResult {
  pokemon: UnifiedPokemon[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  isOfflineReady: boolean;
  refresh: () => Promise<void>;
}

export function useUnifiedPokemonData(): UseUnifiedPokemonDataResult {
  const [pokemon, setPokemon] = useState<UnifiedPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAvailableInGame, selectedGame } = useGameFilter();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await dataStore.getAllPokemon();
      setPokemon(data as UnifiedPokemon[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) {
      setError("Cannot refresh while offline");
      return;
    }

    dataStore.invalidateAllCaches();
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter by game availability
  const filteredPokemon = pokemon.filter(
    (p) => selectedGame === "all" || isAvailableInGame(p.available_in),
  );

  return {
    pokemon: filteredPokemon,
    loading,
    error,
    isEmpty: !loading && pokemon.length === 0,
    isOfflineReady: dataStore.isOfflinePackInstalled(),
    refresh,
  };
}
