/**
 * Unified Pokemon Data Store
 * Provides memoized access to Pokemon data with IndexedDB caching
 */

import { getDB } from "@/original/lib/db";
import { supabase } from "@/original/integrations/supabase/client";
import { PokemonBasic, ItemBasic, EvolutionNodeDB } from "@/original/lib/evolution/types";

// Cached data stores
let cachedPokemon: Map<number, PokemonBasic> | null = null;
let cachedItems: Map<number, ItemBasic> | null = null;
let cachedEvolutionNodes: EvolutionNodeDB[] | null = null;

// Cache timestamps
let pokemonCacheTime = 0;
let itemsCacheTime = 0;
let evolutionCacheTime = 0;

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Check if cache is still valid
 */
function isCacheValid(cacheTime: number): boolean {
  return Date.now() - cacheTime < CACHE_TTL;
}

/**
 * Get all Pokemon as a Map for O(1) lookups
 */
export async function getPokemonMap(): Promise<Map<number, PokemonBasic>> {
  if (cachedPokemon && isCacheValid(pokemonCacheTime)) {
    return cachedPokemon;
  }

  try {
    // Try IndexedDB first
    const db = await getDB();
    const cached = await db.getAll("pokemon");

    if (cached.length > 0) {
      cachedPokemon = new Map(
        cached.map((p) => [
          p.id,
          {
            id: p.id,
            name_en: p.name_en,
            name_ar: p.name_ar,
            available_in: p.available_in,
          },
        ]),
      );
      pokemonCacheTime = Date.now();
      return cachedPokemon;
    }
  } catch (e) {
    console.warn("IndexedDB read failed, falling back to Supabase");
  }

  // Fallback to Supabase
  const { data } = await supabase.from("pokemon").select("id, name_en, name_ar, available_in");

  if (data) {
    cachedPokemon = new Map(
      data.map((p) => [
        p.id,
        {
          id: p.id,
          name_en: p.name_en,
          name_ar: p.name_ar,
          available_in: p.available_in as string[] | null,
        },
      ]),
    );
    pokemonCacheTime = Date.now();
  } else {
    cachedPokemon = new Map();
  }

  return cachedPokemon;
}

/**
 * Get Pokemon by ID - O(1) lookup
 */
export async function getPokemonById(id: number): Promise<PokemonBasic | undefined> {
  const map = await getPokemonMap();
  return map.get(id);
}

/**
 * Get all Items as a Map for O(1) lookups
 */
export async function getItemsMap(): Promise<Map<number, ItemBasic>> {
  if (cachedItems && isCacheValid(itemsCacheTime)) {
    return cachedItems;
  }

  try {
    const db = await getDB();
    const cached = await db.getAll("items");

    if (cached.length > 0) {
      cachedItems = new Map(
        cached.map((i) => [
          i.id,
          {
            id: i.id,
            name_en: i.name_en,
            name_ar: i.name_ar,
          },
        ]),
      );
      itemsCacheTime = Date.now();
      return cachedItems;
    }
  } catch (e) {
    console.warn("IndexedDB read failed");
  }

  const { data } = await supabase.from("items").select("id, name_en, name_ar");

  if (data) {
    cachedItems = new Map(
      data.map((i) => [
        i.id,
        {
          id: i.id,
          name_en: i.name_en,
          name_ar: i.name_ar,
        },
      ]),
    );
    itemsCacheTime = Date.now();
  } else {
    cachedItems = new Map();
  }

  return cachedItems;
}

/**
 * Get all Evolution Nodes
 */
export async function getEvolutionNodes(): Promise<EvolutionNodeDB[]> {
  if (cachedEvolutionNodes && isCacheValid(evolutionCacheTime)) {
    return cachedEvolutionNodes;
  }

  try {
    const db = await getDB();
    const cached = await db.getAll("evolution_nodes");

    if (cached.length > 0) {
      cachedEvolutionNodes = cached as EvolutionNodeDB[];
      evolutionCacheTime = Date.now();
      return cachedEvolutionNodes;
    }
  } catch (e) {
    console.warn("IndexedDB read failed");
  }

  const { data } = await supabase.from("evolution_nodes").select("*");
  cachedEvolutionNodes = (data || []) as EvolutionNodeDB[];
  evolutionCacheTime = Date.now();

  return cachedEvolutionNodes;
}

/**
 * Invalidate all caches
 */
export function invalidateStore(): void {
  cachedPokemon = null;
  cachedItems = null;
  cachedEvolutionNodes = null;
  pokemonCacheTime = 0;
  itemsCacheTime = 0;
  evolutionCacheTime = 0;
}

/**
 * Search Pokemon by name
 */
export async function searchPokemon(query: string, limit = 50): Promise<PokemonBasic[]> {
  const map = await getPokemonMap();
  const queryLower = query.toLowerCase();
  const results: PokemonBasic[] = [];

  for (const pokemon of map.values()) {
    if (pokemon.name_en.toLowerCase().includes(queryLower) || pokemon.name_ar.includes(query)) {
      results.push(pokemon);
      if (results.length >= limit) break;
    }
  }

  return results;
}
