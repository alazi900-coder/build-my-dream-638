import { useGameFilter, GAMES, GameId } from "@/original/contexts/GameFilterContext";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { cn } from "@/original/lib/utils";

interface GameFilterChipsProps {
  className?: string;
  compact?: boolean;
}

export function GameFilterChips({ className, compact = false }: GameFilterChipsProps) {
  const { selectedGame, setSelectedGame } = useGameFilter();
  const { language } = useLanguage();

  return (
    <div className={cn("flex gap-1.5 overflow-x-auto scrollbar-hide", className)}>
      {GAMES.map((game) => (
        <Button
          key={game.id}
          variant={selectedGame === game.id ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedGame(game.id)}
          className={cn(
            "whitespace-nowrap shrink-0 h-7 px-2.5 text-xs font-medium transition-all",
            selectedGame === game.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {compact
            ? language === "ar"
              ? game.labelAr
              : game.labelEn
            : language === "ar"
              ? game.labelAr
              : game.labelEn}
        </Button>
      ))}
    </div>
  );
}
