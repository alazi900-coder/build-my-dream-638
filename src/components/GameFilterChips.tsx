import { GAMES } from "@/lib/games";
import { useGameFilter } from "@/lib/gameFilter";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function GameFilterChips() {
  const { game, setGame } = useGameFilter();
  const { lang } = useI18n();
  return (
    <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto px-4 pb-4 pt-2 scrollbar-thin">
      {GAMES.map((g) => {
        const active = g.id === game;
        return (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2.5 text-base font-black whitespace-nowrap transition-all sm:text-lg",
              active
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title={lang === "ar" ? g.fullNameAr : g.fullNameEn}
          >
            {lang === "ar" ? g.labelAr : g.labelEn}
          </button>
        );
      })}
    </div>
  );
}
