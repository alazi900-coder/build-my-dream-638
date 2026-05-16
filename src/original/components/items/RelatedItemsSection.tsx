import { Link } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getItemSpriteUrl } from "@/original/lib/itemUtils";
import { Link2 } from "lucide-react";

interface Item {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
}

interface RelatedItemsSectionProps {
  currentItemId: number;
  category: string;
  allItems: Item[];
}

export function RelatedItemsSection({
  currentItemId,
  category,
  allItems,
}: RelatedItemsSectionProps) {
  const { language } = useLanguage();

  // Get up to 8 items from the same category, excluding current item
  const relatedItems = allItems
    .filter((item) => item.category === category && item.id !== currentItemId)
    .slice(0, 8);

  if (relatedItems.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="w-5 h-5 text-primary" />
          {language === "ar" ? "أدوات مشابهة" : "Similar Items"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {relatedItems.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              className="flex flex-col items-center p-2 bg-muted/30 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <OfflineImage
                  src={getItemSpriteUrl(item.name_en)}
                  alt={item.name_en}
                  className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                  placeholderType="item"
                />
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1 line-clamp-2 leading-tight">
                {language === "ar" && item.name_ar ? item.name_ar : item.name_en}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
