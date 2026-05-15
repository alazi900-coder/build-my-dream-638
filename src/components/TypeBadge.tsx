import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const TYPE_BG: Record<string, string> = {
  normal: "bg-type-normal", fire: "bg-type-fire", water: "bg-type-water",
  electric: "bg-type-electric", grass: "bg-type-grass", ice: "bg-type-ice",
  fighting: "bg-type-fighting", poison: "bg-type-poison", ground: "bg-type-ground",
  flying: "bg-type-flying", psychic: "bg-type-psychic", bug: "bg-type-bug",
  rock: "bg-type-rock", ghost: "bg-type-ghost", dragon: "bg-type-dragon",
  dark: "bg-type-dark", steel: "bg-type-steel", fairy: "bg-type-fairy",
};

export function TypeBadge({ type, size = "md" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const { typeName } = useI18n();
  const bg = TYPE_BG[type] ?? "bg-muted";
  const sizeCls = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-base px-4 py-1.5" : "text-sm px-3 py-1";
  return (
    <span className={cn("inline-flex items-center rounded-full font-semibold text-white shadow-sm", bg, sizeCls)}>
      {typeName(type)}
    </span>
  );
}

export function typeBgClass(type: string) {
  return TYPE_BG[type] ?? "bg-muted";
}
