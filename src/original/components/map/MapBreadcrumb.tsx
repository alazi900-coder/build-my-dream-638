import { useLanguage } from "@/original/contexts/LanguageContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/original/components/ui/breadcrumb";
import { Home, Map, MapPin } from "lucide-react";
import { GameId } from "@/original/contexts/GameFilterContext";

interface MapBreadcrumbProps {
  game: GameId;
  gameName: string;
  regionName: string;
  locationName?: string;
  onNavigateToRegion: () => void;
}

export function MapBreadcrumb({
  game,
  gameName,
  regionName,
  locationName,
  onNavigateToRegion,
}: MapBreadcrumbProps) {
  const { t } = useLanguage();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">{t("Home", "الرئيسية")}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbLink
            className="flex items-center gap-1 cursor-pointer"
            onClick={onNavigateToRegion}
          >
            <Map className="w-3.5 h-3.5" />
            {regionName}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {locationName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {locationName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
