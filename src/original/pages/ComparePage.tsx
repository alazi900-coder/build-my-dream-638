import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter, GAMES } from "@/original/contexts/GameFilterContext";
import { usePokemon, useMoves } from "@/original/hooks/useDataStore";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Input } from "@/original/components/ui/input";
import { Badge } from "@/original/components/ui/badge";
import { Slider } from "@/original/components/ui/slider";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { PokemonSelector } from "@/original/components/compare/PokemonSelector";
import { MoveSelector } from "@/original/components/compare/MoveSelector";
import { ComparisonView } from "@/original/components/compare/ComparisonView";
import { supabase } from "@/original/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/original/hooks/use-toast";
import { Scale, Save, FolderOpen, Trash2, RefreshCw, Gamepad2 } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { playTypeSound } from "@/original/lib/typeSounds";
import { LtrToken } from "@/original/components/ui/ltr-token";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  available_in?: string[];
}

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
}

interface ComparisonPreset {
  id: string;
  name: string;
  pokemon_a_id: number;
  pokemon_a_level: number;
  pokemon_a_moves: number[];
  pokemon_b_id: number;
  pokemon_b_level: number;
  pokemon_b_moves: number[];
  game_id: string;
  created_at: string;
}

export default function ComparePage() {
  const { tr, language } = useLanguage();
  const { selectedGame } = useGameFilter();
  const queryClient = useQueryClient();

  const [pokemonA, setPokemonA] = useState<Pokemon | null>(null);
  const [pokemonB, setPokemonB] = useState<Pokemon | null>(null);
  const [levelA, setLevelA] = useState(50);
  const [levelB, setLevelB] = useState(50);
  const [movesA, setMovesA] = useState<Move[]>([]);
  const [movesB, setMovesB] = useState<Move[]>([]);
  const [presetName, setPresetName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [presets, setPresets] = useState<ComparisonPreset[]>([]);

  // Use offline-first data store hooks
  const { data: pokemonData } = usePokemon();
  const { data: movesData } = useMoves();

  const allPokemon = pokemonData as Pokemon[];
  const allMoves = movesData as Move[];

  // Load presets from localStorage for offline support
  useEffect(() => {
    const storedPresets = localStorage.getItem("comparison-presets");
    if (storedPresets) {
      try {
        setPresets(JSON.parse(storedPresets));
      } catch {
        setPresets([]);
      }
    }

    // Also try to fetch from Supabase if online
    if (navigator.onLine) {
      supabase
        .from("comparison_presets")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setPresets(data as ComparisonPreset[]);
            localStorage.setItem("comparison-presets", JSON.stringify(data));
          }
        });
    }
  }, [selectedGame]);

  const savePresetMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!pokemonA || !pokemonB) throw new Error("Select both Pokémon");
      const { error } = await supabase.from("comparison_presets").insert({
        name,
        pokemon_a_id: pokemonA.id,
        pokemon_a_level: levelA,
        pokemon_a_moves: movesA.map((m) => m.id),
        pokemon_b_id: pokemonB.id,
        pokemon_b_level: levelB,
        pokemon_b_moves: movesB.map((m) => m.id),
        game_id: selectedGame === "all" ? "swsh" : selectedGame,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-presets"] });
      setSaveDialogOpen(false);
      setPresetName("");
      toast({
        title: tr("compare.presetSaved"),
        description: tr("compare.comparisonSaved"),
      });
    },
    onError: () => {
      toast({
        title: tr("state.error"),
        description: tr("compare.saveFailed"),
        variant: "destructive",
      });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comparison_presets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison-presets"] });
      toast({ title: tr("compare.presetDeleted") });
    },
  });

  const loadPreset = (preset: ComparisonPreset) => {
    const pokeA = allPokemon.find((p) => p.id === preset.pokemon_a_id);
    const pokeB = allPokemon.find((p) => p.id === preset.pokemon_b_id);
    if (pokeA) setPokemonA(pokeA);
    if (pokeB) setPokemonB(pokeB);
    setLevelA(preset.pokemon_a_level);
    setLevelB(preset.pokemon_b_level);
    const movesAData = (preset.pokemon_a_moves as number[])
      .map((id) => allMoves.find((m) => m.id === id))
      .filter(Boolean) as Move[];
    const movesBData = (preset.pokemon_b_moves as number[])
      .map((id) => allMoves.find((m) => m.id === id))
      .filter(Boolean) as Move[];
    setMovesA(movesAData);
    setMovesB(movesBData);
    setLoadDialogOpen(false);
    toast({ title: tr("compare.presetLoaded") });
  };

  const resetComparison = () => {
    setPokemonA(null);
    setPokemonB(null);
    setLevelA(50);
    setLevelB(50);
    setMovesA([]);
    setMovesB([]);
  };

  useEffect(() => {
    setMovesA([]);
  }, [pokemonA?.id]);
  useEffect(() => {
    setMovesB([]);
  }, [pokemonB?.id]);
  useEffect(() => {
    if (pokemonA?.types?.[0]) playTypeSound(pokemonA.types[0]);
  }, [pokemonA?.id]);
  useEffect(() => {
    if (pokemonB?.types?.[0]) {
      const timer = setTimeout(() => playTypeSound(pokemonB.types[0]), 150);
      return () => clearTimeout(timer);
    }
  }, [pokemonB?.id]);

  const currentGameLabel =
    GAMES.find((g) => g.id === selectedGame)?.[language === "ar" ? "labelAr" : "labelEn"] || "All";

  return (
    <Layout>
      <div className="min-h-screen bg-background p-4 space-y-6">
        {/* Header */}
        <PageHeader title={tr("page.compare.title")} icon={Scale}>
          <Badge variant="outline" className="gap-1">
            <Gamepad2 className="w-3 h-3" />
            {currentGameLabel}
          </Badge>

          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <FolderOpen className="w-4 h-4" />
                {tr("action.load")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{tr("compare.loadPreset")}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                {presets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {tr("compare.noPresets")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {presets.map((preset) => {
                      const pokeA = allPokemon.find((p) => p.id === preset.pokemon_a_id);
                      const pokeB = allPokemon.find((p) => p.id === preset.pokemon_b_id);
                      return (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{preset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {pokeA?.name_en || "?"} {tr("compare.vs")} {pokeB?.name_en || "?"}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => loadPreset(preset)}>
                              {tr("action.load")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => deletePresetMutation.mutate(preset.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={resetComparison} className="gap-1">
            <RefreshCw className="w-4 h-4" />
            {tr("action.reset")}
          </Button>
        </PageHeader>

        {/* Pokemon Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <PokemonSelector
              pokemon={allPokemon}
              selectedPokemon={pokemonA}
              onSelect={(p) => setPokemonA(p as Pokemon)}
              label="A"
              color="blue"
            />
            {pokemonA && (
              <>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{tr("compare.level")}</span>
                      <Badge variant="secondary">
                        <LtrToken>{levelA}</LtrToken>
                      </Badge>
                    </div>
                    <Slider
                      value={[levelA]}
                      onValueChange={([v]) => setLevelA(v)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <MoveSelector
                      pokemonId={pokemonA.id}
                      selectedMoves={movesA}
                      onSelectMove={(m) => setMovesA([...movesA, m])}
                      onRemoveMove={(id) => setMovesA(movesA.filter((m) => m.id !== id))}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-4">
            <PokemonSelector
              pokemon={allPokemon}
              selectedPokemon={pokemonB}
              onSelect={(p) => setPokemonB(p as Pokemon)}
              label="B"
              color="red"
            />
            {pokemonB && (
              <>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{tr("compare.level")}</span>
                      <Badge variant="secondary">
                        <LtrToken>{levelB}</LtrToken>
                      </Badge>
                    </div>
                    <Slider
                      value={[levelB]}
                      onValueChange={([v]) => setLevelB(v)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <MoveSelector
                      pokemonId={pokemonB.id}
                      selectedMoves={movesB}
                      onSelectMove={(m) => setMovesB([...movesB, m])}
                      onRemoveMove={(id) => setMovesB(movesB.filter((m) => m.id !== id))}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        {pokemonA && pokemonB && (
          <div className="flex justify-center">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Save className="w-4 h-4" />
                  {tr("compare.saveComparison")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tr("compare.savePreset")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder={tr("compare.presetName")}
                  />
                  <Button
                    className="w-full"
                    onClick={() => savePresetMutation.mutate(presetName)}
                    disabled={!presetName.trim() || savePresetMutation.isPending}
                  >
                    {savePresetMutation.isPending ? tr("compare.saving") : tr("action.save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Comparison View */}
        {pokemonA && pokemonB && (
          <ComparisonView
            pokemonA={pokemonA}
            pokemonB={pokemonB}
            levelA={levelA}
            levelB={levelB}
            movesA={movesA}
            movesB={movesB}
          />
        )}

        {/* Empty State */}
        {(!pokemonA || !pokemonB) && (
          <Card className="border-border bg-muted/30">
            <CardContent className="p-8 text-center">
              <Scale className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {tr("compare.selectTwo")}
              </h3>
              <p className="text-muted-foreground">{tr("compare.selectTwoDesc")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
