import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { listPokemon, countPokemon, type PokemonRow } from "@/lib/pokemon.functions";
import { PokemonCard } from "@/components/PokemonCard";
import { useI18n } from "@/lib/i18n/context";
import { TYPES } from "@/lib/typeChart";
import { typeNames } from "@/lib/i18n/translations";
import { cachePokemon, getAllCachedPokemon } from "@/lib/db";
import { Search, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({ component: PokedexPage });

function PokedexPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [gen, setGen] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);

  // Try cache first, then server
  const { data: cached } = useQuery({
    queryKey: ["pokemon-cache"],
    queryFn: () => getAllCachedPokemon(),
    staleTime: 60_000,
  });

  const { data: list, isLoading, refetch } = useQuery({
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

  const pokemon: PokemonRow[] = list ?? cached ?? [];
  const needsSync = (countData?.count ?? pokemon.length) < 100 && !isLoading;

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

  const filtered = useMemo(() => {
    return pokemon.filter((p) => {
      if (type && !p.types.includes(type)) return false;
      if (gen && p.generation !== Number(gen)) return false;
      if (q) {
        const needle = q.toLowerCase().trim();
        const name = lang === "ar" ? p.name_ar ?? p.name_en : p.name_en;
        if (!name.toLowerCase().includes(needle) && !String(p.id).includes(needle)) return false;
      }
      return true;
    });
  }, [pokemon, q, type, gen, lang]);

  // Auto-jump on exact id match
  useEffect(() => {
    if (q && /^\d+$/.test(q.trim())) {
      const id = Number(q.trim());
      const exact = pokemon.find((p) => p.id === id);
      if (exact) {/* let user click */}
    }
  }, [q, pokemon, navigate]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{t.appName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
      </div>

      {needsSync && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-xl font-bold">{t.sync.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.sync.desc}</p>
          {syncing ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.sync.progress} {syncProgress?.done ?? 0} {t.sync.of} {syncProgress?.total}
              </div>
              <div className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${((syncProgress?.done ?? 0) / (syncProgress?.total ?? 1)) * 100}%` }} />
              </div>
            </div>
          ) : (
            <button onClick={runSync} className="mt-4 rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90">{t.sync.start}</button>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[16rem]">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search.placeholder}
            className="w-full rounded-xl border border-border bg-card py-2.5 ps-10 pe-10 text-sm outline-none focus:border-primary"
          />
          {q && <button onClick={() => setQ("")} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <option value="">{t.filters.type}: {t.filters.all}</option>
          {TYPES.map((tt) => <option key={tt} value={tt}>{typeNames[tt]?.[lang] ?? tt}</option>)}
        </select>
        <select value={gen} onChange={(e) => setGen(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <option value="">{t.filters.generation}: {t.filters.all}</option>
          {[1, 2, 3].map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {isLoading && pokemon.length === 0 && (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      )}

      {!isLoading && filtered.length === 0 && pokemon.length > 0 && (
        <p className="py-16 text-center text-muted-foreground">{t.search.noResults}</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((p) => <PokemonCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
