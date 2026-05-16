import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { getUsageTips } from "@/original/lib/itemUtils";
import { Lightbulb, CheckCircle } from "lucide-react";

interface UsageTipsSectionProps {
  category: string;
}

export function UsageTipsSection({ category }: UsageTipsSectionProps) {
  const { language } = useLanguage();
  const tips = getUsageTips(category, language);

  if (tips.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-primary" />
          {language === "ar" ? "نصائح الاستخدام" : "Usage Tips"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
