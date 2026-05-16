import { useState } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { supabase } from "@/original/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/original/hooks/use-toast";

interface GymData {
  leaderName: string;
  cityName: string;
  gymType: string;
  roster: Array<{
    name: string;
    level: number;
    types: string[];
  }>;
}

interface PlayerPokemon {
  name: string;
  types: string[];
}

interface Props {
  gym: GymData;
  playerTeam?: PlayerPokemon[];
}

export function AIBattleTips({ gym, playerTeam = [] }: Props) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [tips, setTips] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-battle-tips", {
        body: {
          gym,
          playerTeam,
          language,
        },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        throw new Error(data.error);
      }

      setTips(data?.tips || null);
    } catch (err) {
      console.error("Error generating tips:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate tips";
      setError(errorMessage);
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format tips with line breaks
  const formattedTips = tips?.split("\n").filter((line) => line.trim());

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {t("AI Battle Tips", "نصائح المعركة بالذكاء الاصطناعي")}
          <Badge variant="secondary" className="text-xs">
            {t("Powered by AI", "مدعوم بالذكاء الاصطناعي")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!tips && !isLoading && !error && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t(
                "Get personalized battle strategies from our AI coach!",
                "احصل على استراتيجيات معركة مخصصة من مدربنا الذكي!",
              )}
            </p>
            <Button onClick={generateTips} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {t("Generate Battle Tips", "أنشئ نصائح المعركة")}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("Analyzing battle strategies...", "تحليل استراتيجيات المعركة...")}
            </span>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={generateTips} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {t("Try Again", "حاول مجدداً")}
            </Button>
          </div>
        )}

        {tips && !isLoading && (
          <div className="space-y-3">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {formattedTips?.map((line, idx) => (
                <p key={idx} className="text-sm text-foreground leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
            <div className="pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={generateTips} className="gap-2 text-xs">
                <RefreshCw className="w-3 h-3" />
                {t("Regenerate Tips", "إعادة إنشاء النصائح")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
