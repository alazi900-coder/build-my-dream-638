import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { Package, Gem, AlertCircle } from "lucide-react";

interface Item {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
}

interface LocationHiddenItemsProps {
  items: Item[];
  locationName: string;
}

const categoryColors: Record<string, string> = {
  healing: "bg-green-500/20 text-green-300 border-green-500/30",
  evolution: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  balls: "bg-red-500/20 text-red-300 border-red-500/30",
  held: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  battle: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  key: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  tm: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

export function LocationHiddenItems({ items, locationName }: LocationHiddenItemsProps) {
  const { language } = useLanguage();

  if (items.length === 0) {
    return (
      <Card className="border-muted/30">
        <CardContent className="p-4 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {language === "ar"
              ? "لا توجد عناصر معروفة في هذا الموقع"
              : "No known items at this location"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-chart-4/30 bg-gradient-to-br from-chart-4/10 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gem className="w-4 h-4 text-chart-4" />
          {language === "ar" ? "العناصر المخفية" : "Hidden Items"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {items.slice(0, 8).map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <OfflineImage
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.name_en.toLowerCase().replace(/ /g, "-")}.png`}
                alt={language === "ar" ? item.name_ar : item.name_en}
                className="w-6 h-6"
                placeholderType="item"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {language === "ar" ? item.name_ar || item.name_en : item.name_en}
                </p>
              </div>
            </div>
          ))}
        </div>

        {items.length > 8 && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            {language === "ar"
              ? `+${items.length - 8} عنصر آخر`
              : `+${items.length - 8} more items`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
