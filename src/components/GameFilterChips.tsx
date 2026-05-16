import { GAMES } from "@/lib/games";
import { useGameFilter } from "@/lib/gameFilter";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function GameFilterChips() {
  const { game, setGame } = useGameFilter();
  const { lang } = useI18n();
  return (
    <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2 pt-1 scrollbar-thin">
      {GAMES.map((g) => {
        const active = g.id === game;
        return (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-all",
              active
                ? `${g.accent} text-white border-transparent shadow`
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
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
