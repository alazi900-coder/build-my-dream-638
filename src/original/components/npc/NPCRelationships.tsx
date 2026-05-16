import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { Users, Heart, Swords, HelpCircle } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface NPC {
  id: number;
  name_en: string;
  name_ar: string;
  image_url?: string | null;
  category: string;
}

interface Relationship {
  npc: NPC;
  type: "ally" | "rival" | "mentor" | "student" | "family";
}

interface NPCRelationshipsProps {
  relationships: Relationship[];
}

const relationshipLabels: Record<
  string,
  { en: string; ar: string; icon: React.ElementType; color: string }
> = {
  ally: { en: "Ally", ar: "حليف", icon: Heart, color: "bg-green-500/20 text-green-300" },
  rival: { en: "Rival", ar: "منافس", icon: Swords, color: "bg-red-500/20 text-red-300" },
  mentor: { en: "Mentor", ar: "مُعلّم", icon: HelpCircle, color: "bg-blue-500/20 text-blue-300" },
  student: { en: "Student", ar: "تلميذ", icon: Users, color: "bg-purple-500/20 text-purple-300" },
  family: { en: "Family", ar: "عائلة", icon: Heart, color: "bg-pink-500/20 text-pink-300" },
};

export function NPCRelationships({ relationships }: NPCRelationshipsProps) {
  const { language } = useLanguage();

  if (relationships.length === 0) {
    return null;
  }

  return (
    <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-secondary" />
          {language === "ar" ? "العلاقات" : "Relationships"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {relationships.map((rel, idx) => {
          const info = relationshipLabels[rel.type] || relationshipLabels.ally;
          const Icon = info.icon;

          return (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <OfflineImage
                src={rel.npc.image_url || ""}
                alt={language === "ar" ? rel.npc.name_ar : rel.npc.name_en}
                className="w-10 h-10 rounded-full"
                placeholderType="npc"
                trainerName={rel.npc.name_en}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {language === "ar" ? rel.npc.name_ar || rel.npc.name_en : rel.npc.name_en}
                </p>
              </div>
              <Badge variant="outline" className={cn("text-xs gap-1", info.color)}>
                <Icon className="w-3 h-3" />
                {language === "ar" ? info.ar : info.en}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
