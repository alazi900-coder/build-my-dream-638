import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Globe, Gamepad2 } from "lucide-react";
import { GameFilterChips } from "@/original/components/GameFilterChips";
import { GlobalSearch } from "@/original/components/GlobalSearch";
import { SyncStatusButton } from "./SyncStatusButton";

export function Header() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
            aria-hidden="true"
          >
            <Gamepad2 className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">
              {t("Pokédex Guide", "دليل البوكيديكس")}
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {t("Switch Games", "ألعاب سويتش")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <GlobalSearch />
          <SyncStatusButton />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="gap-1.5 text-sm font-medium h-9"
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
