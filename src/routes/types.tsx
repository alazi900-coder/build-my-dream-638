import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TYPES, getMultiplier, type PokemonType } from "@/lib/typeChart";
import { TypeBadge } from "@/components/TypeBadge";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/types")({ component: TypesPage });

function TypesPage() {
  const { t } = useI18n();
  const [attacker, setAttacker] = useState<PokemonType>("fire");
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold md:text-3xl">{t.typeChart.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.typeChart.subtitle}</p>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t.typeChart.attacker}</h2>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((tt) => (
            <button
              key={tt}
              onClick={() => setAttacker(tt)}
              className={cn(
                "rounded-full transition-transform",
                attacker === tt
                  ? "ring-2 ring-foreground scale-110"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <TypeBadge type={tt} size="sm" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t.typeChart.defender}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((def) => {
            const mult = getMultiplier(attacker, def);
            const label = mult === 0 ? "×0" : `×${mult}`;
            const color =
              mult === 0
                ? "bg-muted text-muted-foreground"
                : mult >= 2
                  ? "bg-type-grass/20 text-foreground"
                  : mult <= 0.5
                    ? "bg-type-fire/20 text-foreground"
                    : "bg-card";
            return (
              <div
                key={def}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-border px-3 py-2",
                  color,
                )}
              >
                <TypeBadge type={def} size="sm" />
                <span className="font-bold tabular-nums">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
