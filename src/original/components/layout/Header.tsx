import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Button } from "@/original/components/ui/button";
import { Globe, MapPin, Sparkles } from "lucide-react";
import { GameFilterChips } from "@/original/components/GameFilterChips";
import { GlobalSearch } from "@/original/components/GlobalSearch";
import { SyncStatusButton } from "./SyncStatusButton";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getPokemonSpriteUrl } from "@/original/lib/imageCache";
import { cn } from "@/original/lib/utils";
import {
  getGameWorldTheme,
  getLocalizedWorldName,
  getLocalizedWorldTitle,
} from "@/original/lib/gameWorlds";

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { selectedGame } = useGameFilter();
  const world = getGameWorldTheme(selectedGame);
  const regionName = getLocalizedWorldName(world, language);
  const worldTitle = getLocalizedWorldTitle(world, language);
  const landmark = language === "ar" ? world.landmarkAr : world.landmarkEn;

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <header className="pokemon-world-header sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
      <div className="flex items-center justify-between min-h-16 px-4 py-2 max-w-lg mx-auto gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="world-emblem relative w-11 h-11 rounded-2xl flex items-center justify-center"
            aria-hidden="true"
          >
            <Sparkles className="absolute -top-1 -end-1 w-4 h-4 text-primary animate-pulse" />
            <OfflineImage
              src={getPokemonSpriteUrl(world.mascotPokemonIds[0])}
              alt=""
              className="w-9 h-9 object-contain image-render-pixelated drop-shadow-lg"
              placeholderType="pokemon"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base leading-tight truncate text-gradient-pokemon">
                {t("Pokédex Guide", "دليل البوكيديكس")}
              </h1>
              <span className="world-symbol-pill" aria-hidden="true">
                {world.symbol}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight truncate">
              <span className="font-semibold text-primary">{regionName}</span>
              <span className="mx-1">•</span>
              {worldTitle}
            </p>
            <p className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground leading-tight truncate">
              <MapPin className="w-3 h-3 text-primary" aria-hidden="true" />
              {landmark}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <GlobalSearch />
          <SyncStatusButton />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className={cn("gap-1.5 text-sm font-medium h-9", "border-primary/30 bg-background/70")}
            aria-label={t("Switch language", "تبديل اللغة")}
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span lang={language === "en" ? "ar" : "en"}>{language === "en" ? "عربي" : "EN"}</span>
          </Button>
        </div>
      </div>

      {/* Game Filter - Visible on all pages */}
      <nav className="px-4 pb-2 max-w-lg mx-auto" aria-label={t("Game filter", "فلتر الألعاب")}>
        <GameFilterChips />
      </nav>
    </header>
  );
}
