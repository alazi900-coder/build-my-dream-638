// Audio cache for Pokemon cries
const AUDIO_CACHE_NAME = "pokemon-audio-cache-v1";

export type CryStyle = "latest" | "legacy";

// Get Pokemon cry URL from PokeAPI cries repository
export function getPokemonCryUrl(pokemonId: number, style: CryStyle = "latest"): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/${style}/${pokemonId}.ogg`;
}

// Check if audio is cached
export async function isAudioCached(url: string): Promise<boolean> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await cache.match(url);
    return !!response;
  } catch {
    return false;
  }
}

// Cache a single audio file
export async function cacheAudio(url: string): Promise<boolean> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      await cache.put(url, response);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Get audio from cache or fetch
export async function getAudio(url: string): Promise<Blob | null> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    let response = await cache.match(url);

    if (!response) {
      // Fetch and cache
      response = await fetch(url, { mode: "cors" });
      if (response.ok) {
        await cache.put(url, response.clone());
      } else {
        return null;
      }
    }

    return await response.blob();
  } catch {
    return null;
  }
}

// Precache multiple audio files with progress callback
export async function precacheAudioFiles(
  pokemonIds: number[],
  style: CryStyle = "latest",
  onProgress?: (done: number, total: number) => void,
): Promise<{ success: number; failed: number }> {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < pokemonIds.length; i++) {
    const url = getPokemonCryUrl(pokemonIds[i], style);

    try {
      // Check if already cached
      const existing = await cache.match(url);
      if (existing) {
        success++;
      } else {
        const response = await fetch(url, { mode: "cors" });
        if (response.ok) {
          await cache.put(url, response);
          success++;
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }

    onProgress?.(i + 1, pokemonIds.length);
  }

  return { success, failed };
}

// Get count of cached audio files
export async function getCachedAudioCount(): Promise<number> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

// Clear all cached audio
export async function clearAudioCache(): Promise<void> {
  try {
    await caches.delete(AUDIO_CACHE_NAME);
  } catch {
    // Ignore errors
  }
}

// Play a Pokemon cry
export async function playPokemonCry(
  pokemonId: number,
  style: CryStyle = "latest",
  volume: number = 0.5,
): Promise<HTMLAudioElement | null> {
  const url = getPokemonCryUrl(pokemonId, style);

  try {
    // Try to get from cache first
    const blob = await getAudio(url);

    if (blob) {
      const audio = new Audio(URL.createObjectURL(blob));
      audio.volume = volume;
      await audio.play();
      return audio;
    }

    // Fallback to direct URL
    const audio = new Audio(url);
    audio.volume = volume;
    await audio.play();
    return audio;
  } catch (error) {
    console.error("Failed to play Pokemon cry:", error);
    return null;
  }
}
