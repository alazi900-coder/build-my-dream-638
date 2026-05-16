// PokéAPI Integration Service
// Fetches data from https://pokeapi.co/api/v2/
// Images are for personal and educational use only

import {
  getArabicPokemonName,
  getArabicMoveName,
  getArabicItemName,
  getArabicAbilityName,
} from "@/original/data/arabicTranslations";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const RATE_LIMIT_DELAY = 100; // 100ms delay between requests

// Pokemon sprite URLs
export const getPokemonSprite = (id: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
};

export const getPokemonArtwork = (id: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};

export interface ImportProgress {
  current: number;
  total: number;
  phase: "pokemon" | "moves" | "items" | "abilities";
  message: string;
}

interface PokeAPIPokemon {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  sprites: {
    front_default: string | null;
    other: {
      "official-artwork": {
        front_default: string | null;
      };
    };
  };
}

interface PokeAPIMove {
  id: number;
  name: string;
  type: { name: string };
  damage_class: { name: string };
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect_entries: { effect: string; language: { name: string } }[];
}

interface PokeAPIItem {
  id: number;
  name: string;
  category: { name: string };
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  sprites: {
    default: string | null;
  };
}

// Helper to delay requests for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Format name: "pikachu" -> "Pikachu", "mr-mime" -> "Mr Mime"
const formatName = (name: string): string => {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Map stat names from API to our schema
const mapStats = (stats: PokeAPIPokemon["stats"]) => {
  const statMap: Record<string, number> = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };

  for (const stat of stats) {
    switch (stat.stat.name) {
      case "hp":
        statMap.hp = stat.base_stat;
        break;
      case "attack":
        statMap.atk = stat.base_stat;
        break;
      case "defense":
        statMap.def = stat.base_stat;
        break;
      case "special-attack":
        statMap.spa = stat.base_stat;
        break;
      case "special-defense":
        statMap.spd = stat.base_stat;
        break;
      case "speed":
        statMap.spe = stat.base_stat;
        break;
    }
  }

  return statMap;
};

// Map move category
const mapMoveCategory = (damageClass: string): string => {
  switch (damageClass) {
    case "physical":
      return "physical";
    case "special":
      return "special";
    default:
      return "status";
  }
};

// Fetch with retry logic
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (response.status === 429) {
        // Rate limited, wait longer
        await delay(2000 * (i + 1));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1));
    }
  }
  throw new Error("Max retries reached");
}

// Fetch a single Pokémon by ID
async function fetchPokemon(id: number): Promise<PokeAPIPokemon> {
  const response = await fetchWithRetry(`${POKEAPI_BASE}/pokemon/${id}`);
  return response.json();
}

// Fetch a single move by ID
async function fetchMove(id: number): Promise<PokeAPIMove> {
  const response = await fetchWithRetry(`${POKEAPI_BASE}/move/${id}`);
  return response.json();
}

// Fetch a single item by ID
async function fetchItem(id: number): Promise<PokeAPIItem> {
  const response = await fetchWithRetry(`${POKEAPI_BASE}/item/${id}`);
  return response.json();
}

// Import all Pokémon with Arabic translations
export async function importPokemon(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 151, // Default to Gen 1
): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    types: string[];
    abilities: { name_en: string; name_ar: string; is_hidden: boolean }[];
    stats: Record<string, number>;
    evolution: null;
    notes_en: string | null;
    notes_ar: string | null;
    tags: string[];
    available_in: string[];
  }[]
> {
  const pokemon = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "pokemon",
      message: `Fetching Pokémon ${id}/${limit}...`,
    });

    try {
      const data = await fetchPokemon(id);
      const englishName = formatName(data.name);

      const abilities = data.abilities.map((a) => {
        const abilityName = formatName(a.ability.name);
        return {
          name_en: abilityName,
          name_ar: getArabicAbilityName(abilityName),
          is_hidden: a.is_hidden,
        };
      });

      pokemon.push({
        id: data.id,
        name_en: englishName,
        name_ar: getArabicPokemonName(data.id, englishName),
        types: data.types.map((t) => t.type.name),
        abilities: abilities,
        stats: mapStats(data.stats),
        evolution: null,
        notes_en: null,
        notes_ar: null,
        tags: [],
        available_in: ["swsh"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Pokémon ${id}:`, error);
      // Continue with next Pokémon
    }
  }

  return pokemon;
}

// Import moves with Arabic translations
export async function importMoves(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 200,
): Promise<
  {
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
    learnset: never[];
  }[]
> {
  const moves = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "moves",
      message: `Fetching Move ${id}/${limit}...`,
    });

    try {
      const data = await fetchMove(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicMoveName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      moves.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        type: data.type.name,
        category: mapMoveCategory(data.damage_class.name),
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        effect_en: englishEffect?.effect || null,
        effect_ar: arabicData?.effect || null,
        learnset: [],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Move ${id}:`, error);
    }
  }

  return moves;
}

// Import items with Arabic translations
export async function importItems(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 100,
): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    category: string;
    effect_en: string | null;
    effect_ar: string | null;
    usage_en: string | null;
    usage_ar: string | null;
    obtain: never[];
  }[]
> {
  const items = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "items",
      message: `Fetching Item ${id}/${limit}...`,
    });

    try {
      const data = await fetchItem(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicItemName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      items.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        category: data.category.name,
        effect_en: englishEffect?.short_effect || null,
        effect_ar: arabicData?.effect || null,
        usage_en: null,
        usage_ar: null,
        obtain: [],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Item ${id}:`, error);
    }
  }

  return items;
}

// Full import function
export interface ImportConfig {
  pokemonLimit: number;
  movesLimit: number;
  itemsLimit: number;
}

export const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  pokemonLimit: 151, // Gen 1
  movesLimit: 200,
  itemsLimit: 100,
};

export const FULL_IMPORT_CONFIG: ImportConfig = {
  pokemonLimit: 898, // All Pokémon up to Gen 8
  movesLimit: 500,
  itemsLimit: 300,
};

// Fetch Galar Pokédex (Pokémon Shield) from PokéAPI
export async function fetchGalarPokedex(): Promise<number[]> {
  try {
    // Galar Pokédex ID is 27 in PokéAPI
    const response = await fetchWithRetry(`${POKEAPI_BASE}/pokedex/27`);
    const data = await response.json();

    // Extract Pokémon IDs from the pokedex entries
    const pokemonIds: number[] = data.pokemon_entries.map(
      (entry: { pokemon_species: { url: string } }) => {
        // URL format: https://pokeapi.co/api/v2/pokemon-species/{id}/
        const urlParts = entry.pokemon_species.url.split("/");
        return parseInt(urlParts[urlParts.length - 2]);
      },
    );

    return pokemonIds;
  } catch (error) {
    console.error("Failed to fetch Galar Pokédex:", error);
    return [];
  }
}

// Import only Pokémon from Galar Pokédex (Pokémon Shield)
export async function importGalarPokemon(onProgress: (progress: ImportProgress) => void): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    types: string[];
    abilities: { name_en: string; name_ar: string; is_hidden: boolean }[];
    stats: Record<string, number>;
    evolution: null;
    notes_en: string | null;
    notes_ar: string | null;
    tags: string[];
    available_in: string[];
  }[]
> {
  const pokemon = [];

  // First, get the list of Pokémon in Galar Pokédex
  onProgress({
    current: 0,
    total: 1,
    phase: "pokemon",
    message: "Fetching Galar Pokédex list...",
  });

  const galarPokemonIds = await fetchGalarPokedex();

  if (galarPokemonIds.length === 0) {
    throw new Error("Failed to fetch Galar Pokédex");
  }

  const total = galarPokemonIds.length;

  for (let i = 0; i < galarPokemonIds.length; i++) {
    const id = galarPokemonIds[i];

    onProgress({
      current: i + 1,
      total,
      phase: "pokemon",
      message: `Fetching Pokémon ${i + 1}/${total} (ID: ${id})...`,
    });

    try {
      const data = await fetchPokemon(id);
      const englishName = formatName(data.name);

      const abilities = data.abilities.map((a) => {
        const abilityName = formatName(a.ability.name);
        return {
          name_en: abilityName,
          name_ar: getArabicAbilityName(abilityName),
          is_hidden: a.is_hidden,
        };
      });

      pokemon.push({
        id: data.id,
        name_en: englishName,
        name_ar: getArabicPokemonName(data.id, englishName),
        types: data.types.map((t) => t.type.name),
        abilities: abilities,
        stats: mapStats(data.stats),
        evolution: null,
        notes_en: null,
        notes_ar: null,
        tags: [],
        available_in: ["swsh"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Pokémon ${id}:`, error);
    }
  }

  return pokemon;
}

// Import moves for Gen 8 (Sword/Shield)
export async function importSwshMoves(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 826, // Gen 8 moves
): Promise<
  {
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
    learnset: never[];
    available_in: string[];
  }[]
> {
  const moves = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "moves",
      message: `Fetching Move ${id}/${limit}...`,
    });

    try {
      const data = await fetchMove(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicMoveName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      moves.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        type: data.type.name,
        category: mapMoveCategory(data.damage_class.name),
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        effect_en: englishEffect?.effect || null,
        effect_ar: arabicData?.effect || null,
        learnset: [],
        available_in: ["swsh"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Move ${id}:`, error);
    }
  }

  return moves;
}

// Import items for Gen 8 (Sword/Shield)
export async function importSwshItems(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 500,
): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    category: string;
    effect_en: string | null;
    effect_ar: string | null;
    usage_en: string | null;
    usage_ar: string | null;
    obtain: never[];
    available_in: string[];
  }[]
> {
  const items = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "items",
      message: `Fetching Item ${id}/${limit}...`,
    });

    try {
      const data = await fetchItem(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicItemName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      items.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        category: data.category.name,
        effect_en: englishEffect?.short_effect || null,
        effect_ar: arabicData?.effect || null,
        usage_en: null,
        usage_ar: null,
        obtain: [],
        available_in: ["swsh"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Item ${id}:`, error);
    }
  }

  return items;
}

// Fetch Galar region locations
export async function importGalarLocations(onProgress: (progress: ImportProgress) => void): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    region: string;
    notes_en: string | null;
    notes_ar: string | null;
    available_in: string[];
  }[]
> {
  const locations = [];

  try {
    // Galar is region 8 in PokéAPI
    onProgress({
      current: 0,
      total: 1,
      phase: "items", // reusing phase for locations
      message: "Fetching Galar region...",
    });

    const response = await fetchWithRetry(`${POKEAPI_BASE}/region/8`);
    const region = await response.json();

    const total = region.locations.length;

    for (let i = 0; i < region.locations.length; i++) {
      const locUrl = region.locations[i].url;

      onProgress({
        current: i + 1,
        total,
        phase: "items",
        message: `Fetching Location ${i + 1}/${total}...`,
      });

      try {
        const locRes = await fetchWithRetry(locUrl);
        const locData = await locRes.json();

        // Try to find Arabic name
        const arabicName =
          locData.names?.find(
            (n: { language: { name: string }; name: string }) => n.language.name === "ar",
          )?.name || formatName(locData.name);

        locations.push({
          id: locData.id,
          name_en: formatName(locData.name),
          name_ar: arabicName,
          region: "Galar",
          notes_en: null,
          notes_ar: null,
          available_in: ["swsh"],
        });

        await delay(RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(`Failed to fetch location:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to fetch Galar region:", error);
  }

  return locations;
}

// ============ LET'S GO PIKACHU/EEVEE IMPORTS ============

// Fetch Kanto Pokédex (Let's Go Pikachu/Eevee) from PokéAPI
export async function fetchKantoPokedex(): Promise<number[]> {
  try {
    // Kanto Pokédex is the original 151 Pokemon + Meltan (808) and Melmetal (809)
    // Let's Go includes Gen 1 (1-151) + Alolan forms + Meltan/Melmetal
    const kantoIds: number[] = [];

    // Original 151 Pokemon
    for (let i = 1; i <= 151; i++) {
      kantoIds.push(i);
    }

    // Add Meltan and Melmetal (exclusive to Let's Go)
    kantoIds.push(808, 809);

    return kantoIds;
  } catch (error) {
    console.error("Failed to fetch Kanto Pokédex:", error);
    return [];
  }
}

// Import only Pokémon from Kanto Pokédex (Let's Go Pikachu/Eevee)
export async function importLetsGoPokemon(onProgress: (progress: ImportProgress) => void): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    types: string[];
    abilities: { name_en: string; name_ar: string; is_hidden: boolean }[];
    stats: Record<string, number>;
    evolution: null;
    notes_en: string | null;
    notes_ar: string | null;
    tags: string[];
    available_in: string[];
  }[]
> {
  const pokemon = [];

  onProgress({
    current: 0,
    total: 1,
    phase: "pokemon",
    message: "Fetching Kanto Pokédex list...",
  });

  const kantoPokemonIds = await fetchKantoPokedex();

  if (kantoPokemonIds.length === 0) {
    throw new Error("Failed to fetch Kanto Pokédex");
  }

  const total = kantoPokemonIds.length;

  for (let i = 0; i < kantoPokemonIds.length; i++) {
    const id = kantoPokemonIds[i];

    onProgress({
      current: i + 1,
      total,
      phase: "pokemon",
      message: `Fetching Pokémon ${i + 1}/${total} (ID: ${id})...`,
    });

    try {
      const data = await fetchPokemon(id);
      const englishName = formatName(data.name);

      const abilities = data.abilities.map((a) => {
        const abilityName = formatName(a.ability.name);
        return {
          name_en: abilityName,
          name_ar: getArabicAbilityName(abilityName),
          is_hidden: a.is_hidden,
        };
      });

      pokemon.push({
        id: data.id,
        name_en: englishName,
        name_ar: getArabicPokemonName(data.id, englishName),
        types: data.types.map((t) => t.type.name),
        abilities: abilities,
        stats: mapStats(data.stats),
        evolution: null,
        notes_en: null,
        notes_ar: null,
        tags: [],
        available_in: ["letsgo"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Pokémon ${id}:`, error);
    }
  }

  return pokemon;
}

// Import moves for Let's Go (Gen 1-7 moves that are available)
export async function importLetsGoMoves(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 400, // Gen 1-7 moves
): Promise<
  {
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
    learnset: never[];
    available_in: string[];
  }[]
> {
  const moves = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "moves",
      message: `Fetching Move ${id}/${limit}...`,
    });

    try {
      const data = await fetchMove(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicMoveName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      moves.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        type: data.type.name,
        category: mapMoveCategory(data.damage_class.name),
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        effect_en: englishEffect?.effect || null,
        effect_ar: arabicData?.effect || null,
        learnset: [],
        available_in: ["letsgo"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Move ${id}:`, error);
    }
  }

  return moves;
}

// Import items for Let's Go
export async function importLetsGoItems(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 300,
): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    category: string;
    effect_en: string | null;
    effect_ar: string | null;
    usage_en: string | null;
    usage_ar: string | null;
    obtain: never[];
    available_in: string[];
  }[]
> {
  const items = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "items",
      message: `Fetching Item ${id}/${limit}...`,
    });

    try {
      const data = await fetchItem(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicItemName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      items.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        category: data.category.name,
        effect_en: englishEffect?.short_effect || null,
        effect_ar: arabicData?.effect || null,
        usage_en: null,
        usage_ar: null,
        obtain: [],
        available_in: ["letsgo"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Item ${id}:`, error);
    }
  }

  return items;
}

// Fetch Kanto region locations
export async function importKantoLocations(onProgress: (progress: ImportProgress) => void): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    region: string;
    notes_en: string | null;
    notes_ar: string | null;
    available_in: string[];
  }[]
> {
  const locations = [];

  try {
    // Kanto is region 1 in PokéAPI
    onProgress({
      current: 0,
      total: 1,
      phase: "items",
      message: "Fetching Kanto region...",
    });

    const response = await fetchWithRetry(`${POKEAPI_BASE}/region/1`);
    const region = await response.json();

    const total = region.locations.length;

    for (let i = 0; i < region.locations.length; i++) {
      const locUrl = region.locations[i].url;

      onProgress({
        current: i + 1,
        total,
        phase: "items",
        message: `Fetching Location ${i + 1}/${total}...`,
      });

      try {
        const locRes = await fetchWithRetry(locUrl);
        const locData = await locRes.json();

        // Try to find Arabic name
        const arabicName =
          locData.names?.find(
            (n: { language: { name: string }; name: string }) => n.language.name === "ar",
          )?.name || formatName(locData.name);

        locations.push({
          id: locData.id,
          name_en: formatName(locData.name),
          name_ar: arabicName,
          region: "Kanto",
          notes_en: null,
          notes_ar: null,
          available_in: ["letsgo"],
        });

        await delay(RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(`Failed to fetch location:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to fetch Kanto region:", error);
  }

  return locations;
}

// ============ LEGENDS: ARCEUS IMPORTS ============

// Fetch Hisui Pokédex (Legends: Arceus)
export async function fetchHisuiPokedex(): Promise<number[]> {
  try {
    // Hisui Pokédex includes specific Pokemon + new Hisuian forms
    // Base Sinnoh Pokemon + new additions
    const hisuiIds: number[] = [];

    // Gen 1-4 Pokemon that appear in Legends Arceus (approximately 242 Pokemon)
    // This includes the Hisuian forms and new evolutions
    const hisuiPokemonList = [
      // Starters and their evolutions
      1,
      4,
      7, // Bulbasaur, Charmander, Squirtle lines (from space-time distortions)
      25,
      26, // Pikachu, Raichu
      35,
      36, // Clefairy, Clefable
      37,
      38, // Vulpix, Ninetales (including Alolan)
      41,
      42,
      169, // Zubat line
      46,
      47, // Paras, Parasect
      54,
      55, // Psyduck, Golduck
      58,
      59, // Growlithe, Arcanine (Hisuian)
      63,
      64,
      65, // Abra line
      66,
      67,
      68, // Machop line
      72,
      73, // Tentacool, Tentacruel
      74,
      75,
      76, // Geodude line
      77,
      78, // Ponyta, Rapidash
      81,
      82,
      462, // Magnemite line
      92,
      93,
      94, // Gastly line
      95,
      208, // Onix, Steelix
      108,
      463, // Lickitung, Lickilicky
      111,
      112,
      464, // Rhyhorn line
      113,
      242, // Chansey, Blissey
      114,
      465, // Tangela, Tangrowth
      122,
      439, // Mr. Mime, Mime Jr.
      123,
      212, // Scyther, Scizor (and Kleavor - 900)
      125,
      466, // Electabuzz, Electivire
      126,
      467, // Magmar, Magmortar
      129,
      130, // Magikarp, Gyarados
      133,
      134,
      135,
      136,
      196,
      197,
      470,
      471, // Eevee evolutions
      137,
      233,
      474, // Porygon line
      143, // Snorlax
      172,
      173,
      174,
      175,
      176, // Baby Pokemon
      185,
      438, // Sudowoodo, Bonsly
      190,
      424, // Aipom, Ambipom
      193,
      469, // Yanma, Yanmega
      198,
      430, // Murkrow, Honchkrow
      200,
      429, // Misdreavus, Mismagius
      201, // Unown
      207,
      472, // Gligar, Gliscor
      214, // Heracross
      215,
      461, // Sneasel, Weavile (and Sneasler - 903)
      216,
      217, // Teddiursa, Ursaring (and Ursaluna - 901)
      220,
      221,
      473, // Swinub line
      223,
      224, // Remoraid, Octillery
      226,
      458, // Mantine, Mantyke
      234, // Stantler (and Wyrdeer - 899)
      265,
      266,
      267,
      268,
      269, // Wurmple line
      280,
      281,
      282,
      475, // Ralts line
      299,
      476, // Nosepass, Probopass
      315,
      407, // Roselia, Roserade
      339,
      340, // Barboach, Whiscash
      355,
      356,
      477, // Duskull line
      358, // Chimecho
      361,
      362,
      478, // Snorunt line
      363,
      364,
      365, // Spheal line
      387,
      388,
      389, // Turtwig line
      390,
      391,
      392, // Chimchar line
      393,
      394,
      395, // Piplup line
      396,
      397,
      398, // Starly line
      399,
      400, // Bidoof, Bibarel
      401,
      402, // Kricketot, Kricketune
      403,
      404,
      405, // Shinx line
      406,
      315,
      407, // Budew line
      408,
      409, // Cranidos, Rampardos
      410,
      411, // Shieldon, Bastiodon
      412,
      413,
      414, // Burmy line
      415,
      416, // Combee, Vespiquen
      417, // Pachirisu
      418,
      419, // Buizel, Floatzel
      420,
      421, // Cherubi, Cherrim
      422,
      423, // Shellos, Gastrodon
      425,
      426, // Drifloon, Drifblim
      427,
      428, // Buneary, Lopunny
      431,
      432, // Glameow, Purugly
      433,
      358, // Chingling, Chimecho
      434,
      435, // Stunky, Skuntank
      436,
      437, // Bronzor, Bronzong
      440,
      113,
      242, // Happiny line
      441, // Chatot
      442, // Spiritomb
      443,
      444,
      445, // Gible line
      446,
      143, // Munchlax, Snorlax
      447,
      448, // Riolu, Lucario
      449,
      450, // Hippopotas, Hippowdon
      451,
      452, // Skorupi, Drapion
      453,
      454, // Croagunk, Toxicroak
      455, // Carnivine
      456,
      457, // Finneon, Lumineon
      459,
      460, // Snover, Abomasnow
      479, // Rotom
      480,
      481,
      482, // Lake trio
      483,
      484, // Dialga, Palkia (Origin forms)
      485, // Heatran
      486, // Regigigas
      487, // Giratina (Origin form)
      488, // Cresselia
      489,
      490, // Phione, Manaphy
      491, // Darkrai
      492, // Shaymin
      493, // Arceus
      // New Hisuian Pokemon (900+)
      // These need special handling as they're Hisuian forms
    ];

    // Remove duplicates and sort
    const uniqueIds = [...new Set(hisuiPokemonList)].sort((a, b) => a - b);
    return uniqueIds;
  } catch (error) {
    console.error("Failed to create Hisui Pokédex:", error);
    return [];
  }
}

// Import only Pokémon from Hisui Pokédex (Legends: Arceus)
export async function importArceusPokemon(onProgress: (progress: ImportProgress) => void): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    types: string[];
    abilities: { name_en: string; name_ar: string; is_hidden: boolean }[];
    stats: Record<string, number>;
    evolution: null;
    notes_en: string | null;
    notes_ar: string | null;
    tags: string[];
    available_in: string[];
  }[]
> {
  const pokemon = [];

  onProgress({
    current: 0,
    total: 1,
    phase: "pokemon",
    message: "Fetching Hisui Pokédex list...",
  });

  const hisuiPokemonIds = await fetchHisuiPokedex();

  if (hisuiPokemonIds.length === 0) {
    throw new Error("Failed to fetch Hisui Pokédex");
  }

  const total = hisuiPokemonIds.length;

  for (let i = 0; i < hisuiPokemonIds.length; i++) {
    const id = hisuiPokemonIds[i];

    onProgress({
      current: i + 1,
      total,
      phase: "pokemon",
      message: `Fetching Pokémon ${i + 1}/${total} (ID: ${id})...`,
    });

    try {
      const data = await fetchPokemon(id);
      const englishName = formatName(data.name);

      const abilities = data.abilities.map((a) => {
        const abilityName = formatName(a.ability.name);
        return {
          name_en: abilityName,
          name_ar: getArabicAbilityName(abilityName),
          is_hidden: a.is_hidden,
        };
      });

      pokemon.push({
        id: data.id,
        name_en: englishName,
        name_ar: getArabicPokemonName(data.id, englishName),
        types: data.types.map((t) => t.type.name),
        abilities: abilities,
        stats: mapStats(data.stats),
        evolution: null,
        notes_en: null,
        notes_ar: null,
        tags: [],
        available_in: ["arceus"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Pokémon ${id}:`, error);
    }
  }

  return pokemon;
}

// Import moves for Legends: Arceus
export async function importArceusMoves(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 300,
): Promise<
  {
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
    learnset: never[];
    available_in: string[];
  }[]
> {
  const moves = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "moves",
      message: `Fetching Move ${id}/${limit}...`,
    });

    try {
      const data = await fetchMove(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicMoveName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      moves.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        type: data.type.name,
        category: mapMoveCategory(data.damage_class.name),
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        effect_en: englishEffect?.effect || null,
        effect_ar: arabicData?.effect || null,
        learnset: [],
        available_in: ["arceus"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Move ${id}:`, error);
    }
  }

  return moves;
}

// Import items for Legends: Arceus
export async function importArceusItems(
  onProgress: (progress: ImportProgress) => void,
  limit: number = 250,
): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    category: string;
    effect_en: string | null;
    effect_ar: string | null;
    usage_en: string | null;
    usage_ar: string | null;
    obtain: never[];
    available_in: string[];
  }[]
> {
  const items = [];

  for (let id = 1; id <= limit; id++) {
    onProgress({
      current: id,
      total: limit,
      phase: "items",
      message: `Fetching Item ${id}/${limit}...`,
    });

    try {
      const data = await fetchItem(id);
      const englishName = formatName(data.name);
      const arabicData = getArabicItemName(data.id);
      const englishEffect = data.effect_entries.find((e) => e.language.name === "en");

      items.push({
        id: data.id,
        name_en: englishName,
        name_ar: arabicData?.name || englishName,
        category: data.category.name,
        effect_en: englishEffect?.short_effect || null,
        effect_ar: arabicData?.effect || null,
        usage_en: null,
        usage_ar: null,
        obtain: [],
        available_in: ["arceus"],
      });

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to fetch Item ${id}:`, error);
    }
  }

  return items;
}

// Fetch Hisui region locations
export async function importHisuiLocations(onProgress: (progress: ImportProgress) => void): Promise<
  {
    id: number;
    name_en: string;
    name_ar: string;
    region: string;
    notes_en: string | null;
    notes_ar: string | null;
    available_in: string[];
  }[]
> {
  // Hisui region locations (manually defined since PokéAPI doesn't have complete Hisui data)
  const hisuiLocations = [
    { id: 1001, name_en: "Jubilife Village", name_ar: "قرية جوبيلايف" },
    { id: 1002, name_en: "Obsidian Fieldlands", name_ar: "حقول الأوبسيديان" },
    { id: 1003, name_en: "Crimson Mirelands", name_ar: "مستنقعات القرمزي" },
    { id: 1004, name_en: "Cobalt Coastlands", name_ar: "شواطئ الكوبالت" },
    { id: 1005, name_en: "Coronet Highlands", name_ar: "مرتفعات كورونيت" },
    { id: 1006, name_en: "Alabaster Icelands", name_ar: "أراضي الثلج الأبيض" },
    { id: 1007, name_en: "Ancient Retreat", name_ar: "الملاذ القديم" },
    { id: 1008, name_en: "Training Grounds", name_ar: "أرض التدريب" },
    { id: 1009, name_en: "Space-Time Distortion", name_ar: "تشوه الزمكان" },
  ];

  const locations = [];
  const total = hisuiLocations.length;

  for (let i = 0; i < hisuiLocations.length; i++) {
    onProgress({
      current: i + 1,
      total,
      phase: "items",
      message: `Adding Location ${i + 1}/${total}...`,
    });

    locations.push({
      ...hisuiLocations[i],
      region: "Hisui",
      notes_en: null,
      notes_ar: null,
      available_in: ["arceus"],
    });

    await delay(50);
  }

  return locations;
}
