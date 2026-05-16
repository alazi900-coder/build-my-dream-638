import React, { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { type Achievement } from "@/original/lib/miniGameStorage";

interface AchievementToastProps {
  achievements: Achievement[];
  onClose: () => void;
}

export function AchievementToast({ achievements, onClose }: AchievementToastProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (achievements.length > 0) {
      setVisible(true);

      const timeout = setTimeout(() => {
        if (currentIndex < achievements.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setVisible(false);
          setTimeout(onClose, 300);
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [achievements, currentIndex, onClose]);

  if (!achievements.length || !visible) return null;

  const achievement = achievements[currentIndex];

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100]",
        "animate-in fade-in-0 slide-in-from-top-4 duration-300",
        !visible && "animate-out fade-out-0 slide-out-to-top-4",
      )}
    >
      <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-yellow-500/90 to-orange-500/90 text-white shadow-xl">
        <div className="text-3xl">{achievement.icon}</div>
        <div>
          <div className="flex items-center gap-2 font-bold">
            <Trophy className="w-4 h-4" />
            {isAr ? "إنجاز جديد!" : "Achievement Unlocked!"}
          </div>
          <div className="text-sm opacity-90">{isAr ? achievement.nameAr : achievement.name}</div>
        </div>
      </div>
    </div>
  );
}
