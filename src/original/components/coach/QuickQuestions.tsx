import { Button } from "@/original/components/ui/button";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";
import { Wifi } from "lucide-react";

interface QuickQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
  showOfflineIndicator?: boolean;
}

interface QuickQuestion {
  text: string;
  offlineAvailable: boolean;
}

const questionsAr: QuickQuestion[] = [
  { text: "🔥 ما هي نقاط ضعف النار؟", offlineAvailable: true },
  { text: "💧 أفضل بوكيمون مائي؟", offlineAvailable: true },
  { text: "⚡ كيف أهزم صالة الكهرباء؟", offlineAvailable: true },
  { text: "🎯 اقترح لي فريقاً متوازناً", offlineAvailable: true },
  { text: "🌿 ما الحركات الأفضل لبوكيمون عشبي؟", offlineAvailable: true },
  { text: "🐉 كيف أتغلب على التنين؟", offlineAvailable: true },
];

const questionsEn: QuickQuestion[] = [
  { text: "🔥 What are Fire type weaknesses?", offlineAvailable: true },
  { text: "💧 Best Water type Pokémon?", offlineAvailable: true },
  { text: "⚡ How to beat Electric gym?", offlineAvailable: true },
  { text: "🎯 Suggest a balanced team", offlineAvailable: true },
  { text: "🌿 Best moves for Grass types?", offlineAvailable: true },
  { text: "🐉 How to counter Dragon types?", offlineAvailable: true },
];

export const QuickQuestions = ({
  onSelect,
  disabled,
  showOfflineIndicator,
}: QuickQuestionsProps) => {
  const { language } = useLanguage();
  const questions = language === "ar" ? questionsAr : questionsEn;

  return (
    <div className={cn("flex flex-wrap gap-2 p-4", language === "ar" && "justify-end")}>
      {questions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(question.text)}
          disabled={disabled}
          className={cn(
            "text-xs",
            showOfflineIndicator && question.offlineAvailable && "border-primary/30",
          )}
        >
          {question.text}
          {showOfflineIndicator && question.offlineAvailable && (
            <Wifi className="ml-1 h-3 w-3 text-primary/50" />
          )}
        </Button>
      ))}
    </div>
  );
};
