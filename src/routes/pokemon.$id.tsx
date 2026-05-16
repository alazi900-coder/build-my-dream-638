import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPokemon } from "@/lib/pokemon.functions";
import { useI18n } from "@/lib/i18n/context";
import { TypeBadge, typeBgClass } from "@/components/TypeBadge";
import { StatsBars } from "@/components/StatsBars";
import { EvolutionChain } from "@/components/EvolutionChain";
import { TypeEffectiveness } from "@/components/TypeEffectiveness";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pokemon/$id")({ component: PokemonDetailPage });

function PokemonDetailPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pokemon", id],
    queryFn: () => getPokemon({ data: { id: Number(id) } }),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (error || !data)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p>{t.error}</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          {t.backHome}
        </Link>
      </div>
    );

  const p = data.pokemon;
  const name = lang === "ar" ? (p.name_ar ?? p.name_en) : p.name_en;
  const desc = lang === "ar" ? (p.description_ar ?? p.description_en) : p.description_en;
  const primary = p.types[0] ?? "normal";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" /> {t.backHome}
      </Link>

      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 md:p-8 pokeball-bg",
          typeBgClass(primary),
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/5 dark:from-black/30 dark:to-black/60" />
        <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr]">
          {(p.artwork_url || p.sprite_url) && (
            <img
              src={p.artwork_url ?? p.sprite_url ?? ""}
              alt={name}
              className="mx-auto h-48 w-48 object-contain drop-shadow-xl md:h-64 md:w-64"
            />
          )}
          <div className="text-center text-white md:text-start">
            <span className="text-sm font-bold opacity-80">#{String(p.id).padStart(3, "0")}</span>
            <h1 className="text-3xl font-bold drop-shadow md:text-5xl">{name}</h1>
            <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
              {p.types.map((tt) => (
                <TypeBadge key={tt} type={tt} size="lg" />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-black/20 px-3 py-2">
                <div className="opacity-80">{t.pokemon.height}</div>
                <div className="font-semibold">
                  {(p.height / 10).toFixed(1)} {t.pokemon.meters}
                </div>
              </div>
              <div className="rounded-lg bg-black/20 px-3 py-2">
                <div className="opacity-80">{t.pokemon.weight}</div>
                <div className="font-semibold">
                  {(p.weight / 10).toFixed(1)} {t.pokemon.kilograms}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {desc && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-lg font-bold">{t.pokemon.description}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </section>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">{t.pokemon.stats}</h2>
          <StatsBars stats={p.stats} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">{t.pokemon.abilities}</h2>
          <ul className="space-y-1.5">
            {p.abilities.map((a) => (
              <li key={a} className="rounded-md bg-muted px-3 py-1.5 text-sm">
                {a.replace(/-/g, " ")}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-bold">{t.pokemon.evolution}</h2>
        <EvolutionChain
          evolutions={data.evolutions}
          chain={data.chainPokemon.length > 0 ? data.chainPokemon : [p]}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-bold">{t.pokemon.effectiveness}</h2>
        <TypeEffectiveness types={p.types} />
      </section>
    </div>
  );
}
