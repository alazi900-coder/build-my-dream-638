// Use the same cache name as sw.js for consistency
const SW_IMAGES_CACHE = "images-v1";
// Legacy cache name for backwards compatibility
const LEGACY_CACHE_NAME = "pokemon-images-v3";

const safeString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() !== "" ? value : fallback;

const safePositiveId = (value: unknown, fallback = 1): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * Get the image cache (prioritize SW cache, fallback to legacy)
 */
async function getCache(): Promise<Cache> {
  return await caches.open(SW_IMAGES_CACHE);
}

/**
 * Check both caches for an image
 */
async function findInCaches(url: string): Promise<Response | null> {
  // Check SW cache first
  const swCache = await caches.open(SW_IMAGES_CACHE);
  const swResponse = await swCache.match(url);
  if (swResponse) return swResponse;

  // Fallback to legacy cache
  const legacyCache = await caches.open(LEGACY_CACHE_NAME);
  return (await legacyCache.match(url)) ?? null;
}

/**
 * Cache a single image URL
 */
export async function cacheImage(url: string | null | undefined): Promise<boolean> {
  try {
    const safeUrl = safeString(url);
    if (!safeUrl) return false;

    const cache = await getCache();

    // Check if already cached
    const cached = await cache.match(safeUrl);
    if (cached) return true;

    // Fetch and cache the image
    const response = await fetch(safeUrl, { mode: "cors" });
    if (response.ok) {
      await cache.put(safeUrl, response.clone());
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to cache image: ${url}`, error);
    return false;
  }
}

/**
 * Get cached image as blob URL (for offline display)
 */
export async function getCachedImage(url: string | null | undefined): Promise<string | null> {
  try {
    const safeUrl = safeString(url);
    if (!safeUrl) return null;
    const response = await findInCaches(safeUrl);
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache multiple images with progress callback
 */
export async function cacheImages(
  urls: Array<string | null | undefined>,
  onProgress?: (done: number, total: number, currentUrl?: string) => void,
): Promise<{ success: number; failed: number }> {
  const cache = await getCache();
  let success = 0;
  let failed = 0;

  // Filter out empty/invalid URLs and already cached ones
  const validUrls = urls.map((url) => safeString(url)).filter(Boolean);
  const uncachedUrls: string[] = [];

  for (const url of validUrls) {
    const cached = await cache.match(url);
    if (cached) {
      success++;
    } else {
      uncachedUrls.push(url);
    }
  }

  // Report initial progress (already cached)
  onProgress?.(success, validUrls.length);

  // Download in batches to avoid overwhelming the browser
  const batchSize = 10;
  for (let i = 0; i < uncachedUrls.length; i += batchSize) {
    const batch = uncachedUrls.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const response = await fetch(url, { mode: "cors" });
        if (response.ok) {
          await cache.put(url, response.clone());
          return true;
        }
        throw new Error(`HTTP ${response.status}`);
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
      }
    }

    onProgress?.(success + failed, validUrls.length);
  }

  return { success, failed };
}

/**
 * Check if an image is cached
 */
export async function isCached(url: string | null | undefined): Promise<boolean> {
  try {
    const safeUrl = safeString(url);
    if (!safeUrl) return false;
    const response = await findInCaches(safeUrl);
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Get the number of cached images
 */
export async function getCachedImageCount(): Promise<number> {
  try {
    // Count from both caches
    const swCache = await caches.open(SW_IMAGES_CACHE);
    const swKeys = await swCache.keys();

    const legacyCache = await caches.open(LEGACY_CACHE_NAME);
    const legacyKeys = await legacyCache.keys();

    // Deduplicate by URL
    const allUrls = new Set([...swKeys.map((r) => r.url), ...legacyKeys.map((r) => r.url)]);

    return allUrls.size;
  } catch {
    return 0;
  }
}

/**
 * Get count of animated sprite images in cache
 */
export async function getAnimatedImageCount(): Promise<number> {
  try {
    const swCache = await caches.open(SW_IMAGES_CACHE);
    const keys = await swCache.keys();

    // Count only animated GIFs
    const animatedUrls = keys.filter(
      (r) => r.url.includes("/animated/") || r.url.includes("pokemonshowdown.com/sprites/ani"),
    );

    return animatedUrls.length;
  } catch {
    return 0;
  }
}

/**
 * Clear all cached images
 */
export async function clearImageCache(): Promise<void> {
  await Promise.all([caches.delete(SW_IMAGES_CACHE), caches.delete(LEGACY_CACHE_NAME)]);
}

/**
 * Generate Pokemon sprite URL (small icon)
 */
export function getPokemonSpriteUrl(pokemonId: number | null | undefined): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${safePositiveId(pokemonId)}.png`;
}

/**
 * Generate Pokemon artwork URL (higher quality)
 */
export function getPokemonArtworkUrl(pokemonId: number | null | undefined): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${safePositiveId(pokemonId)}.png`;
}

/**
 * Generate animated Pokemon sprite URL from PokeAPI (Gen 5 Black/White style)
 * Available for Pokemon 1-649 (Gen 1-5)
 */
export function getPokemonAnimatedSpriteUrl(pokemonId: number | null | undefined): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${safePositiveId(pokemonId)}.gif`;
}

/**
 * Generate animated Pokemon sprite URL from Showdown (wider coverage)
 * Works for all Pokemon including newer generations
 */
export function getPokemonShowdownSpriteUrl(pokemonName: string | null | undefined): string {
  const name = safeString(pokemonName, "missingno")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`;
}

/**
 * Generate shiny animated Pokemon sprite URL from Showdown
 */
export function getPokemonShowdownShinySpriteUrl(pokemonName: string | null | undefined): string {
  const name = safeString(pokemonName, "missingno")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `https://play.pokemonshowdown.com/sprites/ani-shiny/${name}.gif`;
}

/**
 * Generate item sprite URL
 */
export function getItemSpriteUrl(itemName: string | null | undefined): string {
  // Convert name to lowercase and replace spaces with hyphens
  const slug = safeString(itemName, "poke-ball")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
}

/**
 * Generate type icon URL (for move type icons)
 */
export function getMoveTypeIconUrl(typeName: string | null | undefined): string {
  const typeMap: Record<string, number> = {
    normal: 1,
    fighting: 2,
    flying: 3,
    poison: 4,
    ground: 5,
    rock: 6,
    bug: 7,
    ghost: 8,
    steel: 9,
    fire: 10,
    water: 11,
    grass: 12,
    electric: 13,
    psychic: 14,
    ice: 15,
    dragon: 16,
    dark: 17,
    fairy: 18,
  };
  const typeId = typeMap[safeString(typeName, "normal").toLowerCase()] || 1;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${typeId}.png`;
}

/**
 * Get trainer sprite URL from Showdown (most reliable CORS-friendly source)
 * Maps trainer names to their sprite files
 */
export function getTrainerSpriteUrl(trainerName: string | null | undefined): string {
  // Map common trainer names to their Showdown sprite filenames
  const nameMap: Record<string, string> = {
    // === Kanto Gym Leaders ===
    brock: "brock",
    misty: "misty",
    "lt. surge": "lt-surge",
    "lt surge": "lt-surge",
    surge: "lt-surge",
    erika: "erika",
    koga: "koga",
    sabrina: "sabrina",
    blaine: "blaine",
    giovanni: "giovanni",

    // === Johto Gym Leaders ===
    falkner: "falkner",
    bugsy: "bugsy",
    whitney: "whitney",
    morty: "morty",
    chuck: "chuck",
    jasmine: "jasmine",
    pryce: "pryce",
    clair: "clair",

    // === Hoenn Gym Leaders ===
    roxanne: "roxanne",
    brawly: "brawly",
    wattson: "wattson",
    flannery: "flannery",
    norman: "norman",
    winona: "winona",
    tate: "tate",
    liza: "liza",
    juan: "juan",
    wallace: "wallace",

    // === Sinnoh Gym Leaders ===
    roark: "roark",
    gardenia: "gardenia",
    maylene: "maylene",
    "crasher wake": "crasherwake",
    fantina: "fantina",
    byron: "byron",
    candice: "candice",
    volkner: "volkner",

    // === Unova Gym Leaders ===
    cilan: "cilan",
    chili: "chili",
    cress: "cress",
    lenora: "lenora",
    burgh: "burgh",
    elesa: "elesa",
    clay: "clay",
    skyla: "skyla",
    brycen: "brycen",
    drayden: "drayden",
    iris: "iris",
    roxie: "roxie",
    marlon: "marlon",

    // === Kalos Gym Leaders ===
    viola: "viola",
    grant: "grant",
    korrina: "korrina",
    ramos: "ramos",
    clemont: "clemont",
    valerie: "valerie",
    olympia: "olympia",
    wulfric: "wulfric",

    // === Alola Trial Captains & Kahunas ===
    ilima: "ilima",
    lana: "lana",
    kiawe: "kiawe",
    mallow: "mallow",
    sophocles: "sophocles",
    acerola: "acerola",
    mina: "mina",
    hala: "hala",
    olivia: "olivia",
    nanu: "nanu",
    hapu: "hapu",

    // === Galar Gym Leaders ===
    milo: "milo",
    nessa: "nessa",
    kabu: "kabu",
    bea: "bea",
    allister: "allister",
    opal: "opal",
    gordie: "gordie",
    melony: "melony",
    piers: "piers",
    raihan: "raihan",

    // === Paldea Gym Leaders ===
    katy: "katy",
    brassius: "brassius",
    iono: "iono",
    kofu: "kofu",
    larry: "larry",
    ryme: "ryme",
    tulip: "tulip",
    grusha: "grusha",

    // === Champions ===
    lance: "lance",
    steven: "steven",
    cynthia: "cynthia",
    alder: "alder",
    diantha: "diantha",
    leon: "leon",
    geeta: "geeta",

    // === Elite Four ===
    lorelei: "lorelei",
    bruno: "bruno",
    agatha: "agatha",
    will: "will",
    karen: "karen",
    sidney: "sidney",
    phoebe: "phoebe",
    glacia: "glacia",
    drake: "drake",
    aaron: "aaron",
    bertha: "bertha",
    flint: "flint",
    lucian: "lucian",
    shauntal: "shauntal",
    marshal: "marshal",
    grimsley: "grimsley",
    caitlin: "caitlin",
    malva: "malva",
    siebold: "siebold",
    wikstrom: "wikstrom",
    drasna: "drasna",
    molayne: "molayne",
    kahili: "kahili",
    rika: "rika",
    poppy: "poppy",
    hassel: "hassel",

    // === Rivals & Protagonists ===
    red: "red",
    blue: "blue",
    green: "green",
    silver: "silver",
    brendan: "brendan",
    may: "may",
    wally: "wally",
    dawn: "dawn",
    lucas: "lucas",
    barry: "barry",
    hilbert: "hilbert",
    hilda: "hilda",
    cheren: "cheren",
    bianca: "bianca",
    nate: "nate",
    rosa: "rosa",
    hugh: "hugh",
    calem: "calem",
    serena: "serena",
    shauna: "shauna",
    tierno: "tierno",
    trevor: "trevor",
    elio: "elio",
    selene: "selene",
    hau: "hau",
    gladion: "gladion",
    victor: "victor",
    gloria: "gloria",
    hop: "hop",
    bede: "bede",
    marnie: "marnie",
    nemona: "nemona",
    arven: "arven",
    penny: "penny",
    florian: "florian",
    juliana: "juliana",

    // === Professors ===
    oak: "oak",
    "professor oak": "oak",
    elm: "elm",
    "professor elm": "elm",
    birch: "birch",
    "professor birch": "birch",
    rowan: "rowan",
    "professor rowan": "rowan",
    juniper: "juniper",
    "professor juniper": "juniper",
    sycamore: "sycamore",
    "professor sycamore": "sycamore",
    kukui: "kukui",
    "professor kukui": "kukui",
    magnolia: "magnolia",
    "professor magnolia": "magnolia",
    sonia: "sonia",
    clavell: "clavell",
    "director clavell": "clavell",
    sada: "sada",
    "professor sada": "sada",
    turo: "turo",
    "professor turo": "turo",

    // === Villains ===
    n: "n",
    ghetsis: "ghetsis",
    colress: "colress",
    lysandre: "lysandre",
    lusamine: "lusamine",
    guzma: "guzma",
    plumeria: "plumeria",
    rose: "rose",
    oleana: "oleana",
    cyrus: "cyrus",
    maxie: "maxie",
    archie: "archie",

    // === Other Important NPCs ===
    lillie: "lillie",
    looker: "looker",
    lucy: "lucy",
    brandon: "brandon",
    tucker: "tucker",
    greta: "greta",
    spenser: "spenser",
    noland: "noland",
    anabel: "anabel",
    palmer: "palmer",
    thorton: "thorton",
    dahlia: "dahlia",
    darach: "darach",
    argenta: "argenta",
  };

  const normalizedName = safeString(trainerName, "trainer").toLowerCase().trim();
  const spriteName = nameMap[normalizedName];

  if (spriteName) {
    return `https://play.pokemonshowdown.com/sprites/trainers/${spriteName}.png`;
  }

  // Fallback: try the name as-is (lowercase, no spaces)
  const fallbackName = normalizedName.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return `https://play.pokemonshowdown.com/sprites/trainers/${fallbackName}.png`;
}

/**
 * Get multiple fallback URLs for a trainer (for fallback chain)
 */
export function getTrainerFallbackUrls(trainerName: string | null | undefined): string[] {
  const normalizedName = safeString(trainerName, "trainer").toLowerCase().trim();
  const noSpaces = normalizedName.replace(/\s+/g, "");
  const withHyphens = normalizedName.replace(/\s+/g, "-");

  return [
    // Showdown trainers (most reliable)
    `https://play.pokemonshowdown.com/sprites/trainers/${noSpaces}.png`,
    `https://play.pokemonshowdown.com/sprites/trainers/${withHyphens}.png`,
    // PokeAPI trainers
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/${noSpaces}.png`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/${withHyphens}.png`,
  ];
}

/**
 * Get a fallback NPC image placeholder (SVG data URL)
 */
export function getNPCPlaceholderUrl(): string {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiMzNzQxNTEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIxOCIgZmlsbD0iIzZCNzI4MCIvPjxwYXRoIGQ9Ik0yMCA4NUMyMCA2OC40MzE1IDMzLjQzMTUgNTUgNTAgNTVDNjYuNTY4NSA1NSA4MCA2OC40MzE1IDgwIDg1VjEwMEgyMFY4NVoiIGZpbGw9IiM2Qjc1ODAiLz48L3N2Zz4=";
}

/**
 * Get a Pokemon placeholder (for missing images)
 */
export function getPokemonPlaceholderUrl(): string {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI0OCIgY3k9IjQ4IiByPSI0NCIgc3Ryb2tlPSIjNjQ3NDhCIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz48bGluZSB4MT0iNCIgeTE9IjQ4IiB4Mj0iOTIiIHkyPSI0OCIgc3Ryb2tlPSIjNjQ3NDhCIiBzdHJva2Utd2lkdGg9IjQiLz48Y2lyY2xlIGN4PSI0OCIgY3k9IjQ4IiByPSIxMiIgc3Ryb2tlPSIjNjQ3NDhCIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9IiM2NDc0OEIiLz48Y2lyY2xlIGN4PSI0OCIgY3k9IjQ4IiByPSI2IiBmaWxsPSIjMUUyOTNGIi8+PC9zdmc+";
}

/**
 * Get an item placeholder
 */
export function getItemPlaceholderUrl(): string {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI4IiBzdHJva2U9IiM2NDc0OEIiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjgiIGZpbGw9IiM2NDc0OEIiLz48L3N2Zz4=";
}

/**
 * Collect all image URLs that need to be cached for offline use
 */
export function collectAllImageUrls(data: {
  pokemon: { id: number | null | undefined }[];
  items: { name_en: string | null | undefined }[];
  npcs: { image_url: string | null | undefined }[];
  locations: { map_image_url?: string | null }[];
}): string[] {
  const urls: string[] = [];

  // Pokemon sprites (small icons)
  data.pokemon.forEach((p) => {
    urls.push(getPokemonSpriteUrl(p.id));
  });

  // Pokemon artwork (high quality for detail pages)
  data.pokemon.forEach((p) => {
    urls.push(getPokemonArtworkUrl(p.id));
  });

  // Item sprites
  data.items.forEach((item) => {
    urls.push(getItemSpriteUrl(item.name_en));
  });

  // NPC images
  data.npcs.forEach((npc) => {
    if (npc.image_url) {
      urls.push(npc.image_url);
    }
  });

  // Location/map images
  data.locations.forEach((loc) => {
    if (loc.map_image_url) {
      urls.push(loc.map_image_url);
    }
  });

  // Move type icons (all 18 types)
  const types = [
    "normal",
    "fighting",
    "flying",
    "poison",
    "ground",
    "rock",
    "bug",
    "ghost",
    "steel",
    "fire",
    "water",
    "grass",
    "electric",
    "psychic",
    "ice",
    "dragon",
    "dark",
    "fairy",
  ];
  types.forEach((type) => {
    urls.push(getMoveTypeIconUrl(type));
  });

  // Dedupe
  return [...new Set(urls)];
}

/**
 * Collect URLs for a specific section
 */
export function collectSectionImageUrls(
  section: "pokemon" | "items" | "gyms" | "maps",
  data: {
    pokemon?: { id: number | null | undefined }[];
    items?: { name_en: string | null | undefined }[];
    npcs?: { image_url: string | null | undefined }[];
    locations?: { map_image_url?: string | null }[];
  },
): string[] {
  const urls: string[] = [];

  switch (section) {
    case "pokemon":
      if (data.pokemon) {
        data.pokemon.forEach((p) => {
          urls.push(getPokemonSpriteUrl(p.id));
          urls.push(getPokemonArtworkUrl(p.id));
        });
      }
      break;
    case "items":
      if (data.items) {
        data.items.forEach((item) => {
          urls.push(getItemSpriteUrl(item.name_en));
        });
      }
      break;
    case "gyms":
      if (data.npcs) {
        data.npcs.forEach((npc) => {
          if (npc.image_url) {
            urls.push(npc.image_url);
          }
        });
      }
      break;
    case "maps":
      if (data.locations) {
        data.locations.forEach((loc) => {
          if (loc.map_image_url) {
            urls.push(loc.map_image_url);
          }
        });
      }
      // Add move type icons
      const types = [
        "normal",
        "fighting",
        "flying",
        "poison",
        "ground",
        "rock",
        "bug",
        "ghost",
        "steel",
        "fire",
        "water",
        "grass",
        "electric",
        "psychic",
        "ice",
        "dragon",
        "dark",
        "fairy",
      ];
      types.forEach((type) => {
        urls.push(getMoveTypeIconUrl(type));
      });
      break;
  }

  return [...new Set(urls)];
}
