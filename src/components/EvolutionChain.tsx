import { Link } from "@tanstack/react-router";
import type { PokemonRow, EvolutionRow } from "@/lib/pokemon.functions";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, Sparkles, Heart, Repeat, Gem, Zap, Lightbulb, Swords } from "lucide-react";
import { TypeBadge } from "@/components/TypeBadge";

const ITEM_LABELS: Record<string, { ar: string; en: string }> = {
  "thunder-stone": { ar: "حجر الرعد", en: "Thunder Stone" },
  "fire-stone": { ar: "حجر النار", en: "Fire Stone" },
  "water-stone": { ar: "حجر الماء", en: "Water Stone" },
  "leaf-stone": { ar: "حجر الورقة", en: "Leaf Stone" },
  "moon-stone": { ar: "حجر القمر", en: "Moon Stone" },
  "sun-stone": { ar: "حجر الشمس", en: "Sun Stone" },
  "dusk-stone": { ar: "حجر الغسق", en: "Dusk Stone" },
  "dawn-stone": { ar: "حجر الفجر", en: "Dawn Stone" },
  "shiny-stone": { ar: "الحجر اللامع", en: "Shiny Stone" },
  "kings-rock": { ar: "صخرة الملك", en: "King's Rock" },
  "metal-coat": { ar: "الطلاء المعدني", en: "Metal Coat" },
  "dragon-scale": { ar: "حرشفة التنين", en: "Dragon Scale" },
  "up-grade": { ar: "ترقية", en: "Up-Grade" },
};

const itemIcon = (item: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item}.png`;

function triggerLabel(trigger: string | null, level: number | null, item: string | null) {
  if (item) return { ar: "بالأداة", en: "Use Item" };
  if (trigger === "trade") return { ar: "بالتبادل", en: "Trade" };
  if (trigger === "shed") return { ar: "انسلاخ", en: "Shed" };
  if (trigger === "level-up" && level) return { ar: `المستوى ${level}`, en: `Level ${level}` };
  if (trigger === "level-up") return { ar: "ارفع المستوى", en: "Level Up" };
  return { ar: "خاص", en: "Special" };
}

function triggerIcon(trigger: string | null, item: string | null) {
  if (item) return <Gem className="h-3.5 w-3.5" />;
  if (trigger === "trade") return <Repeat className="h-3.5 w-3.5" />;
  if (trigger === "shed") return <Sparkles className="h-3.5 w-3.5" />;
  return <Zap className="h-3.5 w-3.5" />;
}

// Recommended moves to keep, per type (simple heuristic for in-game team)
const TYPE_MOVE_TIPS: Record<string, { ar: string; en: string }[]> = {
  fire: [
    { ar: "لهب الانفجار", en: "Flamethrower" },
    { ar: "نار شديدة", en: "Fire Blast" },
  ],
  water: [
    { ar: "نبضة المياه", en: "Surf" },
    { ar: "تيار الماء", en: "Hydro Pump" },
  ],
  grass: [
    { ar: "قاطع الورقة", en: "Leaf Blade" },
    { ar: "قنبلة بذور", en: "Seed Bomb" },
  ],
  electric: [
    { ar: "صاعقة الرعد", en: "Thunderbolt" },
    { ar: "موجة الرعد", en: "Thunder Wave" },
  ],
  psychic: [
    { ar: "نفسية", en: "Psychic" },
    { ar: "تركيز شديد", en: "Calm Mind" },
  ],
  ice: [
    { ar: "شعاع الجليد", en: "Ice Beam" },
    { ar: "البرد القارس", en: "Blizzard" },
  ],
  dragon: [
    { ar: "نبضة التنين", en: "Dragon Pulse" },
    { ar: "غضب التنين", en: "Outrage" },
  ],
  ghost: [
    { ar: "كرة الظل", en: "Shadow Ball" },
    { ar: "مخلب الظل", en: "Shadow Claw" },
  ],
  dark: [
    { ar: "نبضة الظلام", en: "Dark Pulse" },
    { ar: "أنياب الظلام", en: "Crunch" },
  ],
  steel: [
    { ar: "مخلب فولاذي", en: "Iron Head" },
    { ar: "حركة الفلاش", en: "Flash Cannon" },
  ],
  fighting: [
    { ar: "تركيز قوي", en: "Close Combat" },
    { ar: "ضربة الحجر", en: "Cross Chop" },
  ],
  rock: [
    { ar: "حافة الحجر", en: "Stone Edge" },
    { ar: "انهيار صخري", en: "Rock Slide" },
  ],
  ground: [
    { ar: "زلزال", en: "Earthquake" },
    { ar: "حفر", en: "Dig" },
  ],
  flying: [
    { ar: "زوبعة الجو", en: "Aerial Ace" },
    { ar: "ضربة العاصفة", en: "Hurricane" },
  ],
  bug: [
    { ar: "نفجة الحشرات", en: "Bug Buzz" },
    { ar: "تذكرة الفضة", en: "X-Scissor" },
  ],
  poison: [
    { ar: "نفجة السم", en: "Sludge Bomb" },
    { ar: "السم القوي", en: "Toxic" },
  ],
  normal: [
    { ar: "ضربة جسد", en: "Body Slam" },
    { ar: "هايبر بيم", en: "Hyper Beam" },
  ],
  fairy: [
    { ar: "نبضة المون بلاست", en: "Moonblast" },
    { ar: "ضربة برية", en: "Play Rough" },
  ],
};

function evolutionTip(p: PokemonRow, lang: "ar" | "en") {
  const stats = p.stats || {};
  const atk = Number(stats.attack ?? 0);
  const spa = Number(stats["special-attack"] ?? 0);
  const spe = Number(stats.speed ?? 0);
  if (atk >= spa + 15)
    return lang === "ar"
      ? "هجومه الجسدي قوي — ركّز على الحركات الفيزيائية."
      : "Strong physical attacker — focus on physical moves.";
  if (spa >= atk + 15)
    return lang === "ar"
      ? "هجومه الخاص ممتاز — اختر حركات خاصة قوية."
      : "Strong special attacker — pick powerful special moves.";
  if (spe >= 100)
    return lang === "ar"
      ? "سريع جداً — استفد من السرعة لضرب أولاً."
      : "Very fast — strike first with priority moves.";
  return lang === "ar"
    ? "متوازن — نوّع بين حركات هجومية ودفاعية."
    : "Balanced stats — mix offensive and supportive moves.";
}

export function EvolutionChain({
  evolutions,
  chain,
}: {
  evolutions: EvolutionRow[];
  chain: PokemonRow[];
}) {
  const { t, lang } = useI18n();

  if (chain.length <= 1 || evolutions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.pokemon.noEvolution}</p>;
  }

  const byId = new Map(chain.map((p) => [p.id, p]));
  const incoming = new Set(evolutions.map((e) => e.to_pokemon_id));
  const roots = chain.filter((p) => !incoming.has(p.id));

  // Build stages via BFS
  const stages: PokemonRow[][] = [];
  let current = roots.length > 0 ? roots : [chain[0]];
  const seen = new Set<number>();
  while (current.length > 0) {
    stages.push(current);
    current.forEach((c) => seen.add(c.id));
    const next: PokemonRow[] = [];
    for (const p of current) {
      for (const e of evolutions.filter((e) => e.from_pokemon_id === p.id)) {
        const to = byId.get(e.to_pokemon_id);
        if (to && !seen.has(to.id) && !next.find((n) => n.id === to.id)) next.push(to);
      }
    }
    current = next;
    if (stages.length > 6) break;
  }

  return (
    <div className="space-y-6">
      {/* Visual chain */}
      <div className="flex flex-wrap items-start gap-3 overflow-x-auto">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col gap-3">
              {stage.map((p) => {
                const name = lang === "ar" ? (p.name_ar ?? p.name_en) : p.name_en;
                const edge = evolutions.find((e) => e.to_pokemon_id === p.id);
                const label = edge
                  ? triggerLabel(edge.trigger, edge.min_level, edge.item)
                  : null;
                const itemKey = edge?.item ?? null;
                const itemLabel = itemKey
                  ? (ITEM_LABELS[itemKey]?.[lang] ?? itemKey.replace(/-/g, " "))
                  : null;
                return (
                  <Link
                    key={p.id}
                    to="/pokemon/$id"
                    params={{ id: String(p.id) }}
                    className="group flex w-32 flex-col items-center rounded-xl border border-border bg-card p-3 transition hover:border-primary hover:bg-accent"
                  >
                    {(p.artwork_url || p.sprite_url) && (
                      <img
                        src={p.artwork_url ?? p.sprite_url ?? ""}
                        alt={name}
                        loading="lazy"
                        className="h-20 w-20 object-contain transition group-hover:scale-110"
                      />
                    )}
                    <span className="mt-1 text-center text-sm font-semibold">{name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      #{String(p.id).padStart(3, "0")}
                    </span>
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {p.types.map((tt) => (
                        <TypeBadge key={tt} type={tt} size="sm" />
                      ))}
                    </div>
                    {label && (
                      <div className="mt-2 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {triggerIcon(edge!.trigger, edge!.item)}
                        <span>{label[lang]}</span>
                      </div>
                    )}
                    {itemKey && (
                      <div className="mt-1 flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1">
                        <img
                          src={itemIcon(itemKey)}
                          alt={itemLabel ?? itemKey}
                          className="h-5 w-5 object-contain"
                          loading="lazy"
                        />
                        <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                          {itemLabel}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            {i < stages.length - 1 && (
              <ArrowRight className="mt-12 h-5 w-5 shrink-0 text-muted-foreground rtl:rotate-180" />
            )}
          </div>
        ))}
      </div>

      {/* Tips and recommended moves per evolved form */}
      <div className="grid gap-3 md:grid-cols-2">
        {chain
          .filter((p) => incoming.has(p.id) || stages[0]?.some((r) => r.id === p.id))
          .map((p) => {
            const name = lang === "ar" ? (p.name_ar ?? p.name_en) : p.name_en;
            const tip = evolutionTip(p, lang);
            const moves = p.types
              .flatMap((tt) => TYPE_MOVE_TIPS[tt] ?? [])
              .slice(0, 4);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-muted/30 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  {p.sprite_url && (
                    <img src={p.sprite_url} alt={name} className="h-10 w-10" />
                  )}
                  <h3 className="font-bold">{name}</h3>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-muted-foreground">{tip}</p>
                </div>
                {moves.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                      <Swords className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {lang === "ar" ? "حركات يُنصح بالاحتفاظ بها" : "Recommended moves"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {moves.map((m, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                        >
                          {m[lang]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
