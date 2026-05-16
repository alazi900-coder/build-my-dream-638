import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { listPokemon, countPokemon, type PokemonRow } from "@/lib/pokemon.functions";
import { PokemonCard } from "@/components/PokemonCard";
import { useI18n } from "@/lib/i18n/context";
import { TYPES, type PokemonType } from "@/lib/typeChart";
import { cachePokemon, getAllCachedPokemon } from "@/lib/db";
import { Bookmark, Compass, Loader2, Search, Star, X } from "lucide-react";
import { useGameFilter } from "@/lib/gameFilter";
import { pokemonInGame, getGame } from "@/lib/games";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: PokedexPage });

type FilterValue = "all" | "favorite" | PokemonType;

const DISCOVERED_KEY = "pokemon-guide-discovered";
const FAVORITES_KEY = "pokemon-guide-favorites";
const DEFAULT_DISCOVERED_IDS = [1, 2, 3, 4, 5];

function readStoredIds(key: string, fallback: number[] = []) {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.filter((id): id is number => Number.isInteger(id));
  } catch {
    return fallback;
  }
}

function writeStoredIds(key: string, ids: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(ids));
}

function PokedexPage() {
  const { t, lang, typeName } = useI18n();
  const { game } = useGameFilter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [discoveredIds, setDiscoveredIds] = useState<number[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    setDiscoveredIds(readStoredIds(DISCOVERED_KEY, DEFAULT_DISCOVERED_IDS));
    setFavoriteIds(readStoredIds(FAVORITES_KEY));
  }, []);

  const { data: cached } = useQuery({
    queryKey: ["pokemon-cache"],
    queryFn: () => getAllCachedPokemon(),
    staleTime: 60_000,
  });

  const {
    data: list,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pokemon-list"],
    queryFn: async () => {
      const r = await listPokemon();
      cachePokemon(r).catch(() => {});
      return r;
    },
  });

  const { data: countData } = useQuery({
    queryKey: ["pokemon-count"],
    queryFn: () => countPokemon(),
    refetchInterval: syncing ? 3000 : false,
  });

  const pokemon: PokemonRow[] = useMemo(() => list ?? cached ?? [], [cached, list]);
  const needsSync = (countData?.count ?? pokemon.length) < 100 && !isLoading;
  const gameInfo = getGame(game);
  const gameName = lang === "ar" ? gameInfo.fullNameAr : gameInfo.fullNameEn;

  const discoveredSet = useMemo(() => new Set(discoveredIds), [discoveredIds]);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const availablePokemon = useMemo(
    () => pokemon.filter((p) => pokemonInGame(p.id, game)),
    [pokemon, game],
  );
  const discoveredCount = availablePokemon.filter((p) => discoveredSet.has(p.id)).length;
  const progress =
    availablePokemon.length === 0
      ? 0
      : Math.round((discoveredCount / availablePokemon.length) * 100);

  async function runSync() {
    setSyncing(true);
    let offset = 0;
    const total = 386;
    setSyncProgress({ done: 0, total });
    try {
      while (offset < total) {
        const res = await fetch(`/api/public/sync-pokemon?offset=${offset}&limit=25`);
        const json = await res.json();
        offset = json.nextOffset ?? total;
        setSyncProgress({ done: offset, total });
        await refetch();
      }
    } finally {
      setSyncing(false);
    }
  }

  function markDiscovered(id: number) {
    setDiscoveredIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      writeStoredIds(DISCOVERED_KEY, next);
      return next;
    });
  }

  function toggleFavorite(id: number) {
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeStoredIds(FAVORITES_KEY, next);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return availablePokemon.filter((p) => {
      if (filter === "favorite" && !favoriteSet.has(p.id)) return false;
      if (filter !== "all" && filter !== "favorite" && !p.types.includes(filter)) return false;
      if (q) {
        const needle = q.toLowerCase().trim();
        const name = lang === "ar" ? (p.name_ar ?? p.name_en) : p.name_en;
        if (
          !name.toLowerCase().includes(needle) &&
          !p.name_en.toLowerCase().includes(needle) &&
          !String(p.id).includes(needle)
        )
          return false;
      }
      return true;
    });
  }, [availablePokemon, favoriteSet, filter, lang, q]);

  const filterChips: { value: FilterValue; label: string; icon?: ReactNode }[] = [
    { value: "all", label: t.filters.all },
    {
      value: "favorite",
      label: lang === "ar" ? "المفضلة" : "Favorites",
      icon: <Star className="h-5 w-5" />,
    },
    ...TYPES.map((type) => ({ value: type, label: typeName(type) })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-6 text-end">
        <div className="mb-4 flex items-center justify-end gap-3">
          <Bookmark className="h-9 w-9 text-muted-foreground" />
          <div>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              {lang === "ar" ? "الدكس" : "Pokédex"}
            </h1>
            <p className="mt-1 text-2xl font-medium text-muted-foreground">
              {availablePokemon.length} {lang === "ar" ? "بوكيمون متاح" : "available Pokémon"}
            </p>
          </div>
        </div>
        <p className="inline-flex rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
          {gameName}
        </p>
      </section>

      <section className="mb-6 rounded-2xl border border-primary/25 bg-card p-5 shadow-[8px_8px_0_rgba(124,58,237,0.13)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-lg font-semibold text-muted-foreground">
            <span>{progress}%</span>
            <span>{favoriteIds.length}</span>
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-3 text-2xl font-black">
            <span>
              {lang === "ar"
                ? `اكتشفت ${discoveredCount} من ${availablePokemon.length}`
                : `Discovered ${discoveredCount} of ${availablePokemon.length}`}
            </span>
            <Compass className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-l from-blue-600 to-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {needsSync && (
        <section className="mb-6 rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-xl font-bold">{t.sync.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.sync.desc}</p>
          {syncing ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.sync.progress} {syncProgress?.done ?? 0} {t.sync.of} {syncProgress?.total}
              </div>
              <div className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${((syncProgress?.done ?? 0) / (syncProgress?.total ?? 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={runSync}
              className="mt-4 rounded-xl bg-primary px-6 py-2 font-bold text-primary-foreground hover:bg-primary/90"
            >
              {t.sync.start}
            </button>
          )}
        </section>
      )}

      <div className="mb-5 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground start-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "ar" ? "بحث عن بوكيمون..." : "Search Pokémon..."}
            className="w-full rounded-2xl border-2 border-border bg-card py-4 ps-14 pe-12 text-2xl font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {filterChips.map((chip) => {
            const active = chip.value === filter;
            return (
              <button
                key={chip.value}
                onClick={() => setFilter(chip.value)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border-2 px-5 py-3 text-xl font-black transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                )}
              >
                {chip.icon}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && pokemon.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && pokemon.length > 0 && (
        <p className="py-16 text-center text-muted-foreground">{t.search.noResults}</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((p) => (
          <PokemonCard
            key={p.id}
            p={p}
            discovered={discoveredSet.has(p.id)}
            favorite={favoriteSet.has(p.id)}
            onDiscover={markDiscovered}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
