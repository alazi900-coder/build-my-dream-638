import { useState } from "react";
import { supabase } from "@/original/integrations/supabase/client";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { Eye, Loader2, TrendingUp, AlertTriangle, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface BattlePokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
}

interface BattlePredictionProps {
  playerTeam: BattlePokemon[];
  enemyTeam: BattlePokemon[];
  onClose?: () => void;
}

export function BattlePrediction({ playerTeam, enemyTeam, onClose }: BattlePredictionProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  const handlePredict = async () => {
    if (playerTeam.length === 0 || enemyTeam.length === 0) {
      toast.error(t("Both teams are required", "كلا الفريقين مطلوبين"));
      return;
    }

    setIsPredicting(true);
    setPrediction(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-battle-predictor", {
        body: {
          playerTeam,
          enemyTeam,
          language,
        },
      });

      if (error) throw error;
      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast.error(t("Too many requests. Please wait.", "طلبات كثيرة. انتظر."));
        } else if (data.error.includes("Credits")) {
          toast.error(t("Credits exhausted.", "نفد الرصيد."));
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setPrediction(data.prediction);
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error(t("Failed to predict battle", "فشل في التوقع"));
    } finally {
      setIsPredicting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !prediction) {
      handlePredict();
    }
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          {t("AI Prediction", "توقع AI")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t("Battle Prediction", "توقع المعركة")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Teams Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="font-medium text-green-500">{t("Your Team", "فريقك")}</p>
              <p className="text-sm text-muted-foreground">{playerTeam.length} Pokémon</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <p className="font-medium text-red-500">{t("Enemy Team", "فريق الخصم")}</p>
              <p className="text-sm text-muted-foreground">{enemyTeam.length} Pokémon</p>
            </div>
          </div>

          {/* Prediction Content */}
          {isPredicting ? (
            <div className="py-8 text-center">
              <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {t("Analyzing battle...", "جاري تحليل المعركة...")}
              </p>
            </div>
          ) : prediction ? (
            <ScrollArea className="h-[300px] rounded-lg border p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{prediction}</div>
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {t("Loading prediction...", "جاري تحميل التوقع...")}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {prediction && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePredict}
              disabled={isPredicting}
            >
              {isPredicting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              {t("Refresh Prediction", "تحديث التوقع")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
