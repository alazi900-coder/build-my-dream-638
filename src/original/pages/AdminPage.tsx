import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Layout } from "@/original/components/layout/Layout";
import { Button } from "@/original/components/ui/button";
import { supabase } from "@/original/integrations/supabase/client";
import { useToast } from "@/original/hooks/use-toast";
import {
  Upload,
  Database,
  Check,
  AlertCircle,
  Download,
  RefreshCw,
  Loader2,
  Gamepad2,
  Swords,
  Package,
  MapPin,
  Building,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileJson,
} from "lucide-react";
import { seedAllData, SeedResult } from "@/original/data/seedData";
import {
  importGalarPokemon,
  importSwshMoves,
  importSwshItems,
  importGalarLocations,
  importLetsGoPokemon,
  importLetsGoMoves,
  importLetsGoItems,
  importKantoLocations,
  importArceusPokemon,
  importArceusMoves,
  importArceusItems,
  importHisuiLocations,
  ImportProgress,
} from "@/original/services/pokeApiService";
import { Progress } from "@/original/components/ui/progress";
import { GAMES, GameId } from "@/original/contexts/GameFilterContext";
import { Checkbox } from "@/original/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { Pokemon } from "@/original/types/pokemon";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/original/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/original/components/ui/collapsible";
import { cn } from "@/original/lib/utils";
import { DataHealthCheck } from "@/original/components/admin/DataHealthCheck";

type TableName =
  | "pokemon"
  | "moves"
  | "items"
  | "locations"
  | "encounters"
  | "gyms"
  | "gym_roster"
  | "npcs";

interface DatabaseStats {
  totalPokemon: number;
  totalMoves: number;
  totalItems: number;
  totalLocations: number;
  totalEncounters: number;
  totalGyms: number;
  totalGymRoster: number;
  totalNPCs: number;
  totalLearnsets: number;
  totalEvolutionNodes: number;
  pokemonWithSwsh: number;
  pokemonWithLetsGo: number;
  pokemonWithArceus: number;
}

interface GameSection {
  id: string;
  labelEn: string;
  labelAr: string;
  color: string;
  pokemonCount: string;
  region: string;
}

const GAME_SECTIONS: GameSection[] = [
  {
    id: "swsh",
    labelEn: "Pokémon Sword & Shield",
    labelAr: "بوكيمون سورد وشيلد",
    color: "primary",
    pokemonCount: "~400",
    region: "Galar",
  },
  {
    id: "letsgo",
    labelEn: "Let's Go Pikachu/Eevee",
    labelAr: "ليتس غو بيكاتشو/إيفي",
    color: "chart-4",
    pokemonCount: "~153",
    region: "Kanto",
  },
  {
    id: "arceus",
    labelEn: "Legends: Arceus",
    labelAr: "أساطير: آرسيوس",
    color: "chart-2",
    pokemonCount: "~240",
    region: "Hisui",
  },
];

export default function AdminPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<SeedResult>({});
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importPhase, setImportPhase] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkImportTable, setBulkImportTable] = useState<"pokemon" | "moves" | "items">("pokemon");
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // For inline editor
  const {
    data: allPokemon,
    sync: syncPokemon,
    forceSync,
  } = useOfflineData<Pokemon & { available_in?: string[] }>({ table: "pokemon" });
  const [editingPokemon, setEditingPokemon] = useState<
    (Pokemon & { available_in?: string[] }) | null
  >(null);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  // Fetch database stats
  const fetchDatabaseStats = async () => {
    setLoadingStats(true);
    try {
      const [
        pokemonRes,
        movesRes,
        itemsRes,
        locationsRes,
        encountersRes,
        gymsRes,
        gymRosterRes,
        npcsRes,
        learnsetsRes,
        evolutionNodesRes,
        swshRes,
        letsgoRes,
        arceusRes,
      ] = await Promise.all([
        supabase.from("pokemon").select("*", { count: "exact", head: true }),
        supabase.from("moves").select("*", { count: "exact", head: true }),
        supabase.from("items").select("*", { count: "exact", head: true }),
        supabase.from("locations").select("*", { count: "exact", head: true }),
        supabase.from("encounters").select("*", { count: "exact", head: true }),
        supabase.from("gyms").select("*", { count: "exact", head: true }),
        supabase.from("gym_roster").select("*", { count: "exact", head: true }),
        supabase.from("npcs").select("*", { count: "exact", head: true }),
        supabase.from("learnsets").select("*", { count: "exact", head: true }),
        supabase.from("evolution_nodes").select("*", { count: "exact", head: true }),
        supabase
          .from("pokemon")
          .select("*", { count: "exact", head: true })
          .contains("available_in", ["swsh"]),
        supabase
          .from("pokemon")
          .select("*", { count: "exact", head: true })
          .contains("available_in", ["letsgo"]),
        supabase
          .from("pokemon")
          .select("*", { count: "exact", head: true })
          .contains("available_in", ["arceus"]),
      ]);

      setDbStats({
        totalPokemon: pokemonRes.count || 0,
        totalMoves: movesRes.count || 0,
        totalItems: itemsRes.count || 0,
        totalLocations: locationsRes.count || 0,
        totalEncounters: encountersRes.count || 0,
        totalGyms: gymsRes.count || 0,
        totalGymRoster: gymRosterRes.count || 0,
        totalNPCs: npcsRes.count || 0,
        totalLearnsets: learnsetsRes.count || 0,
        totalEvolutionNodes: evolutionNodesRes.count || 0,
        pokemonWithSwsh: swshRes.count || 0,
        pokemonWithLetsGo: letsgoRes.count || 0,
        pokemonWithArceus: arceusRes.count || 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // ============ SWORD/SHIELD HANDLERS ============
  const handleGalarImport = useCallback(async () => {
    setLoading("galar-import");
    setImportProgress(null);

    try {
      setImportPhase(t("جاري استيراد Galar Pokédex...", "جاري استيراد Galar Pokédex..."));

      const pokemonData = await importGalarPokemon((progress) => setImportProgress(progress));

      if (pokemonData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < pokemonData.length; i += batchSize) {
          const batch = pokemonData.slice(i, i + batchSize);

          setImportPhase(
            t(
              `جاري الحفظ... (${Math.min(i + batchSize, pokemonData.length)}/${pokemonData.length})`,
              `جاري الحفظ... (${Math.min(i + batchSize, pokemonData.length)}/${pokemonData.length})`,
            ),
          );

          const { error } = await supabase
            .from("pokemon")
            .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      await forceSync();

      toast({
        title: t("اكتمل الاستيراد!", "اكتمل الاستيراد!"),
        description: t(
          `تم استيراد ${pokemonData.length} بوكيمون`,
          `تم استيراد ${pokemonData.length} بوكيمون`,
        ),
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
      setImportPhase("");
    }
  }, [t, toast, forceSync]);

  const handleSwshMovesImport = useCallback(async () => {
    setLoading("swsh-moves");
    setImportProgress(null);

    try {
      setImportPhase(t("جاري استيراد الحركات...", "جاري استيراد الحركات..."));

      const movesData = await importSwshMoves((progress) => setImportProgress(progress), 826);

      if (movesData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < movesData.length; i += batchSize) {
          const batch = movesData.slice(i, i + batchSize);
          const { error } = await supabase.from("moves").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      toast({
        title: t("اكتمل استيراد الحركات!", "اكتمل استيراد الحركات!"),
        description: `${movesData.length} حركة`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
      setImportPhase("");
    }
  }, [t, toast]);

  const handleSwshItemsImport = useCallback(async () => {
    setLoading("swsh-items");
    setImportProgress(null);

    try {
      setImportPhase(t("جاري استيراد العناصر...", "جاري استيراد العناصر..."));

      const itemsData = await importSwshItems((progress) => setImportProgress(progress), 500);

      if (itemsData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < itemsData.length; i += batchSize) {
          const batch = itemsData.slice(i, i + batchSize);
          const { error } = await supabase.from("items").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      toast({
        title: t("اكتمل استيراد العناصر!", "اكتمل استيراد العناصر!"),
        description: `${itemsData.length} عنصر`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
      setImportPhase("");
    }
  }, [t, toast]);

  const handleGalarLocationsImport = useCallback(async () => {
    setLoading("galar-locations");
    setImportProgress(null);

    try {
      const locationsData = await importGalarLocations((progress) => setImportProgress(progress));

      if (locationsData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < locationsData.length; i += batchSize) {
          const batch = locationsData.slice(i, i + batchSize);
          const { error } = await supabase.from("locations").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      toast({
        title: t("اكتمل استيراد المواقع!", "اكتمل استيراد المواقع!"),
        description: `${locationsData.length} موقع`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
    }
  }, [t, toast]);

  // ============ LET'S GO HANDLERS ============
  const handleLetsGoPokemonImport = useCallback(async () => {
    setLoading("letsgo-pokemon");
    setImportProgress(null);

    try {
      setImportPhase(t("جاري استيراد بوكيمونات ليتس غو...", "جاري استيراد بوكيمونات ليتس غو..."));

      const pokemonData = await importLetsGoPokemon((progress) => setImportProgress(progress));

      if (pokemonData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < pokemonData.length; i += batchSize) {
          const batch = pokemonData.slice(i, i + batchSize);
          const { error } = await supabase
            .from("pokemon")
            .upsert(batch, { onConflict: "id", ignoreDuplicates: false });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      await forceSync();
      toast({
        title: t("اكتمل الاستيراد!", "اكتمل الاستيراد!"),
        description: `${pokemonData.length} بوكيمون`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
      setImportPhase("");
    }
  }, [t, toast, forceSync]);

  const handleLetsGoMovesImport = useCallback(async () => {
    setLoading("letsgo-moves");
    setImportProgress(null);

    try {
      const movesData = await importLetsGoMoves((progress) => setImportProgress(progress), 400);

      if (movesData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < movesData.length; i += batchSize) {
          const batch = movesData.slice(i, i + batchSize);
          const { error } = await supabase.from("moves").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      toast({
        title: t("اكتمل استيراد الحركات!", "اكتمل استيراد الحركات!"),
        description: `${movesData.length} حركة`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
    }
  }, [t, toast]);

  const handleLetsGoItemsImport = useCallback(async () => {
    setLoading("letsgo-items");
    setImportProgress(null);

    try {
      const itemsData = await importLetsGoItems((progress) => setImportProgress(progress), 300);

      if (itemsData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < itemsData.length; i += batchSize) {
          const batch = itemsData.slice(i, i + batchSize);
          const { error } = await supabase.from("items").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      toast({
        title: t("اكتمل استيراد العناصر!", "اكتمل استيراد العناصر!"),
        description: `${itemsData.length} عنصر`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
    }
  }, [t, toast]);

  const handleKantoLocationsImport = useCallback(async () => {
    setLoading("kanto-locations");
    setImportProgress(null);

    try {
      const locationsData = await importKantoLocations((progress) => setImportProgress(progress));

      if (locationsData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < locationsData.length; i += batchSize) {
          const batch = locationsData.slice(i, i + batchSize);
          const { error } = await supabase.from("locations").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      toast({
        title: t("اكتمل استيراد المواقع!", "اكتمل استيراد المواقع!"),
        description: `${locationsData.length} موقع`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
    }
  }, [t, toast]);

  // ============ LEARNSET IMPORT HANDLER ============
  const handleLearnsetImport = useCallback(
    async (gameFilter: "swsh" | "letsgo" | "arceus" | "all") => {
      setLoading(`learnset-${gameFilter}`);
      setImportProgress(null);

      try {
        // Get the max pokemon ID from the database
        const { data: pokemonData } = await supabase
          .from("pokemon")
          .select("id")
          .order("id", { ascending: false })
          .limit(1);

        const maxPokemonId = pokemonData?.[0]?.id || 500;
        const batchSize = 25;
        let totalImported = 0;

        for (let startId = 1; startId <= maxPokemonId; startId += batchSize) {
          const endId = Math.min(startId + batchSize - 1, maxPokemonId);

          const progressMessage = t(
            `جاري استيراد الحركات المتعلمة (${startId}-${endId}/${maxPokemonId})...`,
            `Importing learnsets (${startId}-${endId}/${maxPokemonId})...`,
          );
          setImportPhase(progressMessage);
          setImportProgress({
            current: endId,
            total: maxPokemonId,
            phase: "moves",
            message: progressMessage,
          });

          const { data, error } = await supabase.functions.invoke("import-learnsets", {
            body: { startId, endId, gameFilter },
          });

          if (error) {
            console.error("Learnset import batch error:", error);
          } else if (data?.imported) {
            totalImported += data.imported;
          }
        }

        toast({
          title: t("اكتمل استيراد الحركات المتعلمة!", "Learnset import complete!"),
          description: t(
            `تم استيراد ${totalImported} سجل`,
            `Imported ${totalImported} learnset entries`,
          ),
        });
      } catch (error) {
        toast({
          title: t("فشل الاستيراد", "Import failed"),
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(null);
        setImportProgress(null);
        setImportPhase("");
      }
    },
    [t, toast],
  );

  // ============ ARCEUS HANDLERS ============
  const handleArceusPokemonImport = useCallback(async () => {
    setLoading("arceus-pokemon");
    setImportProgress(null);

    try {
      setImportPhase(t("جاري استيراد بوكيمونات آرسيوس...", "جاري استيراد بوكيمونات آرسيوس..."));

      const pokemonData = await importArceusPokemon((progress) => setImportProgress(progress));

      if (pokemonData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < pokemonData.length; i += batchSize) {
          const batch = pokemonData.slice(i, i + batchSize);
          const { error } = await supabase
            .from("pokemon")
            .upsert(batch, { onConflict: "id", ignoreDuplicates: false });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      await forceSync();
      toast({
        title: t("اكتمل الاستيراد!", "اكتمل الاستيراد!"),
        description: `${pokemonData.length} بوكيمون`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
      setImportPhase("");
    }
  }, [t, toast, forceSync]);

  const handleArceusMovesImport = useCallback(async () => {
    setLoading("arceus-moves");
    setImportProgress(null);

    try {
      const movesData = await importArceusMoves((progress) => setImportProgress(progress), 300);

      if (movesData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < movesData.length; i += batchSize) {
          const batch = movesData.slice(i, i + batchSize);
          const { error } = await supabase.from("moves").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      toast({
        title: t("اكتمل استيراد الحركات!", "اكتمل استيراد الحركات!"),
        description: `${movesData.length} حركة`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
    }
  }, [t, toast]);

  const handleArceusItemsImport = useCallback(async () => {
    setLoading("arceus-items");
    setImportProgress(null);

    try {
      const itemsData = await importArceusItems((progress) => setImportProgress(progress), 250);

      if (itemsData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < itemsData.length; i += batchSize) {
          const batch = itemsData.slice(i, i + batchSize);
          const { error } = await supabase.from("items").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      await fetchDatabaseStats();
      toast({
        title: t("اكتمل استيراد العناصر!", "اكتمل استيراد العناصر!"),
        description: `${itemsData.length} عنصر`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
    }
  }, [t, toast]);

  const handleHisuiLocationsImport = useCallback(async () => {
    setLoading("hisui-locations");
    setImportProgress(null);

    try {
      const locationsData = await importHisuiLocations((progress) => setImportProgress(progress));

      if (locationsData.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < locationsData.length; i += batchSize) {
          const batch = locationsData.slice(i, i + batchSize);
          const { error } = await supabase.from("locations").upsert(batch, { onConflict: "id" });
          if (error) throw new Error(error.message);
        }
      }

      toast({
        title: t("اكتمل استيراد المواقع!", "اكتمل استيراد المواقع!"),
        description: `${locationsData.length} موقع`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setImportProgress(null);
    }
  }, [t, toast]);

  // Clear table function
  const handleClearTable = async (tableName: TableName) => {
    setLoading(`clear-${tableName}`);

    try {
      const { error } = await supabase.from(tableName).delete().neq("id", 0);

      if (error) {
        toast({
          title: t("فشل المسح", "فشل المسح"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: t("تم المسح بنجاح", "تم المسح بنجاح") });
        await fetchDatabaseStats();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleImportJSON = async (table: TableName, file: File) => {
    setLoading(table);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error(t("صيغة JSON غير صحيحة", "صيغة JSON غير صحيحة"));
      }

      const { error } = await supabase.from(table).upsert(data, { onConflict: "id" });
      if (error) throw error;

      toast({
        title: t("تم الاستيراد بنجاح", "تم الاستيراد بنجاح"),
        description: `${data.length} سجل`,
      });
    } catch (error) {
      toast({
        title: t("فشل الاستيراد", "فشل الاستيراد"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const renderImportButton = (loadingKey: string, onClick: () => void, label: string) => (
    <Button
      onClick={onClick}
      disabled={loading !== null}
      size="sm"
      variant="outline"
      className="flex-1"
    >
      {loading === loadingKey ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );

  const renderProgressBar = (loadingKey: string) => {
    if (loading === loadingKey && importProgress) {
      return (
        <div className="space-y-1 mt-2">
          <Progress value={(importProgress.current / importProgress.total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {importProgress.current}/{importProgress.total}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <h1 className="text-xl font-bold">{t("إدارة البيانات", "إدارة البيانات")}</h1>

        <DataHealthCheck onRefresh={fetchDatabaseStats} />


        {/* Database Statistics Section */}
        <section className="bg-gradient-to-br from-primary/5 to-chart-2/5 border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                {t("إحصائيات قاعدة البيانات", "Database Statistics")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("نظرة شاملة على جميع البيانات المخزنة", "Overview of all stored data")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDatabaseStats}
              disabled={loadingStats}
            >
              {loadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="mr-1 hidden sm:inline">{t("تحديث", "Refresh")}</span>
            </Button>
          </div>

          {dbStats ? (
            <div className="space-y-4">
              {/* Main Tables Stats */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {t("الجداول الرئيسية", "Main Tables")}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div className="bg-card border border-primary/20 rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                    <Gamepad2 className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold text-primary">
                      {dbStats.totalPokemon.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("بوكيمون", "Pokémon")}</div>
                  </div>
                  <div className="bg-card border border-chart-2/20 rounded-lg p-3 text-center hover:border-chart-2/50 transition-colors">
                    <Swords className="w-5 h-5 mx-auto mb-1 text-chart-2" />
                    <div className="text-2xl font-bold text-chart-2">
                      {dbStats.totalMoves.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("حركة", "Moves")}</div>
                  </div>
                  <div className="bg-card border border-chart-3/20 rounded-lg p-3 text-center hover:border-chart-3/50 transition-colors">
                    <Package className="w-5 h-5 mx-auto mb-1 text-chart-3" />
                    <div className="text-2xl font-bold text-chart-3">
                      {dbStats.totalItems.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("عنصر", "Items")}</div>
                  </div>
                  <div className="bg-card border border-chart-4/20 rounded-lg p-3 text-center hover:border-chart-4/50 transition-colors">
                    <MapPin className="w-5 h-5 mx-auto mb-1 text-chart-4" />
                    <div className="text-2xl font-bold text-chart-4">
                      {dbStats.totalLocations.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("موقع", "Locations")}</div>
                  </div>
                  <div className="bg-card border border-chart-5/20 rounded-lg p-3 text-center hover:border-chart-5/50 transition-colors">
                    <Users className="w-5 h-5 mx-auto mb-1 text-chart-5" />
                    <div className="text-2xl font-bold text-chart-5">
                      {dbStats.totalNPCs.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("شخصية", "NPCs")}</div>
                  </div>
                </div>
              </div>

              {/* Relations & Additional Data */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  {t("بيانات العلاقات", "Relational Data")}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">
                      {dbStats.totalEncounters.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("مواجهة", "Encounters")}</div>
                  </div>
                  <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">
                      {dbStats.totalLearnsets.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("حركة متعلمة", "Learnsets")}
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">
                      {dbStats.totalEvolutionNodes.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("تطور", "Evolutions")}</div>
                  </div>
                  <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">
                      {dbStats.totalGyms.toLocaleString()} /{" "}
                      {dbStats.totalGymRoster.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("صالة / فريق", "Gyms / Roster")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Distribution */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  {t("توزيع البوكيمونات حسب اللعبة", "Pokémon by Game")}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary">
                      {dbStats.pokemonWithSwsh.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("سورد/شيلد", "Sword/Shield")}
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: `${(dbStats.pokemonWithSwsh / dbStats.totalPokemon) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border border-chart-4/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-chart-4">
                      {dbStats.pokemonWithLetsGo.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("ليتس غو", "Let's Go")}</div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className="bg-chart-4 h-1.5 rounded-full"
                        style={{
                          width: `${(dbStats.pokemonWithLetsGo / dbStats.totalPokemon) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border border-chart-2/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-chart-2">
                      {dbStats.pokemonWithArceus.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t("آرسيوس", "Arceus")}</div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className="bg-chart-2 h-1.5 rounded-full"
                        style={{
                          width: `${(dbStats.pokemonWithArceus / dbStats.totalPokemon) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="mr-2 text-muted-foreground">
                {t("جاري التحميل...", "Loading...")}
              </span>
            </div>
          )}
        </section>

        {/* Game Import Sections */}
        <div className="space-y-4">
          {/* Sword & Shield Section */}
          <Collapsible open={openSections["swsh"]} onOpenChange={() => toggleSection("swsh")}>
            <CollapsibleTrigger asChild>
              <Card className="border-2 border-primary/50 cursor-pointer hover:bg-muted/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Gamepad2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {t("بوكيمون سورد وشيلد", "بوكيمون سورد وشيلد")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {t("منطقة Galar - ~400 بوكيمون", "منطقة Galar - ~400 بوكيمون")}
                        </CardDescription>
                      </div>
                    </div>
                    {openSections["swsh"] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-4 p-4 bg-muted/20 rounded-lg border border-border">
                {/* Pokemon */}
                <Card className="border border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {t("البوكيمونات", "البوكيمونات")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("galar-import")}
                    {renderImportButton("galar-import", handleGalarImport, t("استيراد", "استيراد"))}
                  </CardContent>
                </Card>

                {/* Moves */}
                <Card className="border border-chart-2/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Swords className="h-4 w-4" />
                      {t("الحركات", "الحركات")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("swsh-moves")}
                    {renderImportButton(
                      "swsh-moves",
                      handleSwshMovesImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                {/* Items */}
                <Card className="border border-chart-3/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {t("العناصر", "العناصر")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("swsh-items")}
                    {renderImportButton(
                      "swsh-items",
                      handleSwshItemsImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                {/* Locations */}
                <Card className="border border-chart-4/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("المواقع", "المواقع")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("galar-locations")}
                    {renderImportButton(
                      "galar-locations",
                      handleGalarLocationsImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                {/* Learnsets */}
                <Card className="border border-chart-5/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t("الحركات المتعلمة", "Learnsets")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("learnset-swsh")}
                    {renderImportButton(
                      "learnset-swsh",
                      () => handleLearnsetImport("swsh"),
                      t("استيراد", "Import"),
                    )}
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Let's Go Section */}
          <Collapsible open={openSections["letsgo"]} onOpenChange={() => toggleSection("letsgo")}>
            <CollapsibleTrigger asChild>
              <Card className="border-2 border-chart-4/50 cursor-pointer hover:bg-muted/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-chart-4/10">
                        <Gamepad2 className="h-6 w-6 text-chart-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {t("ليتس غو بيكاتشو/إيفي", "ليتس غو بيكاتشو/إيفي")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {t("منطقة Kanto - ~153 بوكيمون", "منطقة Kanto - ~153 بوكيمون")}
                        </CardDescription>
                      </div>
                    </div>
                    {openSections["letsgo"] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-4 p-4 bg-muted/20 rounded-lg border border-border">
                <Card className="border border-chart-4/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {t("البوكيمونات", "البوكيمونات")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("letsgo-pokemon")}
                    {renderImportButton(
                      "letsgo-pokemon",
                      handleLetsGoPokemonImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-chart-2/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Swords className="h-4 w-4" />
                      {t("الحركات", "الحركات")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("letsgo-moves")}
                    {renderImportButton(
                      "letsgo-moves",
                      handleLetsGoMovesImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-chart-3/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {t("العناصر", "العناصر")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("letsgo-items")}
                    {renderImportButton(
                      "letsgo-items",
                      handleLetsGoItemsImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-chart-4/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("المواقع", "المواقع")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("kanto-locations")}
                    {renderImportButton(
                      "kanto-locations",
                      handleKantoLocationsImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                {/* Learnsets */}
                <Card className="border border-chart-5/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t("الحركات المتعلمة", "Learnsets")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("learnset-letsgo")}
                    {renderImportButton(
                      "learnset-letsgo",
                      () => handleLearnsetImport("letsgo"),
                      t("استيراد", "Import"),
                    )}
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Legends: Arceus Section */}
          <Collapsible open={openSections["arceus"]} onOpenChange={() => toggleSection("arceus")}>
            <CollapsibleTrigger asChild>
              <Card className="border-2 border-chart-2/50 cursor-pointer hover:bg-muted/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-chart-2/10">
                        <Gamepad2 className="h-6 w-6 text-chart-2" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {t("أساطير: آرسيوس", "أساطير: آرسيوس")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {t("منطقة Hisui - ~240 بوكيمون", "منطقة Hisui - ~240 بوكيمون")}
                        </CardDescription>
                      </div>
                    </div>
                    {openSections["arceus"] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-4 p-4 bg-muted/20 rounded-lg border border-border">
                <Card className="border border-chart-2/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {t("البوكيمونات", "البوكيمونات")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("arceus-pokemon")}
                    {renderImportButton(
                      "arceus-pokemon",
                      handleArceusPokemonImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-chart-2/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Swords className="h-4 w-4" />
                      {t("الحركات", "الحركات")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("arceus-moves")}
                    {renderImportButton(
                      "arceus-moves",
                      handleArceusMovesImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-chart-3/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {t("العناصر", "العناصر")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("arceus-items")}
                    {renderImportButton(
                      "arceus-items",
                      handleArceusItemsImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-chart-4/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("المواقع", "المواقع")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("hisui-locations")}
                    {renderImportButton(
                      "hisui-locations",
                      handleHisuiLocationsImport,
                      t("استيراد", "استيراد"),
                    )}
                  </CardContent>
                </Card>

                {/* Learnsets */}
                <Card className="border border-chart-5/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t("الحركات المتعلمة", "Learnsets")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderProgressBar("learnset-arceus")}
                    {renderImportButton(
                      "learnset-arceus",
                      () => handleLearnsetImport("arceus"),
                      t("استيراد", "Import"),
                    )}
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Clear Data Section */}
        <section className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            {t("مسح البيانات", "مسح البيانات")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["pokemon", "moves", "items", "locations", "gyms", "npcs"].map((table) => (
              <Button
                key={table}
                variant="destructive"
                size="sm"
                onClick={() => handleClearTable(table as TableName)}
                disabled={loading !== null}
                className="text-xs"
              >
                {loading === `clear-${table}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-1" />
                    {t(
                      table === "pokemon"
                        ? "البوكيمونات"
                        : table === "moves"
                          ? "الحركات"
                          : table === "items"
                            ? "العناصر"
                            : table === "locations"
                              ? "المواقع"
                              : table === "gyms"
                                ? "الصالات"
                                : "الشخصيات",
                      table === "pokemon"
                        ? "البوكيمونات"
                        : table === "moves"
                          ? "الحركات"
                          : table === "items"
                            ? "العناصر"
                            : table === "locations"
                              ? "المواقع"
                              : table === "gyms"
                                ? "الصالات"
                                : "الشخصيات",
                    )}
                  </>
                )}
              </Button>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
