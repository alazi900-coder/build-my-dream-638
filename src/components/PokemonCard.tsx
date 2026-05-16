import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { TypeBadge } from "./TypeBadge";
import type { PokemonRow } from "@/lib/pokemon.functions";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function PokemonCard({
  p,
  discovered = false,
  favorite = false,
  onDiscover,
  onToggleFavorite,
}: {
  p: PokemonRow;
  discovered?: boolean;
  favorite?: boolean;
  onDiscover?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}) {
  const { lang } = useI18n();
  const displayName = lang === "ar" ? (p.name_ar ?? p.name_en) : p.name_en;
  const secondaryName = lang === "ar" ? p.name_en : (p.name_ar ?? p.name_en);
  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border-2 border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
      <div className="absolute end-3 top-3 z-10 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
        {discovered ? (lang === "ar" ? "تمت المشاهدة" : "Seen") : lang === "ar" ? "جديد" : "New"}
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleFavorite?.(p.id);
        }}
        className={cn(
          "absolute start-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-card/90 transition-colors",
          favorite
            ? "border-primary text-primary"
            : "border-border text-muted-foreground hover:text-primary",
        )}
        aria-label={favorite ? "Remove favorite" : "Add favorite"}
      >
        <Star className={cn("h-4 w-4", favorite && "fill-current")} />
      </button>
      <Link
        to="/pokemon/$id"
        params={{ id: String(p.id) }}
        onClick={() => onDiscover?.(p.id)}
        className="block pt-8 text-center"
      >
        <div className="flex aspect-square items-center justify-center rounded-[1.3rem] bg-muted/70 p-4">
          {p.sprite_url || p.artwork_url ? (
            <img
              src={p.sprite_url ?? p.artwork_url ?? ""}
              alt={displayName}
              loading="lazy"
              className="h-28 w-28 object-contain image-render-pixelated transition-transform group-hover:scale-110 sm:h-32 sm:w-32"
            />
          ) : (
            <div className="h-28 w-28 sm:h-32 sm:w-32" />
          )}
        </div>
        <div className="mt-4 text-end">
          <span className="text-sm font-black tracking-wide text-muted-foreground">
            #{String(p.id).padStart(3, "0")}
          </span>
          <h3 className="mt-1 text-2xl font-black leading-tight text-foreground">{displayName}</h3>
          <p className="text-base font-medium text-muted-foreground">{secondaryName}</p>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {p.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </Link>
    </article>
  );
}
