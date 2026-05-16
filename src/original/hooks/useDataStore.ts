/**
 * React hooks for the unified offline-first data store
 * These hooks provide reactive access to cached data with loading states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import * as dataStore from "@/original/lib/store/dataStore";

// ============================================
// Generic hook for array data
// ============================================

interface UseDataStoreResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  isOfflineReady: boolean;
  refresh: () => Promise<void>;
}

function useDataStoreArray<T>(
  fetcher: () => Promise<T[]>,
  filterFn?: (item: T) => boolean,
): UseDataStoreResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);

  fetcherRef.current = fetcher;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    dataStore.invalidateAllCaches();
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = filterFn ? data.filter(filterFn) : data;
  const isOfflineReady = dataStore.isOfflinePackInstalled();

  return {
    data: filteredData,
    loading,
    error,
    isEmpty: !loading && filteredData.length === 0,
    isOfflineReady,
    refresh,
  };
}

// ============================================
// POKEMON
// ============================================

export function usePokemon(): UseDataStoreResult<dataStore.Pokemon> {
  const { isAvailableInGame, selectedGame } = useGameFilter();

  return useDataStoreArray(
    dataStore.getAllPokemon,
    (p) => selectedGame === "all" || isAvailableInGame(p.available_in),
  );
}

export function usePokemonById(id: number) {
  const [pokemon, setPokemon] = useState<dataStore.Pokemon | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await dataStore.getPokemonById(id);
        setPokemon(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return { pokemon, loading, error };
}

export function usePokemonSearch(query: string, filters?: { types?: string[]; game?: string }) {
  const [results, setResults] = useState<dataStore.Pokemon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function search() {
      if (!query && !filters?.types?.length) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const result = await dataStore.searchPokemon(query, filters);
        setResults(result);
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [query, filters?.types?.join(","), filters?.game]);

  return { results, loading };
}

// ============================================
// MOVES
// ============================================

export function useMoves(): UseDataStoreResult<dataStore.Move> {
  const { isAvailableInGame, selectedGame } = useGameFilter();

  return useDataStoreArray(
    dataStore.getAllMoves,
    (m) => selectedGame === "all" || isAvailableInGame(m.available_in),
  );
}

export function useMoveById(id: number) {
  const [move, setMove] = useState<dataStore.Move | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getMoveById(id)
      .then(setMove)
      .finally(() => setLoading(false));
  }, [id]);

  return { move, loading };
}

// ============================================
// ITEMS
// ============================================

export function useItems(): UseDataStoreResult<dataStore.Item> {
  const { isAvailableInGame, selectedGame } = useGameFilter();

  return useDataStoreArray(
    dataStore.getAllItems,
    (i) => selectedGame === "all" || isAvailableInGame(i.available_in),
  );
}

export function useItemById(id: number) {
  const [item, setItem] = useState<dataStore.Item | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getItemById(id)
      .then(setItem)
      .finally(() => setLoading(false));
  }, [id]);

  return { item, loading };
}

// ============================================
// LOCATIONS
// ============================================

export function useLocations(): UseDataStoreResult<dataStore.Location> {
  const { isAvailableInGame, selectedGame } = useGameFilter();

  return useDataStoreArray(
    dataStore.getAllLocations,
    (l) => selectedGame === "all" || isAvailableInGame(l.available_in),
  );
}

export function useLocationById(id: number) {
  const [location, setLocation] = useState<dataStore.Location | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getLocationById(id)
      .then(setLocation)
      .finally(() => setLoading(false));
  }, [id]);

  return { location, loading };
}

// ============================================
// ENCOUNTERS
// ============================================

export function useEncounters(): UseDataStoreResult<dataStore.Encounter> {
  return useDataStoreArray(dataStore.getAllEncounters);
}

export function useEncountersByPokemon(pokemonId: number) {
  const [encounters, setEncounters] = useState<dataStore.Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getEncountersByPokemon(pokemonId)
      .then(setEncounters)
      .finally(() => setLoading(false));
  }, [pokemonId]);

  return { encounters, loading };
}

export function useEncountersByLocation(locationId: number) {
  const [encounters, setEncounters] = useState<dataStore.Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getEncountersByLocation(locationId)
      .then(setEncounters)
      .finally(() => setLoading(false));
  }, [locationId]);

  return { encounters, loading };
}

// ============================================
// GYMS
// ============================================

export function useGyms(): UseDataStoreResult<dataStore.Gym> {
  const { isAvailableInGame, selectedGame } = useGameFilter();

  return useDataStoreArray(
    dataStore.getAllGyms,
    (g) => selectedGame === "all" || isAvailableInGame(g.available_in),
  );
}

export function useGymById(id: number) {
  const [gym, setGym] = useState<dataStore.Gym | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getGymById(id)
      .then(setGym)
      .finally(() => setLoading(false));
  }, [id]);

  return { gym, loading };
}

export function useGymRoster(gymId: number) {
  const [roster, setRoster] = useState<dataStore.GymRoster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getGymRosterByGym(gymId)
      .then(setRoster)
      .finally(() => setLoading(false));
  }, [gymId]);

  return { roster, loading };
}

export function useAllGymRosters(): UseDataStoreResult<dataStore.GymRoster> {
  return useDataStoreArray(dataStore.getAllGymRoster);
}

// ============================================
// NPCs
// ============================================

export function useNPCsFromStore(): UseDataStoreResult<dataStore.NPC> {
  return useDataStoreArray(dataStore.getAllNPCs);
}

export function useNPCById(id: number) {
  const [npc, setNpc] = useState<dataStore.NPC | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getNPCById(id)
      .then(setNpc)
      .finally(() => setLoading(false));
  }, [id]);

  return { npc, loading };
}

// ============================================
// LEARNSETS
// ============================================

export function useLearnsets(): UseDataStoreResult<dataStore.Learnset> {
  return useDataStoreArray(dataStore.getAllLearnsets);
}

export function useLearnsetsByPokemon(pokemonId: number, gameId?: string) {
  const [learnsets, setLearnsets] = useState<dataStore.Learnset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getLearnsetsByPokemon(pokemonId, gameId)
      .then(setLearnsets)
      .finally(() => setLoading(false));
  }, [pokemonId, gameId]);

  return { learnsets, loading };
}

// ============================================
// EVOLUTION NODES
// ============================================

export function useEvolutionNodes(): UseDataStoreResult<dataStore.EvolutionNode> {
  return useDataStoreArray(dataStore.getAllEvolutionNodes);
}

export function useEvolutionNodesByPokemon(pokemonId: number) {
  const [nodes, setNodes] = useState<dataStore.EvolutionNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getEvolutionNodesByPokemon(pokemonId)
      .then(setNodes)
      .finally(() => setLoading(false));
  }, [pokemonId]);

  return { nodes, loading };
}

// ============================================
// GAMES
// ============================================

export function useGames(): UseDataStoreResult<dataStore.Game> {
  return useDataStoreArray(dataStore.getAllGames);
}

export function useGameById(id: string) {
  const [game, setGame] = useState<dataStore.Game | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore
      .getGameById(id)
      .then(setGame)
      .finally(() => setLoading(false));
  }, [id]);

  return { game, loading };
}

// ============================================
// OFFLINE PACK STATUS
// ============================================

export function useOfflinePackStatus() {
  const [meta, setMeta] = useState(dataStore.getOfflinePackMeta());

  const refresh = useCallback(() => {
    setMeta(dataStore.getOfflinePackMeta());
  }, []);

  useEffect(() => {
    refresh();
    // Refresh meta on visibility change (user returns to app)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refresh]);

  return {
    isInstalled: meta.installed,
    version: meta.version,
    installedAt: meta.installedAt,
    datasetCounts: meta.datasetCounts,
    refresh,
  };
}

// ============================================
// PRELOAD HOOK (for app startup)
// ============================================

export function usePreloadData() {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    async function preload() {
      if (!dataStore.isOfflinePackInstalled()) {
        setIsPreloaded(true);
        return;
      }

      setIsPreloading(true);
      try {
        await dataStore.preloadAllData();
      } finally {
        setIsPreloading(false);
        setIsPreloaded(true);
      }
    }
    preload();
  }, []);

  return { isPreloaded, isPreloading };
}
