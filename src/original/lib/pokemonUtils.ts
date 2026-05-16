/**
 * Pokemon utilities for favorites, notes, and discovery tracking
 */

const FAVORITES_KEY = "favoritePokemon";
const NOTES_KEY = "pokemonNotes";
const VIEWED_KEY = "viewedPokemon";

// ============ FAVORITES ============
export function getFavoritePokemon(): number[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleFavoritePokemon(pokemonId: number): boolean {
  const favorites = getFavoritePokemon();
  const index = favorites.indexOf(pokemonId);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(pokemonId);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return index === -1; // Returns true if now favorited
}

export function isPokemonFavorite(pokemonId: number): boolean {
  return getFavoritePokemon().includes(pokemonId);
}

// ============ NOTES ============
export function getPokemonNotes(): Record<number, string> {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getPokemonNote(pokemonId: number): string {
  return getPokemonNotes()[pokemonId] || "";
}

export function savePokemonNote(pokemonId: number, note: string): void {
  const notes = getPokemonNotes();
  if (note.trim()) {
    notes[pokemonId] = note;
  } else {
    delete notes[pokemonId];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function hasPokemonNote(pokemonId: number): boolean {
  return !!getPokemonNotes()[pokemonId];
}

// ============ VIEWED/DISCOVERED ============
export function getViewedPokemon(): number[] {
  try {
    const stored = localStorage.getItem(VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function markPokemonViewed(pokemonId: number): void {
  const viewed = getViewedPokemon();
  if (!viewed.includes(pokemonId)) {
    viewed.push(pokemonId);
    localStorage.setItem(VIEWED_KEY, JSON.stringify(viewed));
  }
}

export function isPokemonViewed(pokemonId: number): boolean {
  return getViewedPokemon().includes(pokemonId);
}

export function getViewedCount(): number {
  return getViewedPokemon().length;
}

// ============ DISCOVERY STATUS ============
export type PokemonDiscoveryStatus = "viewed" | "new";

export function getPokemonDiscoveryStatus(pokemonId: number): PokemonDiscoveryStatus {
  return isPokemonViewed(pokemonId) ? "viewed" : "new";
}

export function getDiscoveryStatusLabel(
  status: PokemonDiscoveryStatus,
  language: "ar" | "en",
): string {
  const labels: Record<PokemonDiscoveryStatus, { ar: string; en: string }> = {
    viewed: { ar: "تمت المشاهدة", en: "Viewed" },
    new: { ar: "جديد", en: "New" },
  };
  return labels[status][language];
}

export function getDiscoveryStatusColor(status: PokemonDiscoveryStatus): string {
  const colors: Record<PokemonDiscoveryStatus, string> = {
    viewed: "bg-green-500/20 text-green-400 border-green-500/30",
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return colors[status];
}

// ============ STATS ============
export interface PokemonExplorationStats {
  totalViewed: number;
  totalFavorites: number;
  totalNotes: number;
}

export function getPokemonExplorationStats(): PokemonExplorationStats {
  return {
    totalViewed: getViewedPokemon().length,
    totalFavorites: getFavoritePokemon().length,
    totalNotes: Object.keys(getPokemonNotes()).length,
  };
}
