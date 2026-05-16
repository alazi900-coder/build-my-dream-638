/**
 * Generic Offline Data Hook
 * Provides table-specific data fetching with offline support
 * Now backed by the centralized data store
 */

import { useState, useEffect, useCallback } from "react";
import * as dataStore from "@/original/lib/store/dataStore";

type TableName =
  | "pokemon"
  | "moves"
  | "items"
  | "locations"
  | "encounters"
  | "gyms"
  | "gym_roster"
  | "learnsets"
  | "npcs"
  | "evolution_nodes"
  | "games"
  | "pokemon_held_items";

interface UseOfflineDataOptions {
  table: TableName;
  cacheTime?: number; // kept for API compatibility but now handled by dataStore
}

// Map table names to their fetcher functions
const tableFetchers: Record<TableName, () => Promise<any[]>> = {
  pokemon: dataStore.getAllPokemon,
  moves: dataStore.getAllMoves,
  items: dataStore.getAllItems,
  locations: dataStore.getAllLocations,
  encounters: dataStore.getAllEncounters,
  gyms: dataStore.getAllGyms,
  gym_roster: dataStore.getAllGymRoster,
  learnsets: dataStore.getAllLearnsets,
  npcs: dataStore.getAllNPCs,
  evolution_nodes: dataStore.getAllEvolutionNodes,
  games: dataStore.getAllGames,
  pokemon_held_items: dataStore.getAllPokemonHeldItems,
};

export function useOfflineData<T>({ table }: UseOfflineDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetcher = tableFetchers[table];
      if (!fetcher) {
        throw new Error(`Unknown table: ${table}`);
      }

      const result = await fetcher();
      setData(result as T[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [table]);

  const forceSync = useCallback(async () => {
    if (!navigator.onLine) {
      setError("Cannot sync while offline");
      return;
    }

    dataStore.invalidateAllCaches();
    await sync();
  }, [sync]);

  useEffect(() => {
    sync();
  }, [sync]);

  return { data, loading, error, sync, forceSync };
}
