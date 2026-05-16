import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { getItem, itemSprite, GAMES, GAME_ITEM_IDS } from "@/lib/games";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/items/$id")({ component: ItemDetailPage });

function ItemDetailPage() {
  const { id } = useParams({ from: "/items/$id" });
  const { lang } = useI18n();
  const item = getItem(id);

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{lang === "ar" ? "أداة غير موجودة" : "Item not found"}</h1>
        <Link to="/items" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          {lang === "ar" ? "العودة للأدوات" : "Back to items"}
        </Link>
      </div>
    );
  }

  const name = lang === "ar" ? item.name_ar : item.name_en;
  const desc = lang === "ar" ? item.description_ar : item.description_en;
  const availableIn = GAMES.filter((g) => g.id !== "all" && GAME_ITEM_IDS[g.id as Exclude<typeof g.id, "all">].includes(item.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/items" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {lang === "ar" ? "العودة" : "Back"}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted">
            <img src={itemSprite(item)} alt={name} className="h-16 w-16 object-contain" />
          </div>
          <div className="flex-1 text-center sm:text-start">
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{lang === "ar" ? item.name_en : item.name_ar}</p>
            <span className="mt-2 inline-block rounded-full bg-muted px-3 py-0.5 text-xs uppercase">{item.category}</span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">{lang === "ar" ? "الوصف" : "Description"}</h2>
          <p className="text-base leading-relaxed">{desc}</p>
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">{lang === "ar" ? "متاحة في" : "Available in"}</h2>
          <div className="flex flex-wrap gap-2">
            {availableIn.map((g) => (
              <span key={g.id} className={`rounded-full px-3 py-1 text-xs font-medium text-white ${g.accent}`}>
                {lang === "ar" ? g.fullNameAr : g.fullNameEn}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
