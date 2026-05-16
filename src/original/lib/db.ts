import { openDB, DBSchema, IDBPDatabase } from "idb";

interface PokemonGuideDB extends DBSchema {
  pokemon: {
    key: number;
    value: {
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
    };
    indexes: { "by-name": string };
  };
  moves: {
    key: number;
    value: {
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
      learnset: any[];
      available_in?: string[];
    };
    indexes: { "by-type": string };
  };
  items: {
    key: number;
    value: {
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
    };
    indexes: { "by-category": string };
  };
  locations: {
    key: number;
    value: {
      id: number;
      name_en: string;
      name_ar: string;
      region: string;
      map_data: any;
      notes_en: string | null;
      notes_ar: string | null;
      map_image_url?: string | null;
      available_in?: string[];
    };
  };
  encounters: {
    key: number;
    value: {
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
    };
    indexes: { "by-pokemon": number; "by-location": number };
  };
  gyms: {
    key: number;
    value: {
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
    };
    indexes: { "by-order": number; "by-game": string };
  };
  gym_roster: {
    key: number;
    value: {
      id: number;
      gym_id: number;
      pokemon_id: number;
      level: number;
      moves: any[];
    };
    indexes: { "by-gym": number };
  };
  npcs: {
    key: number;
    value: {
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
    };
    indexes: { "by-category": string };
  };
  learnsets: {
    key: number;
    value: {
      id: number;
      pokemon_id: number;
      move_id: number;
      level: number | null;
      learn_method: string;
      game_id: string;
    };
    indexes: { "by-pokemon": number; "by-game": string };
  };
  evolution_nodes: {
    key: number;
    value: {
      id: number;
      pokemon_id: number;
      evolves_to_pokemon_id: number;
      method_type: string;
      level: number | null;
      item_id: number | null;
      conditions_en: string | null;
      conditions_ar: string | null;
      game_id: string | null;
    };
    indexes: { "by-pokemon": number; "by-game": string };
  };
  games: {
    key: string;
    value: {
      id: string;
      name_en: string;
      name_ar: string;
    };
  };
  pokemon_held_items: {
    key: number;
    value: {
      id: number;
      pokemon_id: number;
      item_id: number;
      hold_chance: number;
      game_id: string;
    };
    indexes: { "by-pokemon": number; "by-item": number };
  };
  sync_meta: {
    key: string;
    value: { key: string; lastSync: number };
  };
}

let dbPromise: Promise<IDBPDatabase<PokemonGuideDB>> | null = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PokemonGuideDB>("pokemon-guide-db", 5, {
      upgrade(db, oldVersion) {
        // Version 1 stores
        if (oldVersion < 1) {
          // Pokemon store
          const pokemonStore = db.createObjectStore("pokemon", { keyPath: "id" });
          pokemonStore.createIndex("by-name", "name_en");

          // Moves store
          const movesStore = db.createObjectStore("moves", { keyPath: "id" });
          movesStore.createIndex("by-type", "type");

          // Items store
          const itemsStore = db.createObjectStore("items", { keyPath: "id" });
          itemsStore.createIndex("by-category", "category");

          // Locations store
          db.createObjectStore("locations", { keyPath: "id" });

          // Encounters store
          const encountersStore = db.createObjectStore("encounters", { keyPath: "id" });
          encountersStore.createIndex("by-pokemon", "pokemon_id");
          encountersStore.createIndex("by-location", "location_id");

          // Gyms store
          const gymsStore = db.createObjectStore("gyms", { keyPath: "id" });
          gymsStore.createIndex("by-order", "badge_order");

          // Gym roster store
          const rosterStore = db.createObjectStore("gym_roster", { keyPath: "id" });
          rosterStore.createIndex("by-gym", "gym_id");

          // Sync metadata
          db.createObjectStore("sync_meta", { keyPath: "key" });
        }

        // Version 2: Add learnsets store
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains("learnsets")) {
            const learnsetsStore = db.createObjectStore("learnsets", { keyPath: "id" });
            learnsetsStore.createIndex("by-pokemon", "pokemon_id");
            learnsetsStore.createIndex("by-game", "game_id");
          }
        }

        // Version 3: Add NPCs store and update gyms with game index
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains("npcs")) {
            const npcsStore = db.createObjectStore("npcs", { keyPath: "id" });
            npcsStore.createIndex("by-category", "category");
          }

          // Add by-game index to gyms if upgrading
          if (db.objectStoreNames.contains("gyms")) {
            try {
              const tx = (db as any).transaction("gyms", "readwrite");
              const store = tx.objectStore("gyms");
              if (!store.indexNames.contains("by-game")) {
                store.createIndex("by-game", "game_id");
              }
            } catch (e) {
              // Index may already exist
            }
          }
        }

        // Version 4: Add evolution_nodes and games stores
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains("evolution_nodes")) {
            const evolutionStore = db.createObjectStore("evolution_nodes", { keyPath: "id" });
            evolutionStore.createIndex("by-pokemon", "pokemon_id");
            evolutionStore.createIndex("by-game", "game_id");
          }

          if (!db.objectStoreNames.contains("games")) {
            db.createObjectStore("games", { keyPath: "id" });
          }
        }

        // Version 5: Add pokemon_held_items store
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains("pokemon_held_items")) {
            const heldItemsStore = db.createObjectStore("pokemon_held_items", { keyPath: "id" });
            heldItemsStore.createIndex("by-pokemon", "pokemon_id");
            heldItemsStore.createIndex("by-item", "item_id");
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getLastSync(table: string): Promise<number | null> {
  const db = await getDB();
  const meta = await db.get("sync_meta", table);
  return meta?.lastSync || null;
}

export async function setLastSync(table: string): Promise<void> {
  const db = await getDB();
  await db.put("sync_meta", { key: table, lastSync: Date.now() });
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const storeNames = [
    "pokemon",
    "moves",
    "items",
    "locations",
    "encounters",
    "gyms",
    "gym_roster",
    "npcs",
    "learnsets",
    "evolution_nodes",
    "games",
    "pokemon_held_items",
    "sync_meta",
  ] as const;
  const tx = db.transaction(storeNames, "readwrite");
  await Promise.all([
    tx.objectStore("pokemon").clear(),
    tx.objectStore("moves").clear(),
    tx.objectStore("items").clear(),
    tx.objectStore("locations").clear(),
    tx.objectStore("encounters").clear(),
    tx.objectStore("gyms").clear(),
    tx.objectStore("gym_roster").clear(),
    tx.objectStore("npcs").clear(),
    tx.objectStore("learnsets").clear(),
    tx.objectStore("evolution_nodes").clear(),
    tx.objectStore("games").clear(),
    tx.objectStore("pokemon_held_items").clear(),
    tx.objectStore("sync_meta").clear(),
  ]);
  await tx.done;
}

// Get count of items in a specific store
export async function getStoreCount(
  storeName:
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
    | "pokemon_held_items",
): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(storeName);
  } catch {
    return 0;
  }
}
