import { useI18n } from "@/lib/i18n/context";

const STAT_KEYS = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
] as const;

export function StatsBars({ stats }: { stats: Record<string, number> }) {
  const { t } = useI18n();
  const max = 200;
  const total = STAT_KEYS.reduce((s, k) => s + (stats[k] ?? 0), 0);
  return (
    <div className="space-y-2">
      {STAT_KEYS.map((k) => {
        const v = stats[k] ?? 0;
        const pct = Math.min(100, (v / max) * 100);
        const color =
          v >= 100
            ? "bg-type-grass"
            : v >= 70
              ? "bg-type-electric"
              : v >= 40
                ? "bg-type-fire"
                : "bg-destructive";
        return (
          <div key={k} className="grid grid-cols-[7rem_3rem_1fr] items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t.stats[k]}</span>
            <span className="font-semibold tabular-nums">{v}</span>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-[7rem_3rem_1fr] items-center gap-2 border-t border-border pt-2 text-sm font-bold">
        <span>{t.stats.total}</span>
        <span className="tabular-nums">{total}</span>
        <div />
      </div>
    </div>
  );
}
