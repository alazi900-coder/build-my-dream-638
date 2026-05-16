import { computeEffectiveness, groupEffectiveness } from "@/lib/typeChart";
import { TypeBadge } from "./TypeBadge";
import { useI18n } from "@/lib/i18n/context";

export function TypeEffectiveness({ types }: { types: string[] }) {
  const { t } = useI18n();
  const eff = computeEffectiveness(types);
  const { weak4, weak2, resist05, resist025, immune } = groupEffectiveness(eff);
  const Section = ({ label, items, mult }: { label: string; items: string[]; mult?: string }) =>
    items.length > 0 ? (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
          {label} {mult && <span className="text-xs">{mult}</span>}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
    ) : null;
  return (
    <div className="space-y-4">
      <Section label={t.effectiveness.weakTo} items={weak4} mult="×4" />
      <Section label={t.effectiveness.weakTo} items={weak2} mult="×2" />
      <Section label={t.effectiveness.resistantTo} items={resist05} mult="×0.5" />
      <Section label={t.effectiveness.resistantTo} items={resist025} mult="×0.25" />
      <Section label={t.effectiveness.immuneTo} items={immune} mult="×0" />
    </div>
  );
}
