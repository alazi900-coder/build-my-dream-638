import { useState, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Input } from "@/original/components/ui/input";
import { Badge } from "@/original/components/ui/badge";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/original/components/ui/dialog";
import { Search, Plus, X, Check, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { useDebouncedValue } from "@/original/hooks/useDebouncedValue";
import { BATTLE_LABELS } from "@/original/lib/battleUtils";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
}

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  power: number | null;
  category: string;
}

interface TeamMember {
  pokemon: Pokemon;
  moves: (Move | null)[];
}

interface BattleTeamBuilderProps {
  format: "1v1" | "3v3" | "6v6";
  pokemon: Pokemon[];
  moves: Move[];
  onTeamReady: (team: TeamMember[]) => void;
  onCancel: () => void;
}

export function BattleTeamBuilder({
  format,
  pokemon,
  moves,
  onTeamReady,
  onCancel,
}: BattleTeamBuilderProps) {
  const { t, language } = useLanguage();
  const { isAvailableInGame } = useGameFilter();

  const maxSlots = format === "1v1" ? 1 : 3;
  const [team, setTeam] = useState<(TeamMember | null)[]>(Array(maxSlots).fill(null));
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [selectingMoveSlot, setSelectingMoveSlot] = useState<number | null>(null);
  const [pokemonSearch, setPokemonSearch] = useState("");
  const [moveSearch, setMoveSearch] = useState("");

  const debouncedPokemonSearch = useDebouncedValue(pokemonSearch, 200);
  const debouncedMoveSearch = useDebouncedValue(moveSearch, 200);

  // Filter pokemon
  const filteredPokemon = useMemo(() => {
    if (!debouncedPokemonSearch) return pokemon.slice(0, 50);
    const search = debouncedPokemonSearch.toLowerCase();
    return pokemon
      .filter(
        (p) =>
          p.name_en.toLowerCase().includes(search) ||
          p.name_ar.includes(search) ||
          p.id.toString() === search,
      )
      .slice(0, 50);
  }, [pokemon, debouncedPokemonSearch]);

  // Filter moves
  const filteredMoves = useMemo(() => {
    if (!debouncedMoveSearch) return moves.slice(0, 50);
    const search = debouncedMoveSearch.toLowerCase();
    return moves
      .filter((m) => m.name_en.toLowerCase().includes(search) || m.name_ar.includes(search))
      .slice(0, 50);
  }, [moves, debouncedMoveSearch]);

  // Select Pokemon for slot
  const selectPokemon = (poke: Pokemon) => {
    if (activeSlot === null) return;

    // Check if already in team
    if (team.some((t) => t?.pokemon.id === poke.id)) {
      return; // Already selected
    }

    setTeam((prev) => {
      const newTeam = [...prev];
      newTeam[activeSlot] = {
        pokemon: poke,
        moves: [null, null, null, null],
      };
      return newTeam;
    });
    setActiveSlot(null);
    setPokemonSearch("");
  };

  // Select move for current Pokemon
  const selectMove = (move: Move) => {
    if (activeSlot === null || selectingMoveSlot === null) return;

    setTeam((prev) => {
      const newTeam = [...prev];
      const member = newTeam[activeSlot];
      if (member) {
        const newMoves = [...member.moves];
        newMoves[selectingMoveSlot] = move;
        newTeam[activeSlot] = { ...member, moves: newMoves };
      }
      return newTeam;
    });
    setSelectingMoveSlot(null);
    setMoveSearch("");
  };

  // Remove Pokemon from slot
  const removePokemon = (index: number) => {
    setTeam((prev) => {
      const newTeam = [...prev];
      newTeam[index] = null;
      return newTeam;
    });
  };

  // Remove move from slot
  const removeMove = (teamIndex: number, moveIndex: number) => {
    setTeam((prev) => {
      const newTeam = [...prev];
      const member = newTeam[teamIndex];
      if (member) {
        const newMoves = [...member.moves];
        newMoves[moveIndex] = null;
        newTeam[teamIndex] = { ...member, moves: newMoves };
      }
      return newTeam;
    });
  };

  // Check if team is valid
  const isTeamValid = team.every(
    (t) => t !== null && t.moves.filter((m) => m !== null).length >= 1,
  );

  // Start battle with custom team
  const handleStartBattle = () => {
    const validTeam = team.filter((t): t is TeamMember => t !== null);
    if (validTeam.length < maxSlots) return;
    onTeamReady(validTeam);
  };

  const currentMember = activeSlot !== null ? team[activeSlot] : null;

  return (
    <div className="space-y-4">
      {/* Team Slots */}
      <Card className="border-border">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            {language === "ar" ? BATTLE_LABELS.team.ar : BATTLE_LABELS.team.en}
            <Badge variant="outline">
              {team.filter((t) => t !== null).length}/{maxSlots}
            </Badge>
          </h3>

          <div
            className={cn(
              "grid gap-3",
              format === "1v1" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3",
            )}
          >
            {team.map((member, i) => (
              <div
                key={i}
                className={cn(
                  "border-2 rounded-lg p-3 transition-all min-h-[120px]",
                  member
                    ? "border-primary/50 bg-primary/5"
                    : "border-dashed border-muted-foreground/30",
                  activeSlot === i && "ring-2 ring-primary",
                )}
              >
                {member ? (
                  <div className="space-y-2">
                    {/* Pokemon Header */}
                    <div className="flex items-center gap-2">
                      <img
                        src={getPokemonSprite(member.pokemon.id)}
                        alt=""
                        className="w-12 h-12"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {language === "ar" ? member.pokemon.name_ar : member.pokemon.name_en}
                        </p>
                        <div className="flex gap-1">
                          {member.pokemon.types.slice(0, 2).map((type) => (
                            <TypeBadge key={type} type={type} size="sm" />
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePokemon(i)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Moves */}
                    <div className="grid grid-cols-2 gap-1">
                      {member.moves.map((move, mi) => (
                        <Button
                          key={mi}
                          variant={move ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            setActiveSlot(i);
                            setSelectingMoveSlot(mi);
                          }}
                          className={cn("h-8 text-xs justify-start px-2", !move && "border-dashed")}
                        >
                          {move ? (
                            <>
                              <span className="truncate">
                                {language === "ar" ? move.name_ar : move.name_en}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMove(i, mi);
                                }}
                                className="ml-auto"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              {t("Move", "حركة")} {mi + 1}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full h-full flex-col gap-2"
                    onClick={() => setActiveSlot(i)}
                  >
                    <Plus className="w-8 h-8 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("Add Pokémon", "أضف بوكيمون")}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 min-h-[44px]">
          {t("Cancel", "إلغاء")}
        </Button>
        <Button onClick={handleStartBattle} disabled={!isTeamValid} className="flex-1 min-h-[44px]">
          {language === "ar" ? BATTLE_LABELS.startBattle.ar : BATTLE_LABELS.startBattle.en}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Pokemon Selection Dialog */}
      <Dialog
        open={activeSlot !== null && selectingMoveSlot === null && !currentMember}
        onOpenChange={() => setActiveSlot(null)}
      >
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>
              {language === "ar" ? BATTLE_LABELS.selectPokemon.ar : BATTLE_LABELS.selectPokemon.en}
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={pokemonSearch}
                onChange={(e) => setPokemonSearch(e.target.value)}
                placeholder={t("Search Pokémon...", "بحث عن بوكيمون...")}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[50vh] px-4 pb-4">
            <div className="space-y-1">
              {filteredPokemon.map((poke) => {
                const isSelected = team.some((t) => t?.pokemon.id === poke.id);
                return (
                  <button
                    key={poke.id}
                    onClick={() => selectPokemon(poke)}
                    disabled={isSelected}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-start",
                      "hover:bg-muted/50 active:bg-muted",
                      isSelected && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <img
                      src={getPokemonSprite(poke.id)}
                      alt=""
                      className="w-10 h-10"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {language === "ar" ? poke.name_ar : poke.name_en}
                      </p>
                      <div className="flex gap-1">
                        {poke.types.slice(0, 2).map((type) => (
                          <TypeBadge key={type} type={type} size="sm" />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      #{poke.id.toString().padStart(3, "0")}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Move Selection Dialog */}
      <Dialog open={selectingMoveSlot !== null} onOpenChange={() => setSelectingMoveSlot(null)}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>
              {language === "ar" ? BATTLE_LABELS.selectMoves.ar : BATTLE_LABELS.selectMoves.en}
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={moveSearch}
                onChange={(e) => setMoveSearch(e.target.value)}
                placeholder={t("Search moves...", "بحث عن حركات...")}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[50vh] px-4 pb-4">
            <div className="space-y-1">
              {filteredMoves.map((move) => {
                const isSelected = currentMember?.moves.some((m) => m?.id === move.id);
                return (
                  <button
                    key={move.id}
                    onClick={() => selectMove(move)}
                    disabled={isSelected}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-start",
                      "hover:bg-muted/50 active:bg-muted",
                      isSelected && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <TypeBadge type={move.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {language === "ar" ? move.name_ar : move.name_en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {move.category} {move.power && `• ${move.power}`}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
