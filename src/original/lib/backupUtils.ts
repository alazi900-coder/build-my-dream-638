import { getDB, getStoreCount } from "./db";

// Use the same cache names as sw.js and imageCache.ts
const PRIMARY_IMAGE_CACHE = "images-v1";
const LEGACY_IMAGE_CACHE = "pokemon-images-v3";
const AUDIO_CACHE_NAME = "pokemon-audio-cache-v1";

export interface BackupData {
  version: string;
  exportDate: string;
  appVersion: string;
  data: {
    pokemon: any[];
    moves: any[];
    items: any[];
    locations: any[];
    encounters: any[];
    gyms: any[];
    gym_roster: any[];
    npcs: any[];
    learnsets: any[];
    evolution_nodes: any[];
    games: any[];
  };
  images?: {
    [url: string]: string; // URL -> base64 data
  };
  audio?: {
    [url: string]: string; // URL -> base64 data
  };
  metadata: {
    totalItems: number;
    tables: string[];
    includesImages?: boolean;
    imageCount?: number;
    includesAudio?: boolean;
    audioCount?: number;
  };
}

export interface FullExportStats {
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
  staticImages: number;
  animatedImages: number;
  audioFiles: number;
  estimatedSizeMB: number;
}

const BACKUP_VERSION = "1.3";
const APP_VERSION = "1.3.0";

const DATA_STORES = [
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
] as const;

type DataStoreName = (typeof DATA_STORES)[number];

export async function exportAllData(
  options: { includeImages?: boolean; includeAudio?: boolean } = {},
  onProgress?: (current: number, total: number, phase: "images" | "audio") => void,
): Promise<BackupData> {
  const { includeImages = false, includeAudio = false } = options;
  const db = await getDB();

  const data: BackupData["data"] = {
    pokemon: [],
    moves: [],
    items: [],
    locations: [],
    encounters: [],
    gyms: [],
    gym_roster: [],
    npcs: [],
    learnsets: [],
    evolution_nodes: [],
    games: [],
  };

  let totalItems = 0;

  for (const storeName of DATA_STORES) {
    const items = await db.getAll(storeName);
    data[storeName] = items;
    totalItems += items.length;
  }

  let images: BackupData["images"] | undefined;
  let imageCount = 0;
  let audio: BackupData["audio"] | undefined;
  let audioCount = 0;

  if (includeImages) {
    images = await exportCachedImages((c, t) => onProgress?.(c, t, "images"));
    imageCount = Object.keys(images).length;
  }

  if (includeAudio) {
    audio = await exportCachedAudio((c, t) => onProgress?.(c, t, "audio"));
    audioCount = Object.keys(audio).length;
  }

  return {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    appVersion: APP_VERSION,
    data,
    images,
    audio,
    metadata: {
      totalItems,
      tables: [...DATA_STORES],
      includesImages: includeImages,
      imageCount,
      includesAudio: includeAudio,
      audioCount,
    },
  };
}

async function exportCachedImages(
  onProgress?: (current: number, total: number) => void,
): Promise<{ [url: string]: string }> {
  const images: { [url: string]: string } = {};
  const processedUrls = new Set<string>();

  try {
    // Collect all keys from both caches
    const allRequests: Request[] = [];

    // Primary cache (images-v1)
    try {
      const primaryCache = await caches.open(PRIMARY_IMAGE_CACHE);
      const primaryKeys = await primaryCache.keys();
      console.log(
        `[Backup] Found ${primaryKeys.length} images in primary cache (${PRIMARY_IMAGE_CACHE})`,
      );
      allRequests.push(...primaryKeys);
    } catch (e) {
      console.warn("[Backup] Could not read primary cache:", e);
    }

    // Legacy cache (pokemon-images-v3)
    try {
      const legacyCache = await caches.open(LEGACY_IMAGE_CACHE);
      const legacyKeys = await legacyCache.keys();
      console.log(
        `[Backup] Found ${legacyKeys.length} images in legacy cache (${LEGACY_IMAGE_CACHE})`,
      );
      allRequests.push(...legacyKeys);
    } catch (e) {
      console.warn("[Backup] Could not read legacy cache:", e);
    }

    const total = allRequests.length;
    let current = 0;
    console.log(`[Backup] Total images to export: ${total}`);

    for (const request of allRequests) {
      // Skip duplicates
      if (processedUrls.has(request.url)) {
        current++;
        onProgress?.(current, total);
        continue;
      }

      try {
        // Try primary cache first, then legacy
        let response: Response | undefined;
        const primaryCache = await caches.open(PRIMARY_IMAGE_CACHE);
        response = await primaryCache.match(request);

        if (!response) {
          const legacyCache = await caches.open(LEGACY_IMAGE_CACHE);
          response = await legacyCache.match(request);
        }

        if (response) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          images[request.url] = base64;
          processedUrls.add(request.url);
        }
      } catch (e) {
        console.warn(`Failed to export image: ${request.url}`, e);
      }
      current++;
      onProgress?.(current, total);
    }

    console.log(`[Backup] Successfully exported ${Object.keys(images).length} unique images`);
  } catch (e) {
    console.error("Failed to export images:", e);
  }

  return images;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function importCachedImages(
  images: { [url: string]: string },
  onProgress?: (current: number, total: number) => void,
): Promise<number> {
  let imported = 0;

  try {
    // Import to primary cache only
    const cache = await caches.open(PRIMARY_IMAGE_CACHE);
    const urls = Object.keys(images);
    const total = urls.length;
    let current = 0;

    console.log(`[Backup] Importing ${total} images to ${PRIMARY_IMAGE_CACHE}`);

    for (const url of urls) {
      try {
        const base64Data = images[url];
        const response = await fetch(base64Data);
        const blob = await response.blob();
        await cache.put(
          url,
          new Response(blob, {
            headers: { "Content-Type": blob.type },
          }),
        );
        imported++;
      } catch (e) {
        console.warn(`Failed to import image: ${url}`, e);
      }
      current++;
      onProgress?.(current, total);
    }

    console.log(`[Backup] Successfully imported ${imported} images`);
  } catch (e) {
    console.error("Failed to import images:", e);
  }

  return imported;
}

async function exportCachedAudio(
  onProgress?: (current: number, total: number) => void,
): Promise<{ [url: string]: string }> {
  const audioFiles: { [url: string]: string } = {};

  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const keys = await cache.keys();
    const total = keys.length;
    let current = 0;

    for (const request of keys) {
      try {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          audioFiles[request.url] = base64;
        }
      } catch (e) {
        console.warn(`Failed to export audio: ${request.url}`, e);
      }
      current++;
      onProgress?.(current, total);
    }
  } catch (e) {
    console.error("Failed to export audio:", e);
  }

  return audioFiles;
}

async function importCachedAudio(
  audioFiles: { [url: string]: string },
  onProgress?: (current: number, total: number) => void,
): Promise<number> {
  let imported = 0;

  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const urls = Object.keys(audioFiles);
    const total = urls.length;
    let current = 0;

    for (const url of urls) {
      try {
        const base64Data = audioFiles[url];
        const response = await fetch(base64Data);
        const blob = await response.blob();
        await cache.put(
          url,
          new Response(blob, {
            headers: { "Content-Type": blob.type },
          }),
        );
        imported++;
      } catch (e) {
        console.warn(`Failed to import audio: ${url}`, e);
      }
      current++;
      onProgress?.(current, total);
    }
  } catch (e) {
    console.error("Failed to import audio:", e);
  }

  return imported;
}

export async function getCachedImageCount(): Promise<number> {
  try {
    const processedUrls = new Set<string>();

    // Count from primary cache
    try {
      const primaryCache = await caches.open(PRIMARY_IMAGE_CACHE);
      const primaryKeys = await primaryCache.keys();
      primaryKeys.forEach((req) => processedUrls.add(req.url));
    } catch (e) {
      console.warn("[Backup] Could not count primary cache:", e);
    }

    // Count from legacy cache (avoid duplicates)
    try {
      const legacyCache = await caches.open(LEGACY_IMAGE_CACHE);
      const legacyKeys = await legacyCache.keys();
      legacyKeys.forEach((req) => processedUrls.add(req.url));
    } catch (e) {
      console.warn("[Backup] Could not count legacy cache:", e);
    }

    return processedUrls.size;
  } catch {
    return 0;
  }
}

export async function getCachedAudioCount(): Promise<number> {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

export interface ImportOptions {
  selectedTables?: string[];
  includeImages?: boolean;
  includeAudio?: boolean;
}

export async function importAllData(
  backup: BackupData,
  onProgress?: (current: number, total: number, phase: "data" | "images" | "audio") => void,
  options?: ImportOptions,
): Promise<{
  success: boolean;
  imported: number;
  imagesImported: number;
  audioImported: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let imported = 0;
  let imagesImported = 0;
  let audioImported = 0;

  // Determine which tables to import
  const tablesToImport =
    options?.selectedTables && options.selectedTables.length > 0
      ? DATA_STORES.filter((store) => options.selectedTables!.includes(store))
      : DATA_STORES;

  // Determine if we should import images/audio (default to true if present in backup)
  const shouldImportImages = options?.includeImages ?? true;
  const shouldImportAudio = options?.includeAudio ?? true;

  try {
    const db = await getDB();

    // Clear only selected tables
    const tx = db.transaction(tablesToImport, "readwrite");
    for (const storeName of tablesToImport) {
      await tx.objectStore(storeName).clear();
    }
    await tx.done;

    // Import new data only for selected tables
    let totalDataItems = 0;
    for (const storeName of tablesToImport) {
      const items = backup.data[storeName];
      totalDataItems += items?.length || 0;
    }
    let currentItem = 0;

    for (const storeName of tablesToImport) {
      const items = backup.data[storeName];
      if (items && Array.isArray(items)) {
        const importTx = db.transaction(storeName, "readwrite");
        const store = importTx.objectStore(storeName);

        for (const item of items) {
          try {
            await store.put(item);
            imported++;
          } catch (e) {
            errors.push(`Error importing ${storeName} item ${item.id}: ${e}`);
          }
          currentItem++;
          onProgress?.(currentItem, totalDataItems, "data");
        }
        await importTx.done;
      }
    }

    // Update sync metadata only for imported tables
    const syncTx = db.transaction("sync_meta", "readwrite");
    for (const storeName of tablesToImport) {
      await syncTx.objectStore("sync_meta").put({
        key: storeName,
        lastSync: Date.now(),
      });
    }
    await syncTx.done;

    // Import images if present and selected
    if (shouldImportImages && backup.images && Object.keys(backup.images).length > 0) {
      imagesImported = await importCachedImages(backup.images, (current, total) =>
        onProgress?.(current, total, "images"),
      );
    }

    // Import audio if present and selected
    if (shouldImportAudio && backup.audio && Object.keys(backup.audio).length > 0) {
      audioImported = await importCachedAudio(backup.audio, (current, total) =>
        onProgress?.(current, total, "audio"),
      );
    }

    return { success: true, imported, imagesImported, audioImported, errors };
  } catch (e) {
    errors.push(`Critical error during import: ${e}`);
    return { success: false, imported, imagesImported, audioImported, errors };
  }
}

export async function exportToFile(backup: BackupData, compress: boolean = false): Promise<void> {
  const jsonString = JSON.stringify(backup);
  const date = new Date().toISOString().split("T")[0];

  if (compress) {
    const compressedData = await compressData(jsonString);
    const blob = new Blob([compressedData], { type: "application/gzip" });
    const url = URL.createObjectURL(blob);
    const filename = `pokemon-guide-backup-${date}.json.gz`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const filename = `pokemon-guide-backup-${date}.json`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

async function compressData(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const inputData = encoder.encode(data);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(inputData);
      controller.close();
    },
  });

  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
  const reader = compressedStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer as ArrayBuffer;
}

async function decompressData(data: ArrayBuffer): Promise<string> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(data));
      controller.close();
    },
  });

  const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
  const reader = decompressedStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(result);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  info?: {
    version: string;
    exportDate: string;
    totalItems: number;
    tables: string[];
    includesImages?: boolean;
    imageCount?: number;
    includesAudio?: boolean;
    audioCount?: number;
  };
}

export function validateBackupFile(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid file format"] };
  }

  const backup = data as Partial<BackupData>;

  if (!backup.version) {
    errors.push("Missing backup version");
  }

  if (!backup.exportDate) {
    errors.push("Missing export date");
  }

  if (!backup.data || typeof backup.data !== "object") {
    errors.push("Missing or invalid data section");
    return { valid: false, errors };
  }

  // Check required tables
  for (const storeName of DATA_STORES) {
    if (!Array.isArray(backup.data[storeName])) {
      errors.push(`Missing or invalid table: ${storeName}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    info: {
      version: backup.version!,
      exportDate: backup.exportDate!,
      totalItems: backup.metadata?.totalItems || 0,
      tables: backup.metadata?.tables || [],
      includesImages: backup.metadata?.includesImages || false,
      imageCount:
        backup.metadata?.imageCount || (backup.images ? Object.keys(backup.images).length : 0),
      includesAudio: backup.metadata?.includesAudio || false,
      audioCount:
        backup.metadata?.audioCount || (backup.audio ? Object.keys(backup.audio).length : 0),
    },
  };
}

export async function getBackupStats(): Promise<{
  totalItems: number;
  tables: { name: string; count: number }[];
}> {
  const tables: { name: string; count: number }[] = [];
  let totalItems = 0;

  for (const storeName of DATA_STORES) {
    const count = await getStoreCount(storeName);
    tables.push({ name: storeName, count });
    totalItems += count;
  }

  return { totalItems, tables };
}

export async function parseBackupFile(file: File): Promise<unknown> {
  const isCompressed = file.name.endsWith(".gz");

  if (isCompressed) {
    const arrayBuffer = await file.arrayBuffer();
    const jsonString = await decompressData(arrayBuffer);
    return JSON.parse(jsonString);
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error("Invalid JSON file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }
}

// ============ Cache Diagnostics ============

export interface CacheDiagnostics {
  caches: {
    name: string;
    itemCount: number;
    items: { url: string; type: string; size?: number }[];
    estimatedSize: number;
  }[];
  summary: {
    totalImages: number;
    animatedImages: number;
    staticImages: number;
    audioFiles: number;
    totalSize: number;
  };
}

export async function diagnoseCaches(): Promise<CacheDiagnostics> {
  const result: CacheDiagnostics = {
    caches: [],
    summary: {
      totalImages: 0,
      animatedImages: 0,
      staticImages: 0,
      audioFiles: 0,
      totalSize: 0,
    },
  };

  const cacheNames = [
    { name: PRIMARY_IMAGE_CACHE, type: "images" },
    { name: LEGACY_IMAGE_CACHE, type: "images" },
    { name: AUDIO_CACHE_NAME, type: "audio" },
    { name: "static-v1", type: "static" },
    { name: "api-v1", type: "api" },
  ];

  for (const { name, type } of cacheNames) {
    try {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const items: { url: string; type: string; size?: number }[] = [];
      let estimatedSize = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        let size = 0;
        let itemType = "unknown";

        if (response) {
          const blob = await response.clone().blob();
          size = blob.size;
          estimatedSize += size;
          itemType = blob.type || "unknown";
        }

        const url = request.url;
        items.push({ url, type: itemType, size });

        // Categorize
        if (type === "images") {
          result.summary.totalImages++;
          if (url.includes("/ani/") || (url.includes("showdown") && url.includes(".gif"))) {
            result.summary.animatedImages++;
          } else {
            result.summary.staticImages++;
          }
        } else if (type === "audio") {
          result.summary.audioFiles++;
        }
      }

      result.summary.totalSize += estimatedSize;
      result.caches.push({
        name,
        itemCount: keys.length,
        items,
        estimatedSize,
      });
    } catch (e) {
      console.warn(`Could not access cache: ${name}`, e);
      result.caches.push({
        name,
        itemCount: 0,
        items: [],
        estimatedSize: 0,
      });
    }
  }

  return result;
}

// ============ Animated Images Export ============

export async function getAnimatedImageCount(): Promise<number> {
  let count = 0;

  try {
    const cacheNames = [PRIMARY_IMAGE_CACHE, LEGACY_IMAGE_CACHE];
    const processedUrls = new Set<string>();

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          if (processedUrls.has(request.url)) continue;
          processedUrls.add(request.url);

          // Check if animated (showdown sprites or .gif)
          if (
            request.url.includes("/ani/") ||
            request.url.includes("/ani-back/") ||
            (request.url.includes("showdown") && request.url.endsWith(".gif"))
          ) {
            count++;
          }
        }
      } catch (e) {
        console.warn(`Could not count animated images in ${cacheName}:`, e);
      }
    }
  } catch (e) {
    console.error("Failed to count animated images:", e);
  }

  return count;
}

export async function exportAnimatedImages(
  onProgress?: (current: number, total: number) => void,
): Promise<{ [url: string]: string }> {
  const images: { [url: string]: string } = {};
  const processedUrls = new Set<string>();
  const animatedUrls: string[] = [];

  try {
    // First, collect all animated image URLs
    const cacheNames = [PRIMARY_IMAGE_CACHE, LEGACY_IMAGE_CACHE];

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          if (processedUrls.has(request.url)) continue;

          // Check if animated
          if (
            request.url.includes("/ani/") ||
            request.url.includes("/ani-back/") ||
            (request.url.includes("showdown") && request.url.endsWith(".gif"))
          ) {
            animatedUrls.push(request.url);
            processedUrls.add(request.url);
          }
        }
      } catch (e) {
        console.warn(`Could not scan ${cacheName}:`, e);
      }
    }

    console.log(`[Backup] Found ${animatedUrls.length} animated images to export`);

    // Now export them
    const total = animatedUrls.length;
    let current = 0;

    for (const url of animatedUrls) {
      try {
        let response: Response | undefined;

        // Try primary cache first
        const primaryCache = await caches.open(PRIMARY_IMAGE_CACHE);
        response = await primaryCache.match(url);

        if (!response) {
          const legacyCache = await caches.open(LEGACY_IMAGE_CACHE);
          response = await legacyCache.match(url);
        }

        if (response) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          images[url] = base64;
        }
      } catch (e) {
        console.warn(`Failed to export animated image: ${url}`, e);
      }

      current++;
      onProgress?.(current, total);
    }

    console.log(`[Backup] Successfully exported ${Object.keys(images).length} animated images`);
  } catch (e) {
    console.error("Failed to export animated images:", e);
  }

  return images;
}

export async function exportStaticImages(
  onProgress?: (current: number, total: number) => void,
): Promise<{ [url: string]: string }> {
  const images: { [url: string]: string } = {};
  const processedUrls = new Set<string>();
  const staticUrls: string[] = [];

  try {
    const cacheNames = [PRIMARY_IMAGE_CACHE, LEGACY_IMAGE_CACHE];

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          if (processedUrls.has(request.url)) continue;

          // Check if NOT animated (static images)
          const isAnimated =
            request.url.includes("/ani/") ||
            request.url.includes("/ani-back/") ||
            (request.url.includes("showdown") && request.url.endsWith(".gif"));

          if (!isAnimated) {
            staticUrls.push(request.url);
            processedUrls.add(request.url);
          }
        }
      } catch (e) {
        console.warn(`Could not scan ${cacheName}:`, e);
      }
    }

    console.log(`[Backup] Found ${staticUrls.length} static images to export`);

    const total = staticUrls.length;
    let current = 0;

    for (const url of staticUrls) {
      try {
        let response: Response | undefined;

        const primaryCache = await caches.open(PRIMARY_IMAGE_CACHE);
        response = await primaryCache.match(url);

        if (!response) {
          const legacyCache = await caches.open(LEGACY_IMAGE_CACHE);
          response = await legacyCache.match(url);
        }

        if (response) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          images[url] = base64;
        }
      } catch (e) {
        console.warn(`Failed to export static image: ${url}`, e);
      }

      current++;
      onProgress?.(current, total);
    }

    console.log(`[Backup] Successfully exported ${Object.keys(images).length} static images`);
  } catch (e) {
    console.error("Failed to export static images:", e);
  }

  return images;
}

export async function getStaticImageCount(): Promise<number> {
  let count = 0;

  try {
    const cacheNames = [PRIMARY_IMAGE_CACHE, LEGACY_IMAGE_CACHE];
    const processedUrls = new Set<string>();

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          if (processedUrls.has(request.url)) continue;
          processedUrls.add(request.url);

          const isAnimated =
            request.url.includes("/ani/") ||
            request.url.includes("/ani-back/") ||
            (request.url.includes("showdown") && request.url.endsWith(".gif"));

          if (!isAnimated) {
            count++;
          }
        }
      } catch (e) {
        console.warn(`Could not count static images in ${cacheName}:`, e);
      }
    }
  } catch (e) {
    console.error("Failed to count static images:", e);
  }

  return count;
}

// ============ Full Export (Everything) ============

export async function getFullExportStats(): Promise<FullExportStats> {
  const stats: FullExportStats = {
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
    staticImages: 0,
    animatedImages: 0,
    audioFiles: 0,
    estimatedSizeMB: 0,
  };

  // Get database counts
  for (const storeName of DATA_STORES) {
    const count = await getStoreCount(storeName);
    stats[storeName as keyof typeof stats] = count;
  }

  // Get media counts
  stats.staticImages = await getStaticImageCount();
  stats.animatedImages = await getAnimatedImageCount();
  stats.audioFiles = await getCachedAudioCount();

  // Estimate size (rough calculation)
  const dataItems = DATA_STORES.reduce(
    (sum, name) => sum + (stats[name as keyof typeof stats] as number),
    0,
  );
  const avgDataSizeKB = 0.5; // ~0.5KB per data item
  const avgImageSizeKB = 15; // ~15KB per image
  const avgAudioSizeKB = 50; // ~50KB per audio file

  const estimatedBytes =
    dataItems * avgDataSizeKB * 1024 +
    (stats.staticImages + stats.animatedImages) * avgImageSizeKB * 1024 +
    stats.audioFiles * avgAudioSizeKB * 1024;

  stats.estimatedSizeMB = Math.round((estimatedBytes / (1024 * 1024)) * 10) / 10;

  return stats;
}

export type FullExportPhase =
  | "data"
  | "static-images"
  | "animated-images"
  | "audio"
  | "compressing";

export async function exportEverything(
  onProgress?: (current: number, total: number, phase: FullExportPhase) => void,
): Promise<void> {
  console.log("[Full Export] Starting complete data export...");

  // Phase 1: Export database data
  const db = await getDB();
  const data: BackupData["data"] = {
    pokemon: [],
    moves: [],
    items: [],
    locations: [],
    encounters: [],
    gyms: [],
    gym_roster: [],
    npcs: [],
    learnsets: [],
    evolution_nodes: [],
    games: [],
  };

  let totalItems = 0;
  let current = 0;
  const totalTables = DATA_STORES.length;

  for (const storeName of DATA_STORES) {
    const items = await db.getAll(storeName);
    data[storeName] = items;
    totalItems += items.length;
    current++;
    onProgress?.(current, totalTables, "data");
    console.log(`[Full Export] Exported ${storeName}: ${items.length} items`);
  }

  // Phase 2: Export static images
  console.log("[Full Export] Exporting static images...");
  const staticImages = await exportStaticImages((c, t) => onProgress?.(c, t, "static-images"));

  // Phase 3: Export animated images
  console.log("[Full Export] Exporting animated images...");
  const animatedImages = await exportAnimatedImages((c, t) =>
    onProgress?.(c, t, "animated-images"),
  );

  // Merge all images
  const allImages = { ...staticImages, ...animatedImages };

  // Phase 4: Export audio
  console.log("[Full Export] Exporting audio...");
  const audio = await exportCachedAudio((c, t) => onProgress?.(c, t, "audio"));

  // Create backup object
  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    appVersion: APP_VERSION,
    data,
    images: allImages,
    audio,
    metadata: {
      totalItems,
      tables: [...DATA_STORES],
      includesImages: true,
      imageCount: Object.keys(allImages).length,
      includesAudio: true,
      audioCount: Object.keys(audio).length,
    },
  };

  console.log(
    `[Full Export] Total: ${totalItems} data items, ${Object.keys(allImages).length} images, ${Object.keys(audio).length} audio files`,
  );

  // Phase 5: Compress and save
  onProgress?.(1, 2, "compressing");

  const jsonString = JSON.stringify(backup);
  const compressedData = await compressData(jsonString);

  onProgress?.(2, 2, "compressing");

  const blob = new Blob([compressedData], { type: "application/gzip" });
  const date = new Date().toISOString().split("T")[0];
  const filename = `pokemon-guide-FULL-backup-${date}.json.gz`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const sizeMB = Math.round((blob.size / (1024 * 1024)) * 100) / 100;
  console.log(`[Full Export] Complete! File size: ${sizeMB} MB`);
}
