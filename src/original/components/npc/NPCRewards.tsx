import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { Gift, Star, Package, Sparkles } from "lucide-react";

interface Reward {
  type: "item" | "pokemon" | "tm" | "badge";
  name_en: string;
  name_ar?: string;
  imageUrl?: string;
  rarity?: "common" | "rare" | "legendary";
}

interface NPCRewardsProps {
  rewards: Reward[];
  npcName: string;
}

const rarityColors: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-chart-2/20 text-chart-2",
  legendary: "bg-chart-3/20 text-chart-3",
};

const typeIcons: Record<string, React.ElementType> = {
  item: Package,
  pokemon: Sparkles,
  tm: Star,
  badge: Star,
};

export function NPCRewards({ rewards, npcName }: NPCRewardsProps) {
  const { language } = useLanguage();

  if (rewards.length === 0) {
    return (
      <Card className="border-muted/30">
        <CardContent className="p-4 text-center">
          <Gift className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {language === "ar" ? "لا توجد مكافآت معروفة" : "No known rewards"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-chart-3/30 bg-gradient-to-br from-chart-3/10 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="w-4 h-4 text-chart-3" />
          {language === "ar" ? "المكافآت" : "Rewards"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          {language === "ar"
            ? `يمكنك الحصول على هذه المكافآت من ${npcName}`
            : `You can obtain these rewards from ${npcName}`}
        </p>

        <div className="space-y-2">
          {rewards.map((reward, idx) => {
            const Icon = typeIcons[reward.type] || Package;
            const rarityClass = rarityColors[reward.rarity || "common"];

            return (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                {reward.imageUrl ? (
                  <OfflineImage
                    src={reward.imageUrl}
                    alt={language === "ar" ? reward.name_ar || reward.name_en : reward.name_en}
                    className="w-8 h-8"
                    placeholderType="item"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {language === "ar" ? reward.name_ar || reward.name_en : reward.name_en}
                  </p>
                </div>
                {reward.rarity && reward.rarity !== "common" && (
                  <Badge variant="outline" className={`text-xs ${rarityClass}`}>
                    {language === "ar"
                      ? reward.rarity === "rare"
                        ? "نادر"
                        : "أسطوري"
                      : reward.rarity}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
