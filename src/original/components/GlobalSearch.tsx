import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { supabase } from "@/original/integrations/supabase/client";
import { getDB } from "@/original/lib/db";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { Button } from "@/original/components/ui/button";
import { Dialog, DialogContent } from "@/original/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/original/components/ui/command";
import { TypeBadge } from "@/original/components/ui/type-badge";

interface SearchResult {
  id: number | string;
  type: "pokemon" | "move" | "item" | "location" | "gym";
  name_en: string;
  name_ar: string;
  subtype?: string;
  available_in?: string[];
}

export function GlobalSearch() {
  const { t, language } = useLanguage();
  const { isAvailableInGame } = useGameFilter();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Search from IndexedDB first, then Supabase
  const searchFromIndexedDB = useCallback(async (term: string): Promise<SearchResult[]> => {
    const allResults: SearchResult[] = [];
    const lowerTerm = term.toLowerCase();

    try {
      const db = await getDB();

      // Search Pokemon
      const allPokemon = await db.getAll("pokemon");
      const matchedPokemon = allPokemon
        .filter(
          (p) =>
            p.name_en.toLowerCase().includes(lowerTerm) ||
            p.name_ar.includes(term) ||
            p.id.toString() === term,
        )
        .slice(0, 5);

      allResults.push(
        ...matchedPokemon.map((p) => ({
          id: p.id,
          type: "pokemon" as const,
          name_en: p.name_en,
          name_ar: p.name_ar,
          subtype: p.types?.join("/"),
          available_in: p.available_in,
        })),
      );

      // Search Moves
      const allMoves = await db.getAll("moves");
      const matchedMoves = allMoves
        .filter((m) => m.name_en.toLowerCase().includes(lowerTerm) || m.name_ar.includes(term))
        .slice(0, 5);

      allResults.push(
        ...matchedMoves.map((m) => ({
          id: m.id,
          type: "move" as const,
          name_en: m.name_en,
          name_ar: m.name_ar,
          subtype: m.type,
          available_in: m.available_in,
        })),
      );

      // Search Items
      const allItems = await db.getAll("items");
      const matchedItems = allItems
        .filter((i) => i.name_en.toLowerCase().includes(lowerTerm) || i.name_ar.includes(term))
        .slice(0, 5);

      allResults.push(
        ...matchedItems.map((i) => ({
          id: i.id,
          type: "item" as const,
          name_en: i.name_en,
          name_ar: i.name_ar,
          subtype: i.category,
          available_in: i.available_in,
        })),
      );

      // Search Locations
      const allLocations = await db.getAll("locations");
      const matchedLocations = allLocations
        .filter((l) => l.name_en.toLowerCase().includes(lowerTerm) || l.name_ar.includes(term))
        .slice(0, 5);

      allResults.push(
        ...matchedLocations.map((l) => ({
          id: l.id,
          type: "location" as const,
          name_en: l.name_en,
          name_ar: l.name_ar,
          subtype: l.region,
          available_in: l.available_in,
        })),
      );

      // Search Gyms
      const allGyms = await db.getAll("gyms");
      const matchedGyms = allGyms
        .filter(
          (g) =>
            g.leader_name_en.toLowerCase().includes(lowerTerm) || g.leader_name_ar.includes(term),
        )
        .slice(0, 5);

      allResults.push(
        ...matchedGyms.map((g) => ({
          id: g.id,
          type: "gym" as const,
          name_en: g.leader_name_en,
          name_ar: g.leader_name_ar,
          subtype: g.type,
          available_in: g.available_in,
        })),
      );

      return allResults;
    } catch (e) {
      console.warn("IndexedDB search failed:", e);
      return [];
    }
  }, []);

  // Search across all tables
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = search.toLowerCase();
    setLoading(true);

    const fetchResults = async () => {
      // Try IndexedDB first (works offline)
      const localResults = await searchFromIndexedDB(search);

      if (localResults.length > 0 || isOffline) {
        setResults(localResults);
        setLoading(false);
        return;
      }

      // Fallback to Supabase when online and no local data
      const allResults: SearchResult[] = [];

      // Search Pokemon
      const { data: pokemon } = await supabase
        .from("pokemon")
        .select("id, name_en, name_ar, types, available_in")
        .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`)
        .limit(5);

      if (pokemon) {
        allResults.push(
          ...pokemon.map((p) => ({
            id: p.id,
            type: "pokemon" as const,
            name_en: p.name_en,
            name_ar: p.name_ar,
            subtype: Array.isArray(p.types) ? (p.types as string[]).join("/") : undefined,
            available_in: p.available_in as string[] | undefined,
          })),
        );
      }

      // Search Moves
      const { data: moves } = await supabase
        .from("moves")
        .select("id, name_en, name_ar, type, available_in")
        .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`)
        .limit(5);

      if (moves) {
        allResults.push(
          ...moves.map((m) => ({
            id: m.id,
            type: "move" as const,
            name_en: m.name_en,
            name_ar: m.name_ar,
            subtype: m.type,
            available_in: m.available_in as string[] | undefined,
          })),
        );
      }

      // Search Items
      const { data: items } = await supabase
        .from("items")
        .select("id, name_en, name_ar, category, available_in")
        .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`)
        .limit(5);

      if (items) {
        allResults.push(
          ...items.map((i) => ({
            id: i.id,
            type: "item" as const,
            name_en: i.name_en,
            name_ar: i.name_ar,
            subtype: i.category,
            available_in: i.available_in as string[] | undefined,
          })),
        );
      }

      // Search Locations
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name_en, name_ar, region, available_in")
        .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`)
        .limit(5);

      if (locations) {
        allResults.push(
          ...locations.map((l) => ({
            id: l.id,
            type: "location" as const,
            name_en: l.name_en,
            name_ar: l.name_ar,
            subtype: l.region,
            available_in: l.available_in as string[] | undefined,
          })),
        );
      }

      // Search Gyms
      const { data: gyms } = await supabase
        .from("gyms")
        .select("id, leader_name_en, leader_name_ar, type, available_in")
        .or(`leader_name_en.ilike.%${searchTerm}%,leader_name_ar.ilike.%${searchTerm}%`)
        .limit(5);

      if (gyms) {
        allResults.push(
          ...gyms.map((g) => ({
            id: g.id,
            type: "gym" as const,
            name_en: g.leader_name_en,
            name_ar: g.leader_name_ar,
            subtype: g.type,
            available_in: g.available_in as string[] | undefined,
          })),
        );
      }

      setResults(allResults);
      setLoading(false);
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  // Filter results by game
  const filteredResults = useMemo(() => {
    return results.filter((r) => isAvailableInGame(r.available_in));
  }, [results, isAvailableInGame]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filteredResults.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [filteredResults]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pokemon: { en: "Pokémon", ar: "بوكيمون" },
      move: { en: "Moves", ar: "الحركات" },
      item: { en: "Items", ar: "الأدوات" },
      location: { en: "Locations", ar: "المواقع" },
      gym: { en: "Gyms", ar: "الجيمات" },
    };
    return language === "ar" ? labels[type]?.ar : labels[type]?.en;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      pokemon: "🎮",
      move: "⚡",
      item: "🎒",
      location: "📍",
      gym: "🏟️",
    };
    return icons[type] || "📋";
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setSearch("");

    switch (result.type) {
      case "pokemon":
        navigate(`/pokemon/${result.id}`);
        break;
      case "move":
        navigate(`/moves`);
        break;
      case "item":
        navigate(`/items`);
        break;
      case "location":
        navigate(`/map`);
        break;
      case "gym":
        navigate(`/gyms`);
        break;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground h-9 px-3"
        aria-label={t("Open search", "فتح البحث")}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("Search...", "بحث...")}</span>
        <kbd
          className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground"
          aria-hidden="true"
        >
          ⌘K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden" aria-describedby={undefined}>
          <Command className="rounded-lg border-none">
            <CommandInput
              placeholder={t("Search Pokémon, moves, items...", "بحث عن بوكيمون، حركات، أدوات...")}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[400px]">
              {loading && (
                <div
                  className="py-6 text-center text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  {t("Searching...", "جاري البحث...")}
                </div>
              )}

              {!loading && search && filteredResults.length === 0 && (
                <CommandEmpty>{t("No results found.", "لم يتم العثور على نتائج.")}</CommandEmpty>
              )}

              {!loading &&
                Object.entries(groupedResults).map(([type, items]) => (
                  <CommandGroup key={type} heading={`${getTypeIcon(type)} ${getTypeLabel(type)}`}>
                    {items.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={`${result.name_en} ${result.name_ar}`}
                        onSelect={() => handleSelect(result)}
                        className="cursor-pointer gap-3 py-3"
                      >
                        {result.type === "pokemon" && (
                          <img
                            src={getPokemonSprite(Number(result.id))}
                            alt={language === "ar" ? result.name_ar : result.name_en}
                            className="w-8 h-8 object-contain"
                            style={{ imageRendering: "pixelated" }}
                          />
                        )}
                        {result.type !== "pokemon" && (
                          <span className="text-xl w-8 text-center" aria-hidden="true">
                            {getTypeIcon(result.type)}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {language === "ar" ? (
                              result.name_ar
                            ) : (
                              <span lang="en">{result.name_en}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {language === "ar" ? (
                              <span lang="en">{result.name_en}</span>
                            ) : (
                              result.name_ar
                            )}
                          </p>
                        </div>
                        {result.subtype && <TypeBadge type={result.subtype} size="sm" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}

              {!search && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t("Start typing to search...", "ابدأ الكتابة للبحث...")}
                </div>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
