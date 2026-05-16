import { cn } from "@/original/lib/utils";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent } from "@/original/components/ui/card";
import { Difficulty, DIFFICULTY_LABELS } from "@/original/lib/battleAI";
import { Star } from "lucide-react";

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  language: "en" | "ar";
  disabled?: boolean;
  compact?: boolean;
}

export function DifficultySelector({
  selected,
  onSelect,
  language,
  disabled = false,
  compact = false,
}: DifficultySelectorProps) {
  const difficulties: Difficulty[] = ["easy", "normal", "hard", "expert"];

  if (compact) {
    return (
      <div className="flex gap-1">
        {difficulties.map((diff) => {
          const info = DIFFICULTY_LABELS[diff];
          return (
            <Button
              key={diff}
              variant={selected === diff ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(diff)}
              disabled={disabled}
              className={cn("min-w-0 px-2", selected === diff && info.color)}
            >
              <span className="flex items-center gap-0.5">
                {Array.from({ length: info.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("w-3 h-3", selected === diff ? "fill-current" : "fill-muted")}
                  />
                ))}
              </span>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-3">
        <h3 className="text-sm font-medium mb-2 text-center">
          {language === "ar" ? "الصعوبة" : "Difficulty"}
        </h3>

        <div className="grid grid-cols-4 gap-2">
          {difficulties.map((diff) => {
            const info = DIFFICULTY_LABELS[diff];
            const isSelected = selected === diff;

            return (
              <Button
                key={diff}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onSelect(diff)}
                disabled={disabled}
                className={cn(
                  "flex-col h-auto py-2 gap-1",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <div className="flex">
                  {Array.from({ length: info.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        isSelected
                          ? "fill-primary-foreground text-primary-foreground"
                          : "fill-muted text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px]">{language === "ar" ? info.ar : info.en}</span>
              </Button>
            );
          })}
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-2">
          {language === "ar"
            ? selected === "easy"
              ? "AI عشوائي وضرر أقل"
              : selected === "normal"
                ? "AI متوازن"
                : selected === "hard"
                  ? "AI ذكي ويستخدم التبديل"
                  : "AI يتوقع حركاتك!"
            : selected === "easy"
              ? "Random AI, less damage"
              : selected === "normal"
                ? "Balanced AI"
                : selected === "hard"
                  ? "Smart AI with switching"
                  : "AI predicts your moves!"}
        </p>
      </CardContent>
    </Card>
  );
}
