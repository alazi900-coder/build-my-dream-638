import type { CSSProperties, ReactNode } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { OfflineIndicator } from "@/original/components/OfflineIndicator";
import { DownloadProgressBar } from "./DownloadProgressBar";
import { cn } from "@/original/lib/utils";
import { getGameWorldTheme } from "@/original/lib/gameWorlds";

interface LayoutProps {
  children: ReactNode;
}

type GameWorldCSSProperties = CSSProperties & {
  "--primary": string;
  "--ring": string;
  "--sidebar-primary": string;
  "--world-primary": string;
  "--world-secondary": string;
  "--world-accent": string;
  "--world-glow": string;
  "--world-terrain": string;
  "--world-pattern": string;
};

export function Layout({ children }: LayoutProps) {
  const { isRTL } = useLanguage();
  const { selectedGame } = useGameFilter();
  const world = getGameWorldTheme(selectedGame);
  const worldStyle: GameWorldCSSProperties = {
    "--primary": world.primary,
    "--ring": world.primary,
    "--sidebar-primary": world.primary,
    "--world-primary": world.primary,
    "--world-secondary": world.secondary,
    "--world-accent": world.accent,
    "--world-glow": world.glow,
    "--world-terrain": world.terrain,
    "--world-pattern": world.pattern,
  };

  return (
    <div
      className={cn("game-world-shell min-h-screen bg-background flex flex-col", world.worldClass)}
      data-game-world={selectedGame}
      dir={isRTL ? "rtl" : "ltr"}
      style={worldStyle}
    >
      <div className="game-world-aurora" aria-hidden="true" />
      <div className="game-world-map-lines" aria-hidden="true" />
      <OfflineIndicator />
      <Header />
      <main className="relative z-10 flex-1 pb-20 overflow-auto">{children}</main>
      <DownloadProgressBar />
      <BottomNav />
    </div>
  );
}
