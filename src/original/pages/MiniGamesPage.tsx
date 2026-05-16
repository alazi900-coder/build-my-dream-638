import React, { useState, useEffect } from "react";
import { Gamepad2, HelpCircle, Zap, Clock, Volume2, BarChart3, Puzzle } from "lucide-react";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { GameCard } from "@/original/components/minigames/GameCard";
import { WhosThatPokemon } from "@/original/components/minigames/WhosThatPokemon";
import { TypeQuiz } from "@/original/components/minigames/TypeQuiz";
import { SpeedRun } from "@/original/components/minigames/SpeedRun";
import { SoundMatch } from "@/original/components/minigames/SoundMatch";
import { StatGuesser } from "@/original/components/minigames/StatGuesser";
import { EvolutionPuzzle } from "@/original/components/minigames/EvolutionPuzzle";
import { AchievementsDisplay } from "@/original/components/minigames/AchievementsDisplay";
import { AchievementToast } from "@/original/components/minigames/AchievementToast";
import { useMiniGameStats } from "@/original/hooks/useMiniGameStats";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { supabase } from "@/original/integrations/supabase/client";

const GAMES = [
  {
    id: "whos-that-pokemon",
    title: "Who's That Pokémon?",
    titleAr: "من هذا البوكيمون؟",
    description: "Identify Pokémon from their silhouette",
    descriptionAr: "تعرّف على البوكيمون من ظله",
    icon: <HelpCircle className="w-6 h-6" />,
    difficulty: "easy" as const,
  },
  {
    id: "type-quiz",
    title: "Type Quiz",
    titleAr: "اختبار الأنواع",
    description: "Test your knowledge of type effectiveness",
    descriptionAr: "اختبر معرفتك بفعاليات الأنواع",
    icon: <Zap className="w-6 h-6" />,
    difficulty: "medium" as const,
  },
  {
    id: "speed-run",
    title: "Speed Run",
    titleAr: "سباق السرعة",
    description: "Identify as many Pokémon as you can in 60 seconds",
    descriptionAr: "تعرّف على أكبر عدد في 60 ثانية",
    icon: <Clock className="w-6 h-6" />,
    difficulty: "hard" as const,
  },
  {
    id: "sound-match",
    title: "Sound Match",
    titleAr: "مطابقة الأصوات",
    description: "Identify Pokémon by their cry",
    descriptionAr: "تعرّف على البوكيمون من صوته",
    icon: <Volume2 className="w-6 h-6" />,
    difficulty: "medium" as const,
  },
  {
    id: "stat-guesser",
    title: "Stat Guesser",
    titleAr: "تخمين الإحصائيات",
    description: "Guess the Pokémon from its stats",
    descriptionAr: "خمّن البوكيمون من إحصائياته",
    icon: <BarChart3 className="w-6 h-6" />,
    difficulty: "hard" as const,
  },
  {
    id: "evolution-puzzle",
    title: "Evolution Puzzle",
    titleAr: "لغز التطور",
    description: "Complete the evolution chain",
    descriptionAr: "أكمل سلسلة التطور",
    icon: <Puzzle className="w-6 h-6" />,
    difficulty: "easy" as const,
  },
];

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
}

export default function MiniGamesPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { allStats, achievements, newAchievements, clearNewAchievements } = useMiniGameStats();

  useEffect(() => {
    async function loadPokemon() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("pokemon")
          .select("id, name_en, name_ar, stats")
          .order("id")
          .limit(500);

        if (error) throw error;

        // Transform stats from Json to proper type
        const transformedData = (data || []).map((p) => ({
          ...p,
          stats: p.stats as unknown as Pokemon["stats"],
        }));

        setPokemon(transformedData);
      } catch (error) {
        console.error("Error loading pokemon:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPokemon();
  }, []);

  const getGameStats = (gameId: string) => {
    const stats = allStats.find((s) => s.gameType === gameId);
    return {
      highScore: stats?.highScore || 0,
      bestStreak: stats?.bestStreak || 0,
      totalGames: stats?.totalGames || 0,
    };
  };

  const handleBack = () => {
    setSelectedGame(null);
  };

  // Render selected game
  if (selectedGame) {
    switch (selectedGame) {
      case "whos-that-pokemon":
        return (
          <Layout>
            <div className="p-4 pb-24">
              <WhosThatPokemon pokemon={pokemon} onBack={handleBack} />
            </div>
            <AchievementToast achievements={newAchievements} onClose={clearNewAchievements} />
          </Layout>
        );
      case "type-quiz":
        return (
          <Layout>
            <div className="p-4 pb-24">
              <TypeQuiz onBack={handleBack} />
            </div>
            <AchievementToast achievements={newAchievements} onClose={clearNewAchievements} />
          </Layout>
        );
      case "speed-run":
        return (
          <Layout>
            <div className="p-4 pb-24">
              <SpeedRun pokemon={pokemon} onBack={handleBack} />
            </div>
            <AchievementToast achievements={newAchievements} onClose={clearNewAchievements} />
          </Layout>
        );
      case "sound-match":
        return (
          <Layout>
            <div className="p-4 pb-24">
              <SoundMatch pokemon={pokemon} onBack={handleBack} />
            </div>
            <AchievementToast achievements={newAchievements} onClose={clearNewAchievements} />
          </Layout>
        );
      case "stat-guesser":
        return (
          <Layout>
            <div className="p-4 pb-24">
              <StatGuesser pokemon={pokemon} onBack={handleBack} />
            </div>
            <AchievementToast achievements={newAchievements} onClose={clearNewAchievements} />
          </Layout>
        );
      case "evolution-puzzle":
        return (
          <Layout>
            <div className="p-4 pb-24">
              <EvolutionPuzzle pokemon={pokemon} onBack={handleBack} />
            </div>
            <AchievementToast achievements={newAchievements} onClose={clearNewAchievements} />
          </Layout>
        );
    }
  }

  return (
    <Layout>
      <PageHeader
        title={isAr ? "ألعاب مصغرة" : "Mini Games"}
        description={isAr ? "اختبر معرفتك بالبوكيمون!" : "Test your Pokémon knowledge!"}
        icon={Gamepad2}
      />

      <div className="p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {isAr ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : (
          <>
            {/* Games Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {GAMES.map((game) => {
                const stats = getGameStats(game.id);
                return (
                  <GameCard
                    key={game.id}
                    id={game.id}
                    title={game.title}
                    titleAr={game.titleAr}
                    description={game.description}
                    descriptionAr={game.descriptionAr}
                    icon={game.icon}
                    difficulty={game.difficulty}
                    highScore={stats.highScore}
                    bestStreak={stats.bestStreak}
                    totalGames={stats.totalGames}
                    onClick={() => setSelectedGame(game.id)}
                  />
                );
              })}
            </div>

            {/* Achievements Section */}
            <AchievementsDisplay unlockedAchievements={achievements} category="minigame" />
          </>
        )}
      </div>

      <AchievementToast achievements={newAchievements} onClose={clearNewAchievements} />
    </Layout>
  );
}
