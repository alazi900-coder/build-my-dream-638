import { useState } from "react";
import { supabase } from "@/original/integrations/supabase/client";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { Brain, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Pokemon {
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

interface AdvancedTeamAnalyzerProps {
  team: (Pokemon | null)[];
}

export function AdvancedTeamAnalyzer({ team }: AdvancedTeamAnalyzerProps) {
  const { tr } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const validTeam = team.filter((p): p is Pokemon => p !== null);

  const handleAnalyze = async () => {
    if (validTeam.length === 0) {
      toast.error(tr("team.addPokemonFirst"));
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-team-analyzer", {
        body: {
          team: validTeam,
          language: "en",
        },
      });

      if (error) throw error;
      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast.error(tr("team.tooManyRequests"));
        } else if (data.error.includes("Credits")) {
          toast.error(tr("team.creditsExhausted"));
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setAnalysis(data.analysis);
      toast.success(tr("team.analysisComplete"));
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(tr("team.analysisFailed"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          {tr("team.aiAnalysis")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <div className="text-center py-6">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary opacity-60" />
            <p className="text-muted-foreground mb-4">{tr("team.aiInsights")}</p>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || validTeam.length === 0}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tr("team.analyzing")}
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  {tr("team.analyzeButton")}
                </>
              )}
            </Button>
            {validTeam.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">{tr("team.addAtLeastOne")}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-[300px] rounded-lg border p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{analysis}</div>
              </div>
            </ScrollArea>
            <Button variant="outline" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {tr("team.reanalyze")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
