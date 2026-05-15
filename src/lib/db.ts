// IndexedDB cache wrapper for offline support.
import { openDB, type IDBPDatabase } from "idb";

export interface CachedPokemon {
  id: number;
  name_en: string;
  name_ar: string | null;
  types: string[];
  generation: number;
  height: number;
  weight: number;
  sprite_url: string | null;
  artwork_url: string | null;
  stats: Record<string, number>;
  abilities: string[];
  description_en: string | null;
  description_ar: string | null;
  evolution_chain_id: number | null;
}

export interface CachedEvolution {
  id: number;
  chain_id: number;
  from_pokemon_id: number;
  to_pokemon_id: number;
  trigger: string | null;
  min_level: number | null;
  item: string | null;
}

const DB_NAME = "pokemon-guide";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("pokemon")) {
          db.createObjectStore("pokemon", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("evolutions")) {
          const s = db.createObjectStore("evolutions", { keyPath: "id" });
          s.createIndex("by_chain", "chain_id");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

export async function cachePokemon(list: CachedPokemon[]) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction("pokemon", "readwrite");
  for (const p of list) await tx.store.put(p);
  await tx.done;
}

export async function getAllCachedPokemon(): Promise<CachedPokemon[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("pokemon");
}

export async function getCachedPokemonById(id: number): Promise<CachedPokemon | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return db.get("pokemon", id);
}

export async function cacheEvolutions(list: CachedEvolution[]) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction("evolutions", "readwrite");
  for (const e of list) await tx.store.put(e);
  await tx.done;
}

export async function getEvolutionsByChain(chainId: number): Promise<CachedEvolution[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex("evolutions", "by_chain", chainId);
}

export async function setMeta(key: string, value: unknown) {
  const db = await getDB();
  if (!db) return;
  await db.put("meta", value, key);
}

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return db.get("meta", key);
}
