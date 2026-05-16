import { useState, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Input } from "@/original/components/ui/input";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { Search, Plus, X, Zap, Sword, Shield } from "lucide-react";
import { supabase } from "@/original/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/original/lib/utils";

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
}

interface Props {
  pokemonId: number;
  selectedMoves: Move[];
  onSelectMove: (move: Move) => void;
  onRemoveMove: (moveId: number) => void;
  maxMoves?: number;
}

export function MoveSelector({
  pokemonId,
  selectedMoves,
  onSelectMove,
  onRemoveMove,
  maxMoves = 4,
}: Props) {
  const { t, language } = useLanguage();
  const { selectedGame } = useGameFilter();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch learnset for this pokemon
  const { data: learnset } = useQuery({
    queryKey: ["learnset-moves", pokemonId, selectedGame],
    queryFn: async () => {
      let query = supabase.from("learnsets").select("move_id").eq("pokemon_id", pokemonId);

      if (selectedGame !== "all") {
        query = query.eq("game_id", selectedGame);
      }

      const { data } = await query;
      return data?.map((l) => l.move_id) || [];
    },
    enabled: !!pokemonId,
  });

  // Fetch all moves
  const { data: allMoves } = useQuery({
    queryKey: ["all-moves-selector"],
    queryFn: async () => {
      const { data } = await supabase
        .from("moves")
        .select("id, name_en, name_ar, type, category, power, accuracy");
      return (data || []) as Move[];
    },
  });

  // Filter moves available to this pokemon
  const availableMoves = useMemo(() => {
    if (!learnset || !allMoves) return allMoves || [];

    // If no learnset data, show all moves
    if (learnset.length === 0) return allMoves;

    return allMoves.filter((m) => learnset.includes(m.id));
  }, [learnset, allMoves]);

  const filteredMoves = useMemo(() => {
    let result = availableMoves;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (m) => m.name_en.toLowerCase().includes(search) || m.name_ar.includes(search),
      );
    }

    // Filter out already selected moves
    result = result.filter((m) => !selectedMoves.some((sm) => sm.id === m.id));

    return result.slice(0, 50);
  }, [availableMoves, searchTerm, selectedMoves]);

  const handleSelect = (move: Move) => {
    if (selectedMoves.length < maxMoves) {
      onSelectMove(move);
      setOpen(false);
      setSearchTerm("");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "physical":
        return Sword;
      case "special":
        return Zap;
      default:
        return Shield;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "physical":
        return "text-red-400";
      case "special":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {t("Moves", "الحركات")} ({selectedMoves.length}/{maxMoves})
      </p>

      {/* Selected Moves */}
      <div className="grid grid-cols-2 gap-2">
        {selectedMoves.map((move) => {
          const CategoryIcon = getCategoryIcon(move.category);
          return (
            <div
              key={move.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
            >
              <TypeBadge type={move.type} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {language === "ar" ? move.name_ar : move.name_en}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CategoryIcon className={cn("w-3 h-3", getCategoryColor(move.category))} />
                  {move.power && <span>{move.power}</span>}
                </div>
              </div>
              <button
                onClick={() => onRemoveMove(move.id)}
                className="p-1 rounded hover:bg-destructive/20"
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            </div>
          );
        })}

        {/* Add Move Button */}
        {selectedMoves.length < maxMoves && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center justify-center gap-1 p-2 rounded-lg border-2 border-dashed 
                           border-muted-foreground/30 hover:border-primary/50 transition-all"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t("Add Move", "أضف حركة")}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{t("Select Move", "اختر حركة")}</DialogTitle>
              </DialogHeader>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Search moves...", "ابحث عن حركة...")}
                  className="pl-10"
                  autoFocus
                />
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredMoves.map((move) => {
                    const CategoryIcon = getCategoryIcon(move.category);
                    return (
                      <button
                        key={move.id}
                        onClick={() => handleSelect(move)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border 
                                   bg-muted/30 hover:border-primary transition-all text-left"
                      >
                        <TypeBadge type={move.type} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {language === "ar" ? move.name_ar : move.name_en}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "ar" ? move.name_en : move.name_ar}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CategoryIcon
                            className={cn("w-4 h-4", getCategoryColor(move.category))}
                          />
                          {move.power && (
                            <Badge variant="secondary" className="text-xs">
                              {move.power}
                            </Badge>
                          )}
                          {move.accuracy && (
                            <span className="text-xs text-muted-foreground">{move.accuracy}%</span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {filteredMoves.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("No moves found", "لم يتم العثور على حركات")}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
