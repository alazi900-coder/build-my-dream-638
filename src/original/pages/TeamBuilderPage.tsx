import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { usePokemon, useMoves } from "@/original/hooks/useDataStore";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/original/components/ui/tabs";
import { Badge } from "@/original/components/ui/badge";
import { Input } from "@/original/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { TeamMemberSelector } from "@/original/components/team/TeamMemberSelector";
import { TeamCoverageHeatmap } from "@/original/components/team/TeamCoverageHeatmap";
import { TeamThreatAnalysis } from "@/original/components/team/TeamThreatAnalysis";
import { TeamSuggestions } from "@/original/components/team/TeamSuggestions";
import { AdvancedTeamAnalyzer } from "@/original/components/team/AdvancedTeamAnalyzer";
import { TeamEmptyState } from "@/original/components/team/TeamEmptyState";
import { TeamProgressiveInsights } from "@/original/components/team/TeamProgressiveInsights";
import { TeamSuggestButton } from "@/original/components/team/TeamSuggestButton";
import { SavedTeamCard } from "@/original/components/team/SavedTeamCard";
import { GameFilterChips } from "@/original/components/GameFilterChips";
import {
  Users,
  Grid3X3,
  Target,
  Lightbulb,
  RotateCcw,
  Save,
  FolderOpen,
  Share2,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { LtrToken } from "@/original/components/ui/ltr-token";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  available_in?: string[];
}

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  power: number | null;
  category: string;
  available_in?: string[];
}

interface SavedTeam {
  id: string;
  name: string;
  game_id: string;
  pokemon_ids: number[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

const STORAGE_KEY = "pokemon-saved-teams";

export default function TeamBuilderPage() {
  const { tr, language } = useLanguage();
  const { selectedGame, getGameInfo } = useGameFilter();
  const [team, setTeam] = useState<(Pokemon | null)[]>([null, null, null, null, null, null]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [teamName, setTeamName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSavedTeams(JSON.parse(saved));
  }, []);

  // Use data store hooks for offline-first data access
  const { data: pokemonData } = usePokemon();
  const { data: movesData } = useMoves();

  const pokemon = pokemonData.map((p) => ({
    ...p,
    types: Array.isArray(p.types) ? p.types : [],
    stats: p.stats as Pokemon["stats"],
    available_in: Array.isArray(p.available_in) ? p.available_in : [],
  })) as Pokemon[];

  const moves = movesData
    .map((m) => ({
      ...m,
      available_in: Array.isArray(m.available_in) ? m.available_in : [],
    }))
    .sort((a, b) => (b.power || 0) - (a.power || 0)) as Move[];

  const handleSelectPokemon = (index: number, poke: Pokemon | null) => {
    setTeam((prev) => {
      const n = [...prev];
      n[index] = poke;
      return n;
    });
  };

  const handleReset = () => setTeam([null, null, null, null, null, null]);

  const handleApplySuggestedTeam = (suggested: Pokemon[]) => {
    const newTeam: (Pokemon | null)[] = [null, null, null, null, null, null];
    suggested.forEach((p, i) => {
      if (i < 6) newTeam[i] = p;
    });
    setTeam(newTeam);
  };

  const handleSaveTeam = () => {
    if (!teamName.trim()) {
      toast.error(tr("team.enterName"));
      return;
    }
    const validTeam = team.filter(Boolean) as Pokemon[];
    if (validTeam.length < 1) {
      toast.error(tr("team.addAtLeastOne"));
      return;
    }

    const newTeam: SavedTeam = {
      id: Date.now().toString(),
      name: teamName,
      game_id: selectedGame,
      pokemon_ids: validTeam.map((p) => p.id),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...savedTeams, newTeam];
    setSavedTeams(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTeamName("");
    setSaveDialogOpen(false);
    toast.success(tr("team.saved"));
  };

  const handleLoadTeam = (saved: SavedTeam) => {
    const loadedTeam: (Pokemon | null)[] = [null, null, null, null, null, null];
    saved.pokemon_ids.forEach((id, idx) => {
      if (idx < 6) loadedTeam[idx] = pokemon.find((p) => p.id === id) || null;
    });
    setTeam(loadedTeam);
    setLoadDialogOpen(false);
    toast.success(tr("team.loaded"));
  };

  const handleDeleteTeam = (id: string) => {
    const updated = savedTeams.filter((t) => t.id !== id);
    setSavedTeams(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(tr("team.deleted"));
  };

  const handleExport = () => {
    const validTeam = team.filter(Boolean) as Pokemon[];
    if (validTeam.length === 0) {
      toast.error(tr("team.addFirst.short"));
      return;
    }
    const data = { game: selectedGame, pokemon: validTeam.map((p) => p.id) };
    navigator.clipboard.writeText(JSON.stringify(data));
    toast.success(tr("team.copied"));
  };

  const teamCount = team.filter(Boolean).length;
  const gameInfo = getGameInfo(selectedGame);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <PageHeader
          title={tr("page.team.title")}
          description={
            language === "ar"
              ? "ابنِ فريقك المثالي واحصل على تحليل فوري"
              : "Build your ideal team and get instant analysis"
          }
          icon={Users}
        >
          <TeamSuggestButton allPokemon={pokemon} onApplyTeam={handleApplySuggestedTeam} />
          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-1" />
                {language === "ar" ? "فرق محفوظة" : "Saved Teams"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === "ar" ? "فرقك المحفوظة" : "Your Saved Teams"}
                </DialogTitle>
              </DialogHeader>
              {savedTeams.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">
                    {language === "ar" ? "لا توجد فرق محفوظة بعد" : "No saved teams yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "ar"
                      ? "ابنِ فريقك واحفظه للرجوع إليه لاحقاً"
                      : "Build a team and save it to access later"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {savedTeams.map((s) => (
                    <SavedTeamCard
                      key={s.id}
                      team={s}
                      allPokemon={pokemon}
                      onLoad={() => handleLoadTeam(s)}
                      onDelete={() => handleDeleteTeam(s.id)}
                    />
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={teamCount === 0}>
                <Save className="w-4 h-4 mr-1" />
                {language === "ar" ? "حفظ التشكيلة" : "Save Team"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "ar" ? "حفظ التشكيلة" : "Save Team"}</DialogTitle>
              </DialogHeader>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={language === "ar" ? "اسم الفريق..." : "Team name..."}
              />
              <Button onClick={handleSaveTeam}>{language === "ar" ? "حفظ" : "Save"}</Button>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={teamCount === 0}>
            <Share2 className="w-4 h-4" />
          </Button>
          {teamCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </PageHeader>

        <GameFilterChips />

        {/* Team Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {tr("team.yourTeam")} (<LtrToken>{teamCount}/6</LtrToken>)
              {selectedGame !== "all" && (
                <Badge variant="outline">
                  {language === "ar" ? gameInfo?.labelAr : gameInfo?.labelEn}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Always show the 6 team slots */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {team.map((member, idx) => (
                <TeamMemberSelector
                  key={idx}
                  pokemon={pokemon}
                  selectedPokemon={member}
                  onSelect={(p) => handleSelectPokemon(idx, p)}
                  slotNumber={idx + 1}
                  existingTeam={team}
                />
              ))}
            </div>

            {/* Show helpful message when team is empty */}
            {teamCount === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-4">
                {language === "ar"
                  ? "اضغط على أي خانة لإضافة بوكيمون"
                  : "Tap any slot to add a Pokémon"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progressive Insights - Always visible when team has members */}
        {teamCount > 0 && <TeamProgressiveInsights team={team} />}

        {/* Analysis Tabs */}
        <Tabs defaultValue="threats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="threats" className="text-xs sm:text-sm">
              <Target className="w-4 h-4 mr-1 hidden sm:inline" />
              {tr("team.threats")}
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="text-xs sm:text-sm">
              <Grid3X3 className="w-4 h-4 mr-1 hidden sm:inline" />
              {tr("team.heatmap")}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs sm:text-sm">
              <Lightbulb className="w-4 h-4 mr-1 hidden sm:inline" />
              {tr("team.suggestions")}
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm">
              <Brain className="w-4 h-4 mr-1 hidden sm:inline" />
              {tr("team.aiAnalysis")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="threats" className="mt-4">
            <TeamThreatAnalysis team={team} />
          </TabsContent>
          <TabsContent value="heatmap" className="mt-4">
            <TeamCoverageHeatmap team={team} />
          </TabsContent>
          <TabsContent value="suggestions" className="mt-4">
            <TeamSuggestions team={team} allPokemon={pokemon} allMoves={moves} />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <AdvancedTeamAnalyzer team={team} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
