import { useState, useCallback } from "react";
import { supabase } from "@/original/integrations/supabase/client";
import { getDB, setLastSync } from "@/original/lib/db";
import {
  getPokemonSpriteUrl,
  getPokemonArtworkUrl,
  getItemSpriteUrl,
  getMoveTypeIconUrl,
  clearImageCache,
  getCachedImageCount,
  collectSectionImageUrls,
  getPokemonAnimatedSpriteUrl,
  getPokemonShowdownSpriteUrl,
} from "@/original/lib/imageCache";
import { precacheImages as swPrecacheImages, clearAllCaches } from "@/original/lib/serviceWorker";
import {
  precacheAudioFiles,
  clearAudioCache,
  getCachedAudioCount,
} from "@/original/lib/audioCache";
import { OverallProgress } from "@/original/contexts/DownloadContext";

type TableName =
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
  | "games";

interface DownloadProgress {
  table: TableName | "images" | "sounds";
  status: "pending" | "downloading" | "done" | "error";
  count?: number;
  total?: number;
}

const TABLES_TO_SYNC: TableName[] = [
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
];

export type SectionId =
  | "dex"
  | "moves"
  | "items"
  | "gyms"
  | "maps"
  | "core"
  | "sounds"
  | "animated";

interface SectionConfig {
  id: SectionId;
  tables: TableName[];
  imageType?: "pokemon" | "items" | "gyms" | "maps" | "animated";
  audioType?: "pokemon";
}

export const DOWNLOAD_SECTIONS: SectionConfig[] = [
  { id: "dex", tables: ["pokemon"], imageType: "pokemon" },
  { id: "moves", tables: ["moves", "learnsets"], imageType: "maps" }, // maps includes type icons
  { id: "items", tables: ["items"], imageType: "items" },
  { id: "gyms", tables: ["gyms", "gym_roster", "npcs"], imageType: "gyms" },
  { id: "maps", tables: ["locations", "encounters"], imageType: "maps" },
  { id: "core", tables: ["evolution_nodes", "games"] },
  { id: "sounds", tables: [], audioType: "pokemon" },
  { id: "animated", tables: [], imageType: "animated" },
];

// Phase weights for overall progress calculation
const PHASE_WEIGHTS = {
  tables: 40, // 40% for all tables
  images: 40, // 40% for images
  sounds: 20, // 20% for sounds
};

export type ProgressCallback = (progress: OverallProgress) => void;

export function useOfflineDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageProgress, setImageProgress] = useState({ done: 0, total: 0 });

  const downloadTable = async (table: TableName): Promise<number> => {
    const { data, error } = await supabase.from(table).select("*");

    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    const db = await getDB();
    const tx = db.transaction(table, "readwrite");
    const store = tx.objectStore(table);

    await store.clear();
    for (const item of data || []) {
      await store.put(item as any);
    }
    await tx.done;
    await setLastSync(table);

    return data?.length || 0;
  };

  const downloadImages = async (
    onProgress?: (done: number, total: number) => void,
  ): Promise<{ success: number; failed: number }> => {
    const db = await getDB();

    // Get all data for image URL collection
    const [pokemonData, itemsData, npcsData, locationsData] = await Promise.all([
      db.getAll("pokemon"),
      db.getAll("items"),
      db.getAll("npcs"),
      db.getAll("locations"),
    ]);

    // Collect all image URLs (sprites + artwork + items + NPCs + type icons)
    const urls: string[] = [];

    // Pokemon sprites AND artwork
    pokemonData.forEach((p: any) => {
      urls.push(getPokemonSpriteUrl(p.id));
      urls.push(getPokemonArtworkUrl(p.id));
    });

    // Item sprites
    itemsData.forEach((i: any) => {
      urls.push(getItemSpriteUrl(i.name_en));
    });

    // NPC images
    npcsData.forEach((n: any) => {
      if (n.image_url) {
        urls.push(n.image_url);
      }
    });

    // Location map images
    locationsData.forEach((l: any) => {
      if (l.map_image_url) {
        urls.push(l.map_image_url);
      }
    });

    // Type icons
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
    const uniqueUrls = [...new Set(urls)];

    setImageProgress({ done: 0, total: uniqueUrls.length });

    // Use Service Worker for precaching
    return await swPrecacheImages(uniqueUrls, (done, total) => {
      setImageProgress({ done, total });
      onProgress?.(done, total);
    });
  };

  const downloadSection = useCallback(async (sectionId: SectionId): Promise<boolean> => {
    if (!navigator.onLine) {
      setError("Cannot download while offline");
      return false;
    }

    const section = DOWNLOAD_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return false;

    setIsDownloading(true);
    setError(null);
    setImageProgress({ done: 0, total: 0 });

    try {
      // Download tables for this section
      for (const table of section.tables) {
        await downloadTable(table);
      }

      // Download images if this section has images
      if (section.imageType) {
        const db = await getDB();
        let urls: string[] = [];

        if (section.imageType === "pokemon") {
          const pokemonData = await db.getAll("pokemon");
          urls = collectSectionImageUrls("pokemon", {
            pokemon: pokemonData.map((p: any) => ({ id: p.id })),
          });
        } else if (section.imageType === "items") {
          const itemsData = await db.getAll("items");
          urls = collectSectionImageUrls("items", {
            items: itemsData.map((i: any) => ({ name_en: i.name_en })),
          });
        } else if (section.imageType === "gyms") {
          const npcsData = await db.getAll("npcs");
          urls = collectSectionImageUrls("gyms", {
            npcs: npcsData.map((n: any) => ({ image_url: n.image_url })),
          });
        } else if (section.imageType === "maps") {
          const locationsData = await db.getAll("locations");
          urls = collectSectionImageUrls("maps", {
            locations: locationsData.map((l: any) => ({ map_image_url: l.map_image_url })),
          });
        } else if (section.imageType === "animated") {
          // Get Pokemon data for animated sprites
          let pokemonList: { id: number; name_en: string }[] = [];

          try {
            pokemonList = (await db.getAll("pokemon")).map((p: any) => ({
              id: p.id,
              name_en: p.name_en,
            }));
          } catch (e) {
            console.warn("Failed to get Pokemon from IndexedDB for animated sprites");
          }

          // If no Pokemon data exists locally, fetch IDs from Supabase
          if (pokemonList.length === 0 && navigator.onLine) {
            try {
              const { data: remotePokemon } = await supabase.from("pokemon").select("id, name_en");
              if (remotePokemon && remotePokemon.length > 0) {
                pokemonList = remotePokemon;
              }
            } catch (e) {
              console.warn("Failed to fetch Pokemon from Supabase for animated sprites");
            }
          }

          // Collect animated sprite URLs with error handling
          pokemonList.forEach((p) => {
            try {
              // PokeAPI animated sprites (Gen 1-5, IDs 1-649)
              if (p.id <= 649) {
                urls.push(getPokemonAnimatedSpriteUrl(p.id));
              }
              // Showdown sprites for all Pokemon
              if (p.name_en) {
                urls.push(getPokemonShowdownSpriteUrl(p.name_en));
              }
            } catch (e) {
              // Skip Pokemon with invalid data
              console.warn(`Skipping animated sprite for Pokemon ${p.id}`);
            }
          });

          urls = [...new Set(urls)]; // Dedupe
        }

        if (urls.length > 0) {
          setImageProgress({ done: 0, total: urls.length });
          // Use Service Worker for precaching
          await swPrecacheImages(urls, (done, total) => {
            setImageProgress({ done, total });
          });
        }
      }

      // Download audio if this section has audio
      if (section.audioType === "pokemon") {
        const db = await getDB();
        let pokemonIds: number[] = [];

        try {
          const pokemonData = await db.getAll("pokemon");
          pokemonIds = pokemonData.map((p: any) => p.id as number);
        } catch (e) {
          console.warn("Failed to get Pokemon from IndexedDB for audio");
        }

        // If no Pokemon data exists locally, fetch IDs from Supabase
        if (pokemonIds.length === 0 && navigator.onLine) {
          try {
            const { data: remotePokemon } = await supabase.from("pokemon").select("id");
            if (remotePokemon && remotePokemon.length > 0) {
              pokemonIds = remotePokemon.map((p) => p.id);
            }
          } catch (e) {
            console.warn("Failed to fetch Pokemon IDs from Supabase for audio");
          }
        }

        if (pokemonIds.length > 0) {
          setImageProgress({ done: 0, total: pokemonIds.length });
          try {
            await precacheAudioFiles(pokemonIds, "latest", (done, total) => {
              setImageProgress({ done, total });
            });
          } catch (e) {
            console.warn("Some audio files failed to cache:", e);
          }
        }
      }

      // Update last download time
      const downloadKey = `offlineSection_${sectionId}`;
      localStorage.setItem(downloadKey, new Date().toISOString());

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const downloadAllData = useCallback(async (onProgressUpdate?: ProgressCallback) => {
    if (!navigator.onLine) {
      setError("Cannot download while offline");
      return false;
    }

    setIsDownloading(true);
    setError(null);
    setImageProgress({ done: 0, total: 0 });

    const totalTables = TABLES_TO_SYNC.length;
    let completedTables = 0;

    // Helper to calculate overall percentage
    const calculateOverall = (
      phase: "tables" | "images" | "sounds",
      phaseProgress: number,
    ): number => {
      let basePercentage = 0;
      if (phase === "images") basePercentage = PHASE_WEIGHTS.tables;
      if (phase === "sounds") basePercentage = PHASE_WEIGHTS.tables + PHASE_WEIGHTS.images;

      const currentPhaseWeight = PHASE_WEIGHTS[phase];
      return basePercentage + (phaseProgress * currentPhaseWeight) / 100;
    };

    // Initialize progress with tables + images + sounds
    const initialProgress: DownloadProgress[] = [
      ...TABLES_TO_SYNC.map((table) => ({ table, status: "pending" as const })),
      { table: "images" as const, status: "pending" as const },
      { table: "sounds" as const, status: "pending" as const },
    ];
    setProgress(initialProgress);

    try {
      // Phase 1: Download all tables
      for (const table of TABLES_TO_SYNC) {
        setProgress((prev) =>
          prev.map((p) => (p.table === table ? { ...p, status: "downloading" } : p)),
        );

        const phaseProgress = (completedTables / totalTables) * 100;
        onProgressUpdate?.({
          currentPhase: "tables",
          phaseName: "Database",
          phaseNameAr: "قاعدة البيانات",
          completedPhases: 0,
          totalPhases: 3,
          currentItemDone: completedTables,
          currentItemTotal: totalTables,
          overallPercentage: calculateOverall("tables", phaseProgress),
        });

        try {
          const count = await downloadTable(table);
          completedTables++;

          setProgress((prev) =>
            prev.map((p) => (p.table === table ? { ...p, status: "done", count } : p)),
          );
        } catch (err) {
          setProgress((prev) =>
            prev.map((p) => (p.table === table ? { ...p, status: "error" } : p)),
          );
          throw err;
        }
      }

      // Phase 2: Download all images
      setProgress((prev) =>
        prev.map((p) => (p.table === "images" ? { ...p, status: "downloading" } : p)),
      );

      onProgressUpdate?.({
        currentPhase: "images",
        phaseName: "Images",
        phaseNameAr: "الصور",
        completedPhases: 1,
        totalPhases: 3,
        currentItemDone: 0,
        currentItemTotal: 0,
        overallPercentage: calculateOverall("images", 0),
      });

      const imageResult = await downloadImages((done, total) => {
        const phaseProgress = total > 0 ? (done / total) * 100 : 0;
        onProgressUpdate?.({
          currentPhase: "images",
          phaseName: "Images",
          phaseNameAr: "الصور",
          completedPhases: 1,
          totalPhases: 3,
          currentItemDone: done,
          currentItemTotal: total,
          overallPercentage: calculateOverall("images", phaseProgress),
        });
      });

      setProgress((prev) =>
        prev.map((p) =>
          p.table === "images"
            ? {
                ...p,
                status: "done",
                count: imageResult.success,
                total: imageResult.success + imageResult.failed,
              }
            : p,
        ),
      );

      // Phase 3: Download sounds
      setProgress((prev) =>
        prev.map((p) => (p.table === "sounds" ? { ...p, status: "downloading" } : p)),
      );

      onProgressUpdate?.({
        currentPhase: "sounds",
        phaseName: "Sounds",
        phaseNameAr: "الأصوات",
        completedPhases: 2,
        totalPhases: 3,
        currentItemDone: 0,
        currentItemTotal: 0,
        overallPercentage: calculateOverall("sounds", 0),
      });

      const db = await getDB();
      const pokemonData = await db.getAll("pokemon");
      const pokemonIds: number[] = pokemonData.map((p: any) => p.id);

      if (pokemonIds.length > 0) {
        await precacheAudioFiles(pokemonIds, "latest", (done, total) => {
          setImageProgress({ done, total });
          const phaseProgress = total > 0 ? (done / total) * 100 : 0;
          onProgressUpdate?.({
            currentPhase: "sounds",
            phaseName: "Sounds",
            phaseNameAr: "الأصوات",
            completedPhases: 2,
            totalPhases: 3,
            currentItemDone: done,
            currentItemTotal: total,
            overallPercentage: calculateOverall("sounds", phaseProgress),
          });
        });
      }

      setProgress((prev) =>
        prev.map((p) =>
          p.table === "sounds" ? { ...p, status: "done", count: pokemonIds.length } : p,
        ),
      );

      // Complete
      onProgressUpdate?.({
        currentPhase: "sounds",
        phaseName: "Complete",
        phaseNameAr: "مكتمل",
        completedPhases: 3,
        totalPhases: 3,
        currentItemDone: pokemonIds.length,
        currentItemTotal: pokemonIds.length,
        overallPercentage: 100,
      });

      // Mark download complete in localStorage
      localStorage.setItem("offlineDataDownloaded", new Date().toISOString());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const getLastDownloadDate = useCallback(() => {
    const date = localStorage.getItem("offlineDataDownloaded");
    return date ? new Date(date) : null;
  }, []);

  const getSectionLastDownload = useCallback((sectionId: SectionId) => {
    const date = localStorage.getItem(`offlineSection_${sectionId}`);
    return date ? new Date(date) : null;
  }, []);

  const getCachedImagesCount = useCallback(async () => {
    return await getCachedImageCount();
  }, []);

  const getCachedSoundsCount = useCallback(async () => {
    return await getCachedAudioCount();
  }, []);

  const clearAllOfflineData = useCallback(async () => {
    // Clear both SW caches, legacy image cache, and audio cache
    await Promise.all([clearAllCaches(), clearImageCache(), clearAudioCache()]);
    localStorage.removeItem("offlineDataDownloaded");
    DOWNLOAD_SECTIONS.forEach((section) => {
      localStorage.removeItem(`offlineSection_${section.id}`);
    });
  }, []);

  return {
    isDownloading,
    progress,
    error,
    imageProgress,
    downloadAllData,
    downloadSection,
    getLastDownloadDate,
    getSectionLastDownload,
    getCachedImagesCount,
    getCachedSoundsCount,
    clearAllOfflineData,
  };
}
