import type { CSSProperties } from "react";
import { useGameFilter, GAMES } from "@/original/contexts/GameFilterContext";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getPokemonSpriteUrl } from "@/original/lib/imageCache";
import { cn } from "@/original/lib/utils";
import { getGameWorldTheme } from "@/original/lib/gameWorlds";

interface GameFilterChipsProps {
  className?: string;
  compact?: boolean;
}

type GameFilterChipStyle = CSSProperties & {
  "--chip-primary": string;
  "--chip-secondary": string;
  "--chip-glow": string;
};

export function GameFilterChips({ className, compact = false }: GameFilterChipsProps) {
  const { selectedGame, setSelectedGame } = useGameFilter();
  const { language } = useLanguage();

  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide", className)}>
      {GAMES.map((game) => {
        const world = getGameWorldTheme(game.id);
        const isSelected = selectedGame === game.id;
        const label = language === "ar" ? game.labelAr : game.labelEn;
        const fullLabel = language === "ar" ? game.fullNameAr : game.fullNameEn;
        const chipStyle: GameFilterChipStyle = {
          "--chip-primary": world.primary,
          "--chip-secondary": world.secondary,
          "--chip-glow": world.glow,
        };

        return (
          <Button
            key={game.id}
            variant="ghost"
            size="sm"
            onClick={() => setSelectedGame(game.id)}
            style={chipStyle}
            aria-pressed={isSelected}
            title={fullLabel}
            className={cn(
              "game-filter-chip whitespace-nowrap shrink-0 h-9 px-2.5 text-xs font-bold transition-all",
              "border border-border/70 bg-background/55 hover:bg-background/80",
              isSelected && "game-filter-chip-active text-primary-foreground border-transparent",
            )}
          >
            <span className="game-filter-chip-orb" aria-hidden="true">
              <OfflineImage
                src={getPokemonSpriteUrl(world.mascotPokemonIds[0])}
                alt=""
                className="w-5 h-5 object-contain image-render-pixelated"
                placeholderType="pokemon"
              />
            </span>
            <span className={cn(compact && "max-w-16 truncate")}>{label}</span>
            {!compact && (
              <span className="hidden sm:inline text-[10px] opacity-80" aria-hidden="true">
                {world.symbol}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
