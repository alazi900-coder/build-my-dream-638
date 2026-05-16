import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGameFilter } from "@/lib/gameFilter";
import { getItemsForGame, itemSprite, getGame, type ItemCategory, type ItemDef } from "@/lib/games";
import { useI18n } from "@/lib/i18n/context";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/items")({ component: ItemsPage });

const CATEGORY_AR: Record<ItemCategory, string> = {
  healing: "شفاء", balls: "كرات", berries: "توت", evolution: "تطور",
  held: "أدوات محمولة", tm: "أقراص فنية", key: "أدوات مفتاحية", treasure: "كنوز",
};
const CATEGORY_EN: Record<ItemCategory, string> = {
  healing: "Healing", balls: "Poké Balls", berries: "Berries", evolution: "Evolution",
  held: "Held Items", tm: "TMs", key: "Key Items", treasure: "Treasures",
};

function ItemsPage() {
  const { lang } = useI18n();
  const { game } = useGameFilter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ItemCategory | "">("");
  const all = getItemsForGame(game);
  const gameInfo = getGame(game);
  const gameName = lang === "ar" ? gameInfo.fullNameAr : gameInfo.fullNameEn;

  const categories = useMemo(
    () => Array.from(new Set(all.map((i) => i.category))) as ItemCategory[],
    [all],
  );

  const filtered = useMemo(() => {
    return all.filter((i) => {
      if (cat && i.category !== cat) return false;
      if (q) {
        const needle = q.toLowerCase().trim();
        const name = lang === "ar" ? i.name_ar : i.name_en;
        if (!name.toLowerCase().includes(needle) && !i.name_en.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [all, q, cat, lang]);

  const catLabel = (c: ItemCategory) => (lang === "ar" ? CATEGORY_AR[c] : CATEGORY_EN[c]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{lang === "ar" ? "أدوات البوكيمون" : "Pokémon Items"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "ar" ? "الأدوات المتاحة في" : "Items available in"} {gameName}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {filtered.length} {lang === "ar" ? "أداة" : "items"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[16rem]">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "ar" ? "ابحث عن أداة..." : "Search items..."}
            className="w-full rounded-xl border border-border bg-card py-2.5 ps-10 pe-10 text-sm outline-none focus:border-primary"
          />
          {q && <button onClick={() => setQ("")} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setCat("")} className={`rounded-full border px-3 py-1 text-xs font-medium ${cat === "" ? "bg-primary text-primary-foreground border-transparent" : "border-border bg-card text-muted-foreground"}`}>
          {lang === "ar" ? "الكل" : "All"}
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs font-medium ${cat === c ? "bg-primary text-primary-foreground border-transparent" : "border-border bg-card text-muted-foreground"}`}>
            {catLabel(c)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{lang === "ar" ? "لا توجد نتائج" : "No results"}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((i) => <ItemCard key={i.id} item={i} catLabel={catLabel} />)}
      </div>
    </div>
  );
}

function ItemCard({ item, catLabel }: { item: ItemDef; catLabel: (c: ItemCategory) => string }) {
  const { lang } = useI18n();
  const name = lang === "ar" ? item.name_ar : item.name_en;
  return (
    <Link
      to="/items/$id"
      params={{ id: item.id }}
      className="group relative flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <img src={itemSprite(item)} alt={name} loading="lazy" className="h-12 w-12 object-contain transition-transform group-hover:scale-110" />
      </div>
      <h3 className="mt-2 text-sm font-bold">{name}</h3>
      <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{catLabel(item.category)}</span>
    </Link>
  );
}
