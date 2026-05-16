import { useState } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { GitCompare, Check, X, Minus, Search } from "lucide-react";
import { useMoves } from "@/original/hooks/useDataStore";
import { moveNamesArabic } from "@/original/data/arabicTranslations";
import { LtrToken } from "@/original/components/ui/ltr-token";
import { cn } from "@/original/lib/utils";
import { SearchBar } from "@/original/components/ui/search-bar";

interface MoveData {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

interface MoveComparisonProps {
  currentMove: MoveData;
}

export function MoveComparison({ currentMove }: MoveComparisonProps) {
  const { language } = useLanguage();
  const { data: allMoves } = useMoves();
  const [compareMove, setCompareMove] = useState<MoveData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getMoveName = (move: MoveData) => {
    if (language === "ar") {
      return move.name_ar && move.name_ar !== move.name_en
        ? move.name_ar
        : moveNamesArabic[move.id]?.name || move.name_en;
    }
    return move.name_en;
  };

  // Filter moves for selection
  const filteredMoves = allMoves
    .filter((m) => m.id !== currentMove.id)
    .filter((m) => {
      if (!searchQuery) return true;
      const name = getMoveName(m as MoveData).toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    })
    .slice(0, 50);

  const compareValue = (a: number | null | undefined, b: number | null | undefined) => {
    const aVal = a ?? 0;
    const bVal = b ?? 0;
    if (aVal > bVal) return "better";
    if (aVal < bVal) return "worse";
    return "equal";
  };

  const getComparisonIcon = (result: string) => {
    if (result === "better") return <Check className="w-4 h-4 text-green-400" />;
    if (result === "worse") return <X className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const renderStatRow = (label: string, currentVal: number | null, compareVal: number | null) => {
    const comparison = compareValue(currentVal, compareVal);
    return (
      <div className="flex items-center justify-between py-2 border-b border-border/50">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "font-bold",
              comparison === "better" && "text-green-400",
              comparison === "worse" && "text-red-400",
            )}
          >
            <LtrToken>{currentVal ?? "—"}</LtrToken>
          </span>
          {compareMove && (
            <>
              {getComparisonIcon(comparison)}
              <span
                className={cn(
                  "font-bold",
                  comparison === "worse" && "text-green-400",
                  comparison === "better" && "text-red-400",
                )}
              >
                <LtrToken>{compareVal ?? "—"}</LtrToken>
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          {language === "ar" ? "مقارنة الحركات" : "Compare Moves"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Move Selection */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {compareMove
                ? getMoveName(compareMove)
                : language === "ar"
                  ? "اختر حركة للمقارنة"
                  : "Select move to compare"}
              <Search className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "اختر حركة" : "Select Move"}</DialogTitle>
            </DialogHeader>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={{ en: "Search moves...", ar: "بحث عن حركات..." }}
            />

            <div className="flex-1 overflow-y-auto space-y-1 mt-4">
              {filteredMoves.map((move) => (
                <Button
                  key={move.id}
                  variant="ghost"
                  className="w-full justify-between h-auto py-2"
                  onClick={() => {
                    setCompareMove(move as MoveData);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-medium">{getMoveName(move as MoveData)}</span>
                  <TypeBadge type={move.type} size="sm" />
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Headers */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <Badge variant="outline" className="bg-primary/10">
              {getMoveName(currentMove)}
            </Badge>
          </div>
          {compareMove && (
            <>
              <div className="px-2">
                <GitCompare className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-center">
                <Badge variant="outline">{getMoveName(compareMove)}</Badge>
              </div>
            </>
          )}
        </div>

        {/* Type Comparison */}
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">
            {language === "ar" ? "النوع" : "Type"}
          </span>
          <div className="flex items-center gap-4">
            <TypeBadge type={currentMove.type} size="sm" />
            {compareMove && (
              <>
                <Minus className="w-4 h-4 text-muted-foreground" />
                <TypeBadge type={compareMove.type} size="sm" />
              </>
            )}
          </div>
        </div>

        {/* Stat Comparisons */}
        {renderStatRow(
          language === "ar" ? "القوة" : "Power",
          currentMove.power,
          compareMove?.power ?? null,
        )}
        {renderStatRow(
          language === "ar" ? "الدقة" : "Accuracy",
          currentMove.accuracy,
          compareMove?.accuracy ?? null,
        )}
        {renderStatRow(language === "ar" ? "PP" : "PP", currentMove.pp, compareMove?.pp ?? null)}

        {/* Recommendation */}
        {compareMove && (
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-center">
              {(() => {
                const currentScore = (currentMove.power || 0) + (currentMove.accuracy || 0);
                const compareScore = (compareMove.power || 0) + (compareMove.accuracy || 0);
                if (currentScore > compareScore) {
                  return language === "ar"
                    ? `${getMoveName(currentMove)} أفضل بشكل عام`
                    : `${getMoveName(currentMove)} is generally better`;
                }
                if (currentScore < compareScore) {
                  return language === "ar"
                    ? `${getMoveName(compareMove)} أفضل بشكل عام`
                    : `${getMoveName(compareMove)} is generally better`;
                }
                return language === "ar" ? "كلاهما متقاربان" : "Both are comparable";
              })()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
