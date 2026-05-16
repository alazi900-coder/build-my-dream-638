import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Progress } from "@/original/components/ui/progress";
import { Trophy, Flame, ArrowLeft, BarChart3, Lightbulb } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useMiniGameStats } from "@/original/hooks/useMiniGameStats";
import { ScoreBoard } from "./ScoreBoard";

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

interface StatGuesserProps {
  pokemon: Pokemon[];
  onBack: () => void;
}

const STAT_NAMES = {
  hp: { en: "HP", ar: "ص.ح" },
  attack: { en: "Attack", ar: "هجوم" },
  defense: { en: "Defense", ar: "دفاع" },
  sp_attack: { en: "Sp. Atk", ar: "هـ.خ" },
  sp_defense: { en: "Sp. Def", ar: "د.خ" },
  speed: { en: "Speed", ar: "سرعة" },
};

export function StatGuesser({ pokemon, onBack }: StatGuesserProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { highScore, submitScore } = useMiniGameStats("stat-guesser");

  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [options, setOptions] = useState<Pokemon[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const getRandomPokemon = useCallback(
    (exclude: number[] = []): Pokemon[] => {
      const available = pokemon.filter((p) => p.stats && !exclude.includes(p.id));
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 4);
    },
    [pokemon],
  );

  const startNewRound = useCallback(() => {
    if (pokemon.length < 4) return;

    const randomPokemon = getRandomPokemon();
    const correct = randomPokemon[Math.floor(Math.random() * randomPokemon.length)];

    setCurrentPokemon(correct);
    setOptions(randomPokemon.sort(() => Math.random() - 0.5));
    setRevealed(false);
    setSelectedAnswer(null);
    setShowHint(false);
  }, [pokemon, getRandomPokemon]);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setLives(3);
    setHintsUsed(0);
    setGameOver(false);
    setGameStarted(true);
    startNewRound();
  };

  const useHint = () => {
    if (hintsUsed >= 3 || revealed) return;
    setHintsUsed((prev) => prev + 1);
    setShowHint(true);
  };

  const handleAnswer = async (pokemonId: number) => {
    if (revealed || !currentPokemon) return;

    setSelectedAnswer(pokemonId);
    setRevealed(true);
    setTotalQuestions((prev) => prev + 1);

    const isCorrect = pokemonId === currentPokemon.id;

    if (isCorrect) {
      const basePoints = 15;
      const hintPenalty = showHint ? 5 : 0;
      const streakBonus = streak >= 5 ? 5 : 0;
      setScore((prev) => prev + basePoints - hintPenalty + streakBonus);
      setStreak((prev) => prev + 1);
      setBestStreak((prev) => Math.max(prev, streak + 1));
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setStreak(0);
      setLives((prev) => prev - 1);

      if (lives <= 1) {
        setGameOver(true);
        await submitScore({
          score,
          correctAnswers,
          totalQuestions: totalQuestions + 1,
          streak: bestStreak,
          difficulty: "medium",
        });
        return;
      }
    }

    setTimeout(() => {
      startNewRound();
    }, 2000);
  };

  const getSpriteUrl = (id: number) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  const getStatColor = (value: number) => {
    if (value >= 100) return "bg-green-500";
    if (value >= 70) return "bg-yellow-500";
    if (value >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  if (!gameStarted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isAr ? "رجوع" : "Back"}
          </Button>
          <CardTitle className="text-center text-2xl">
            <BarChart3 className="w-8 h-8 inline mr-2 text-green-400" />
            {isAr ? "تخمين الإحصائيات" : "Stat Guesser"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {isAr ? "تعرّف على البوكيمون من إحصائياته!" : "Identify the Pokémon from its stats!"}
          </p>

          <div className="p-4 rounded-xl bg-muted/50">
            <div className="space-y-2 text-sm">
              {Object.entries(STAT_NAMES)
                .slice(0, 3)
                .map(([key, name]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-16">{isAr ? name.ar : name.en}</span>
                    <Progress value={Math.random() * 100} className="flex-1 h-2" />
                  </div>
                ))}
            </div>
          </div>

          <Button className="w-full h-14" onClick={startGame}>
            {isAr ? "ابدأ!" : "Start!"}
          </Button>

          {highScore > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              <Trophy className="w-4 h-4 inline mr-1" />
              {isAr ? "أعلى نتيجة: " : "High Score: "}
              {highScore}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (gameOver) {
    return (
      <ScoreBoard
        score={score}
        correctAnswers={correctAnswers}
        totalQuestions={totalQuestions}
        streak={bestStreak}
        bestStreak={bestStreak}
        highScore={highScore}
        isNewHighScore={score > highScore}
        onPlayAgain={startGame}
        onGoBack={onBack}
      />
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-primary">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{score}</span>
            </div>
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="font-bold">{streak}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-1">
            {Array.from({ length: lives }).map((_, i) => (
              <span key={i} className="text-red-500">
                ❤️
              </span>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={useHint}
            disabled={hintsUsed >= 3 || revealed || showHint}
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            {3 - hintsUsed}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Display */}
        {currentPokemon && currentPokemon.stats && (
          <div className="p-4 rounded-xl bg-muted/50 space-y-2">
            {Object.entries(currentPokemon.stats).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-16 text-xs">
                  {isAr
                    ? STAT_NAMES[key as keyof typeof STAT_NAMES].ar
                    : STAT_NAMES[key as keyof typeof STAT_NAMES].en}
                </span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all", getStatColor(value as number))}
                    style={{ width: `${Math.min(((value as number) / 255) * 100, 100)}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-right">{value}</span>
              </div>
            ))}
            <div className="text-center text-sm font-medium pt-2 border-t border-border">
              {isAr ? "المجموع: " : "Total: "}
              {Object.values(currentPokemon.stats).reduce(
                (a, b) => (a as number) + (b as number),
                0,
              )}
            </div>
          </div>
        )}

        {/* Hint - Show sprite silhouette */}
        {showHint && currentPokemon && (
          <div className="flex justify-center">
            <img
              src={getSpriteUrl(currentPokemon.id)}
              alt="Hint"
              className="w-16 h-16 brightness-0 contrast-200 opacity-50"
            />
          </div>
        )}

        {/* Revealed Pokemon */}
        {revealed && currentPokemon && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/20">
              <img
                src={getSpriteUrl(currentPokemon.id)}
                alt={currentPokemon.name_en}
                className="w-12 h-12"
              />
              <span className="font-medium">
                {isAr ? currentPokemon.name_ar : currentPokemon.name_en}
              </span>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <Button
              key={option.id}
              variant={
                revealed
                  ? option.id === currentPokemon?.id
                    ? "default"
                    : selectedAnswer === option.id
                      ? "destructive"
                      : "outline"
                  : "outline"
              }
              className={cn(
                "h-14 text-sm font-medium transition-all",
                revealed && option.id === currentPokemon?.id && "bg-green-500 hover:bg-green-500",
              )}
              onClick={() => handleAnswer(option.id)}
              disabled={revealed}
            >
              {isAr ? option.name_ar : option.name_en}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
