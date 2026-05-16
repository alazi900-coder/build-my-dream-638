import { Link } from "@tanstack/react-router";
import type { PokemonRow, EvolutionRow } from "@/lib/pokemon.functions";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight } from "lucide-react";

export function EvolutionChain({
  evolutions,
  chain,
}: {
  evolutions: EvolutionRow[];
  chain: PokemonRow[];
}) {
  const { t, lang } = useI18n();
  if (chain.length <= 1) {
    return <p className="text-sm text-muted-foreground">{t.pokemon.noEvolution}</p>;
  }
  const byId = new Map(chain.map((p) => [p.id, p]));
  // Build stages: roots = pokemon that don't appear as `to_pokemon_id`
  const incoming = new Set(evolutions.map((e) => e.to_pokemon_id));
  const roots = chain.filter((p) => !incoming.has(p.id));
  const stages: PokemonRow[][] = [];
  let current = roots;
  const seen = new Set<number>();
  while (current.length > 0) {
    stages.push(current);
    current.forEach((c) => seen.add(c.id));
    const next: PokemonRow[] = [];
    for (const p of current) {
      for (const e of evolutions.filter((e) => e.from_pokemon_id === p.id)) {
        const to = byId.get(e.to_pokemon_id);
        if (to && !seen.has(to.id)) next.push(to);
      }
    }
    current = next;
    if (stages.length > 5) break;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            {stage.map((p) => {
              const name = lang === "ar" ? (p.name_ar ?? p.name_en) : p.name_en;
              const condition = evolutions.find((e) => e.to_pokemon_id === p.id);
              return (
                <Link
                  key={p.id}
                  to="/pokemon/$id"
                  params={{ id: String(p.id) }}
                  className="group flex flex-col items-center rounded-xl border border-border bg-card p-2 hover:bg-accent"
                >
                  {p.sprite_url && <img src={p.sprite_url} alt={name} className="h-16 w-16" />}
                  <span className="text-sm font-semibold">{name}</span>
                  {condition?.min_level && (
                    <span className="text-xs text-muted-foreground">Lv.{condition.min_level}</span>
                  )}
                  {condition?.item && (
                    <span className="text-xs text-muted-foreground">{condition.item}</span>
                  )}
                </Link>
              );
            })}
          </div>
          {i < stages.length - 1 && (
            <ArrowRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
          )}
        </div>
      ))}
    </div>
  );
}
