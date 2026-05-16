import { useLanguage } from "@/original/contexts/LanguageContext";
import { AdventureAchievement } from "@/original/lib/adventureStorage";

interface AchievementToastProps {
  achievement: AdventureAchievement;
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  const { language } = useLanguage();

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{achievement.icon}</span>
      <div>
        <p className="font-bold text-sm">
          {language === "ar" ? achievement.nameAr : achievement.nameEn}
        </p>
        <p className="text-xs text-muted-foreground">
          {language === "ar" ? achievement.descriptionAr : achievement.descriptionEn}
        </p>
      </div>
    </div>
  );
}
