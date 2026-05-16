import { useGameFilter, GAMES } from "@/original/contexts/GameFilterContext";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface NotAvailableBannerProps {
  entityName?: string;
}

export function NotAvailableBanner({ entityName }: NotAvailableBannerProps) {
  const { selectedGame, setSelectedGame, getGameInfo } = useGameFilter();
  const { t, language } = useLanguage();

  const gameInfo = getGameInfo(selectedGame);
  const gameName = language === "ar" ? gameInfo?.labelAr : gameInfo?.labelEn;

  return (
    <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-4 flex flex-col items-center gap-3 text-center">
      <AlertTriangle className="w-8 h-8 text-destructive" />
      <div>
        <p className="font-semibold text-destructive">
          {t("Not available in selected game", "غير متوفر في اللعبة المحددة")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {entityName
            ? t(
                `${entityName} is not available in ${gameName}`,
                `${entityName} غير متوفر في ${gameName}`,
              )
            : t(
                `This content is not available in ${gameName}`,
                `هذا المحتوى غير متوفر في ${gameName}`,
              )}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => setSelectedGame("all")} className="mt-1">
        {t("Show All Games", "عرض جميع الألعاب")}
      </Button>
    </div>
  );
}
