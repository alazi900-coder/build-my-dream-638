/**
 * Unified Offline-First Data Store
 *
 * Production-grade data layer that:
 * - Reads from IndexedDB when offline pack is installed
 * - Falls back to network only during pack download/update
 * - Provides O(1) lookups via in-memory caching
 * - Handles graceful degradation when data is missing
 */

import { getDB, getStoreCount } from "@/original/lib/db";
import { hasSupabaseConfig, supabase } from "@/original/integrations/supabase/client";
import { localSeedData } from "@/original/data/seedData";

// ============================================
// TYPES
// ============================================

export interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  abilities: any[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  evolution: any;
  notes_en: string | null;
  notes_ar: string | null;
  tags: string[];
  available_in?: string[];
  is_legendary?: boolean;
  is_starter?: boolean;
}

export interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect_en: string | null;
  effect_ar: string | null;
  learnset?: any[];
  available_in?: string[];
}

export interface Item {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
  effect_en: string | null;
  effect_ar: string | null;
  usage_en: string | null;
  usage_ar: string | null;
  obtain: any[];
  available_in?: string[];
}

export interface Location {
  id: number;
  name_en: string;
  name_ar: string;
  region: string;
  map_data: any;
  notes_en: string | null;
  notes_ar: string | null;
  map_image_url?: string | null;
  available_in?: string[];
}

export interface Encounter {
  id: number;
  pokemon_id: number;
  location_id: number;
  method: string;
  min_lvl: number;
  max_lvl: number;
  chance: number;
  time_of_day: string | null;
  weather: string | null;
  version: string | null;
}

export interface Gym {
  id: number;
  game_id: string;
  city_en: string;
  city_ar: string;
  leader_name_en: string;
  leader_name_ar: string;
  type: string;
  challenge_en: string | null;
  challenge_ar: string | null;
  tips_en: string | null;
  tips_ar: string | null;
  badge_order: number;
  available_in?: string[];
}

export interface GymRoster {
  id: number;
  gym_id: number;
  pokemon_id: number;
  level: number;
  moves: any[];
}

export interface NPC {
  id: number;
  name_en: string;
  name_ar: string;
  role_en: string;
  role_ar: string;
  category: string;
  location_en: string;
  location_ar: string;
  story_en: string | null;
  story_ar: string | null;
  image_url: string | null;
  badge_order: number | null;
  specialty_type: string | null;
}

export interface Learnset {
  id: number;
  pokemon_id: number;
  move_id: number;
  level: number | null;
  learn_method: string;
  game_id: string;
}

export interface EvolutionNode {
  id: number;
  pokemon_id: number;
  evolves_to_pokemon_id: number;
  method_type: string;
  level: number | null;
  item_id: number | null;
  conditions_en: string | null;
  conditions_ar: string | null;
  game_id: string | null;
}

export interface Game {
  id: string;
  name_en: string;
  name_ar: string;
}

export interface PokemonHeldItem {
  id: number;
  pokemon_id: number;
  item_id: number;
  hold_chance: number;
  game_id: string;
}

export interface OfflinePackMeta {
  installed: boolean;
  version: string;
  installedAt: string | null;
  datasetCounts: {
    pokemon: number;
    moves: number;
    items: number;
    locations: number;
    encounters: number;
    gyms: number;
    gym_roster: number;
    npcs: number;
    learnsets: number;
    evolution_nodes: number;
    games: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

const PACK_VERSION = "1.0.0";
const PACK_META_KEY = "offlinePackMeta";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in-memory cache

// ============================================
// IN-MEMORY CACHES
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Individual cache variables (avoiding global 'caches' name conflict)
let pokemonCache: CacheEntry<Map<number, Pokemon>> | null = null;
let movesCache: CacheEntry<Map<number, Move>> | null = null;
let itemsCache: CacheEntry<Map<number, Item>> | null = null;
let locationsCache: CacheEntry<Map<number, Location>> | null = null;
let encountersCache: CacheEntry<Encounter[]> | null = null;
let gymsCache: CacheEntry<Map<number, Gym>> | null = null;
let gymRosterCache: CacheEntry<GymRoster[]> | null = null;
let npcsCache: CacheEntry<Map<number, NPC>> | null = null;
let learnsetsCache: CacheEntry<Learnset[]> | null = null;
let evolutionNodesCache: CacheEntry<EvolutionNode[]> | null = null;
let gamesCache: CacheEntry<Map<string, Game>> | null = null;

function isCacheValid<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL;
}

// ============================================
// OFFLINE PACK METADATA
// ============================================

export function getOfflinePackMeta(): OfflinePackMeta {
  try {
    const stored = localStorage.getItem(PACK_META_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    installed: false,
    version: "",
    installedAt: null,
    datasetCounts: {
      pokemon: 0,
      moves: 0,
      items: 0,
      locations: 0,
      encounters: 0,
      gyms: 0,
      gym_roster: 0,
      npcs: 0,
      learnsets: 0,
      evolution_nodes: 0,
      games: 0,
    },
  };
}

export function setOfflinePackMeta(meta: Partial<OfflinePackMeta>): void {
  const current = getOfflinePackMeta();
  const updated = { ...current, ...meta };
  localStorage.setItem(PACK_META_KEY, JSON.stringify(updated));
}

export function isOfflinePackInstalled(): boolean {
  return getOfflinePackMeta().installed;
}

export async function updatePackMetaCounts(): Promise<void> {
  const counts = {
    pokemon: await getStoreCount("pokemon"),
    moves: await getStoreCount("moves"),
    items: await getStoreCount("items"),
    locations: await getStoreCount("locations"),
    encounters: await getStoreCount("encounters"),
    gyms: await getStoreCount("gyms"),
    gym_roster: await getStoreCount("gym_roster"),
    npcs: await getStoreCount("npcs"),
    learnsets: await getStoreCount("learnsets"),
    evolution_nodes: await getStoreCount("evolution_nodes"),
    games: await getStoreCount("games"),
  };

  setOfflinePackMeta({
    datasetCounts: counts,
    installed: Object.values(counts).some((c) => c > 0),
    version: PACK_VERSION,
    installedAt: new Date().toISOString(),
  });
}

export function clearOfflinePackMeta(): void {
  localStorage.removeItem(PACK_META_KEY);
}

// ============================================
// GENERIC DATA FETCHER
// ============================================

type StoreName =
  | "pokemon"
  | "moves"
  | "items"
  | "locations"
  | "encounters"
  | "gyms"
  | "gym_roster"
  | "npcs"
  | "learnsets"
  | "evolution_nodes"
  | "games"
  | "pokemon_held_items";

const fallbackDataByStore: Partial<Record<StoreName, readonly unknown[]>> = localSeedData;

function isBrowserOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

function getFallbackData<T>(storeName: StoreName): T[] {
  return [...(fallbackDataByStore[storeName] ?? [])] as T[];
}

function normalizePokemonStats(
  stats: Record<string, unknown> | null | undefined,
): Pokemon["stats"] {
  const record = stats ?? {};
  const readStat = (aliases: string[]) => {
    for (const alias of aliases) {
      const value = record[alias];
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return 0;
  };

  return {
    hp: readStat(["hp"]),
    atk: readStat(["atk", "attack"]),
    def: readStat(["def", "defense"]),
    spa: readStat(["spa", "special_attack", "specialAttack", "sp_atk", "spAtk"]),
    spd: readStat(["spd", "special_defense", "specialDefense", "sp_def", "spDef"]),
    spe: readStat(["spe", "speed"]),
  };
}

async function fetchFromLocal<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await getDB();
    return (await db.getAll(storeName)) as T[];
  } catch (e) {
    console.warn(`[DataStore] Failed to read ${storeName} from IndexedDB:`, e);
    return [];
  }
}

async function fetchFromNetwork<T>(tableName: string): Promise<T[]> {
  if (!isBrowserOnline() || !hasSupabaseConfig) return [];

  try {
    // Use type assertion to handle dynamic table names
    const { data, error } = await (supabase.from(tableName as any).select("*") as any);

    if (error) {
      console.error(`[DataStore] Supabase error for ${tableName}:`, error);
      return [];
    }

    return (data || []) as T[];
  } catch (e) {
    console.error(`[DataStore] Network fetch failed for ${tableName}:`, e);
    return [];
  }
}

// ============================================
// POKEMON
// ============================================

export async function getAllPokemon(): Promise<Pokemon[]> {
  if (isCacheValid(pokemonCache)) {
    return Array.from(pokemonCache.data.values());
  }

  let data = await fetchFromLocal<Pokemon>("pokemon");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Pokemon>("pokemon");
  }
  if (data.length === 0) {
    data = getFallbackData<Pokemon>("pokemon");
  }

  const map = new Map(
    data.map((p) => [
      p.id,
      {
        ...p,
        types: Array.isArray(p.types) ? p.types : [],
        abilities: Array.isArray(p.abilities) ? p.abilities : [],
        stats: normalizePokemonStats(p.stats),
        tags: Array.isArray(p.tags) ? p.tags : [],
        available_in: Array.isArray(p.available_in) ? p.available_in : [],
      },
    ]),
  );

  pokemonCache = { data: map, timestamp: Date.now() };
  return Array.from(map.values());
}

export async function getPokemonById(id: number): Promise<Pokemon | undefined> {
  const all = await getAllPokemon();
  return all.find((p) => p.id === id);
}

export async function getPokemonMap(): Promise<Map<number, Pokemon>> {
  const all = await getAllPokemon();
  return new Map(all.map((p) => [p.id, p]));
}

export async function searchPokemon(
  query: string,
  filters?: { types?: string[]; game?: string },
  limit = 100,
): Promise<Pokemon[]> {
  const all = await getAllPokemon();
  const queryLower = query.toLowerCase();

  return all
    .filter((p) => {
      const nameMatch =
        !query ||
        p.name_en.toLowerCase().includes(queryLower) ||
        p.name_ar.includes(query) ||
        p.id.toString() === query;

      const typeMatch = !filters?.types?.length || filters.types.some((t) => p.types.includes(t));

      const gameMatch =
        !filters?.game || filters.game === "all" || p.available_in?.includes(filters.game);

      return nameMatch && typeMatch && gameMatch;
    })
    .slice(0, limit);
}

// ============================================
// MOVES
// ============================================

export async function getAllMoves(): Promise<Move[]> {
  if (isCacheValid(movesCache)) {
    return Array.from(movesCache.data.values());
  }

  let data = await fetchFromLocal<Move>("moves");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Move>("moves");
  }
  if (data.length === 0) {
    data = getFallbackData<Move>("moves");
  }

  const map = new Map(
    data.map((m) => [
      m.id,
      {
        ...m,
        available_in: Array.isArray(m.available_in) ? m.available_in : [],
      },
    ]),
  );

  movesCache = { data: map, timestamp: Date.now() };
  return Array.from(map.values());
}

export async function getMoveById(id: number): Promise<Move | undefined> {
  const all = await getAllMoves();
  return all.find((m) => m.id === id);
}

export async function getMoveMap(): Promise<Map<number, Move>> {
  const all = await getAllMoves();
  return new Map(all.map((m) => [m.id, m]));
}

// ============================================
// ITEMS
// ============================================

export async function getAllItems(): Promise<Item[]> {
  if (isCacheValid(itemsCache)) {
    return Array.from(itemsCache.data.values());
  }

  let data = await fetchFromLocal<Item>("items");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Item>("items");
  }
  if (data.length === 0) {
    data = getFallbackData<Item>("items");
  }

  const map = new Map(
    data.map((i) => [
      i.id,
      {
        ...i,
        obtain: Array.isArray(i.obtain) ? i.obtain : [],
        available_in: Array.isArray(i.available_in) ? i.available_in : [],
      },
    ]),
  );

  itemsCache = { data: map, timestamp: Date.now() };
  return Array.from(map.values());
}

export async function getItemById(id: number): Promise<Item | undefined> {
  const all = await getAllItems();
  return all.find((i) => i.id === id);
}

export async function getItemMap(): Promise<Map<number, Item>> {
  const all = await getAllItems();
  return new Map(all.map((i) => [i.id, i]));
}

// ============================================
// LOCATIONS
// ============================================

export async function getAllLocations(): Promise<Location[]> {
  if (isCacheValid(locationsCache)) {
    return Array.from(locationsCache.data.values());
  }

  let data = await fetchFromLocal<Location>("locations");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Location>("locations");
  }
  if (data.length === 0) {
    data = getFallbackData<Location>("locations");
  }

  const map = new Map(
    data.map((l) => [
      l.id,
      {
        ...l,
        available_in: Array.isArray(l.available_in) ? l.available_in : [],
      },
    ]),
  );

  locationsCache = { data: map, timestamp: Date.now() };
  return Array.from(map.values());
}

export async function getLocationById(id: number): Promise<Location | undefined> {
  const all = await getAllLocations();
  return all.find((l) => l.id === id);
}

// ============================================
// ENCOUNTERS
// ============================================

export async function getAllEncounters(): Promise<Encounter[]> {
  if (isCacheValid(encountersCache)) {
    return encountersCache.data;
  }

  let data = await fetchFromLocal<Encounter>("encounters");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Encounter>("encounters");
  }

  encountersCache = { data, timestamp: Date.now() };
  return data;
}

export async function getEncountersByPokemon(pokemonId: number): Promise<Encounter[]> {
  const all = await getAllEncounters();
  return all.filter((e) => e.pokemon_id === pokemonId);
}

export async function getEncountersByLocation(locationId: number): Promise<Encounter[]> {
  const all = await getAllEncounters();
  return all.filter((e) => e.location_id === locationId);
}

// ============================================
// GYMS
// ============================================

export async function getAllGyms(): Promise<Gym[]> {
  if (isCacheValid(gymsCache)) {
    return Array.from(gymsCache.data.values());
  }

  let data = await fetchFromLocal<Gym>("gyms");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Gym>("gyms");
  }
  if (data.length === 0) {
    data = getFallbackData<Gym>("gyms");
  }

  const map = new Map(
    data.map((g) => [
      g.id,
      {
        ...g,
        available_in: Array.isArray(g.available_in) ? g.available_in : [],
      },
    ]),
  );

  gymsCache = { data: map, timestamp: Date.now() };
  return Array.from(map.values());
}

export async function getGymById(id: number): Promise<Gym | undefined> {
  const all = await getAllGyms();
  return all.find((g) => g.id === id);
}

// ============================================
// GYM ROSTER
// ============================================

export async function getAllGymRoster(): Promise<GymRoster[]> {
  if (isCacheValid(gymRosterCache)) {
    return gymRosterCache.data;
  }

  let data = await fetchFromLocal<GymRoster>("gym_roster");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<GymRoster>("gym_roster");
  }

  gymRosterCache = { data, timestamp: Date.now() };
  return data;
}

export async function getGymRosterByGym(gymId: number): Promise<GymRoster[]> {
  const all = await getAllGymRoster();
  return all.filter((r) => r.gym_id === gymId);
}

// ============================================
// NPCs
// ============================================

export async function getAllNPCs(): Promise<NPC[]> {
  if (isCacheValid(npcsCache)) {
    return Array.from(npcsCache.data.values());
  }

  let data = await fetchFromLocal<NPC>("npcs");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<NPC>("npcs");
  }

  const map = new Map(data.map((n) => [n.id, n]));
  npcsCache = { data: map, timestamp: Date.now() };
  return Array.from(map.values());
}

export async function getNPCById(id: number): Promise<NPC | undefined> {
  const all = await getAllNPCs();
  return all.find((n) => n.id === id);
}

// ============================================
// LEARNSETS
// ============================================

export async function getAllLearnsets(): Promise<Learnset[]> {
  if (isCacheValid(learnsetsCache)) {
    return learnsetsCache.data;
  }

  let data = await fetchFromLocal<Learnset>("learnsets");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Learnset>("learnsets");
  }

  learnsetsCache = { data, timestamp: Date.now() };
  return data;
}

export async function getLearnsetsByPokemon(
  pokemonId: number,
  gameId?: string,
): Promise<Learnset[]> {
  const all = await getAllLearnsets();
  return all.filter(
    (l) => l.pokemon_id === pokemonId && (!gameId || gameId === "all" || l.game_id === gameId),
  );
}

// ============================================
// EVOLUTION NODES
// ============================================

export async function getAllEvolutionNodes(): Promise<EvolutionNode[]> {
  if (isCacheValid(evolutionNodesCache)) {
    return evolutionNodesCache.data;
  }

  let data = await fetchFromLocal<EvolutionNode>("evolution_nodes");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<EvolutionNode>("evolution_nodes");
  }

  evolutionNodesCache = { data, timestamp: Date.now() };
  return data;
}

export async function getEvolutionNodesByPokemon(pokemonId: number): Promise<EvolutionNode[]> {
  const all = await getAllEvolutionNodes();
  return all.filter((e) => e.pokemon_id === pokemonId || e.evolves_to_pokemon_id === pokemonId);
}

// ============================================
// GAMES
// ============================================

export async function getAllGames(): Promise<Game[]> {
  if (isCacheValid(gamesCache)) {
    return Array.from(gamesCache.data.values());
  }

  let data = await fetchFromLocal<Game>("games");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<Game>("games");
  }

  const map = new Map(data.map((g) => [g.id, g]));
  gamesCache = { data: map, timestamp: Date.now() };
  return Array.from(map.values());
}

export async function getGameById(id: string): Promise<Game | undefined> {
  const all = await getAllGames();
  return all.find((g) => g.id === id);
}

// ============================================
// POKEMON HELD ITEMS
// ============================================

let pokemonHeldItemsCache: CacheEntry<PokemonHeldItem[]> | null = null;

export async function getAllPokemonHeldItems(): Promise<PokemonHeldItem[]> {
  if (isCacheValid(pokemonHeldItemsCache)) {
    return pokemonHeldItemsCache.data;
  }

  let data = await fetchFromLocal<PokemonHeldItem>("pokemon_held_items");
  if (data.length === 0 && isBrowserOnline()) {
    data = await fetchFromNetwork<PokemonHeldItem>("pokemon_held_items");
  }

  pokemonHeldItemsCache = { data, timestamp: Date.now() };
  return data;
}

export async function getPokemonHeldItemsByPokemon(pokemonId: number): Promise<PokemonHeldItem[]> {
  const all = await getAllPokemonHeldItems();
  return all.filter((h) => h.pokemon_id === pokemonId);
}

// ============================================
// CACHE MANAGEMENT
// ============================================

export function invalidateAllCaches(): void {
  pokemonCache = null;
  movesCache = null;
  itemsCache = null;
  locationsCache = null;
  encountersCache = null;
  gymsCache = null;
  gymRosterCache = null;
  npcsCache = null;
  learnsetsCache = null;
  evolutionNodesCache = null;
  gamesCache = null;
  pokemonHeldItemsCache = null;
}

// ============================================
// PRELOAD ALL DATA (for cold start)
// ============================================

export async function preloadAllData(): Promise<void> {
  if (!isOfflinePackInstalled()) {
    console.log("[DataStore] Offline pack not installed, skipping preload");
    return;
  }

  console.log("[DataStore] Preloading all data into memory...");

  await Promise.all([
    getAllPokemon(),
    getAllMoves(),
    getAllItems(),
    getAllLocations(),
    getAllEncounters(),
    getAllGyms(),
    getAllGymRoster(),
    getAllNPCs(),
    getAllLearnsets(),
    getAllEvolutionNodes(),
    getAllGames(),
  ]);

  console.log("[DataStore] Preload complete");
}

// ============================================
// CLEAR IN-MEMORY CACHES
// ============================================

export function clearAllCaches(): void {
  pokemonCache = null;
  movesCache = null;
  itemsCache = null;
  locationsCache = null;
  encountersCache = null;
  gymsCache = null;
  gymRosterCache = null;
  npcsCache = null;
  learnsetsCache = null;
  evolutionNodesCache = null;
  gamesCache = null;
  console.log("[DataStore] All in-memory caches cleared");
}
