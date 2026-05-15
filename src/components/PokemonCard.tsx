import { Link } from "@tanstack/react-router";
import { TypeBadge, typeBgClass } from "./TypeBadge";
import type { PokemonRow } from "@/lib/pokemon.functions";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function PokemonCard({ p }: { p: PokemonRow }) {
  const { lang } = useI18n();
  const name = lang === "ar" ? p.name_ar ?? p.name_en : p.name_en;
  const primary = p.types[0] ?? "normal";
  return (
    <Link
      to="/pokemon/$id"
      params={{ id: String(p.id) }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg pokeball-bg",
        typeBgClass(primary),
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-black/30 dark:to-black/60" />
      <div className="relative flex flex-col items-center text-center">
        <span className="text-xs font-bold text-white/90 drop-shadow">#{String(p.id).padStart(3, "0")}</span>
        {p.artwork_url || p.sprite_url ? (
          <img
            src={p.artwork_url ?? p.sprite_url ?? ""}
            alt={name}
            loading="lazy"
            className="mx-auto h-32 w-32 object-contain transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="h-32 w-32" />
        )}
        <h3 className="mt-1 text-lg font-bold text-white drop-shadow">{name}</h3>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {p.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
    </Link>
  );
}
