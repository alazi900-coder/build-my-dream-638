import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Progress } from "@/original/components/ui/progress";
import { Trophy, Flame, ArrowLeft, HelpCircle } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useMiniGameStats } from "@/original/hooks/useMiniGameStats";
import { ScoreBoard } from "./ScoreBoard";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
}

interface WhosThatPokemonProps {
  pokemon: Pokemon[];
  onBack: () => void;
}

export function WhosThatPokemon({ pokemon, onBack }: WhosThatPokemonProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { highScore, submitScore } = useMiniGameStats("whos-that-pokemon");

  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [options, setOptions] = useState<Pokemon[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [gameStarted, setGameStarted] = useState(false);

  const getRandomPokemon = useCallback(
    (exclude: number[] = []): Pokemon[] => {
      const available = pokemon.filter((p) => !exclude.includes(p.id));
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
  }, [pokemon, getRandomPokemon]);

  const startGame = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setLives(diff === "easy" ? 5 : diff === "medium" ? 3 : 1);
    setGameOver(false);
    setGameStarted(true);
    startNewRound();
  };

  const handleAnswer = async (pokemonId: number) => {
    if (revealed || !currentPokemon) return;

    setSelectedAnswer(pokemonId);
    setRevealed(true);
    setTotalQuestions((prev) => prev + 1);

    const isCorrect = pokemonId === currentPokemon.id;

    if (isCorrect) {
      const points = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30;
      const streakBonus = streak >= 5 ? Math.floor(points * 0.5) : 0;
      setScore((prev) => prev + points + streakBonus);
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
          difficulty,
        });
        return;
      }
    }

    setTimeout(() => {
      startNewRound();
    }, 1500);
  };

  const getSpriteUrl = (id: number) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  if (!gameStarted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isAr ? "رجوع" : "Back"}
          </Button>
          <CardTitle className="text-center text-2xl">
            🎭 {isAr ? "من هذا البوكيمون؟" : "Who's That Pokémon?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {isAr
              ? "حدد البوكيمون من ظله! اختر مستوى الصعوبة:"
              : "Identify the Pokémon from its silhouette! Choose difficulty:"}
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="outline" className="h-16" onClick={() => startGame("easy")}>
              <div className="text-left">
                <div className="font-bold text-green-400">{isAr ? "سهل" : "Easy"}</div>
                <div className="text-xs text-muted-foreground">
                  {isAr ? "5 محاولات • 10 نقاط" : "5 lives • 10 points"}
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-16" onClick={() => startGame("medium")}>
              <div className="text-left">
                <div className="font-bold text-yellow-400">{isAr ? "متوسط" : "Medium"}</div>
                <div className="text-xs text-muted-foreground">
                  {isAr ? "3 محاولات • 20 نقطة" : "3 lives • 20 points"}
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-16" onClick={() => startGame("hard")}>
              <div className="text-left">
                <div className="font-bold text-red-400">{isAr ? "صعب" : "Hard"}</div>
                <div className="text-xs text-muted-foreground">
                  {isAr ? "محاولة واحدة • 30 نقطة" : "1 life • 30 points"}
                </div>
              </div>
            </Button>
          </div>

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
        onPlayAgain={() => startGame(difficulty)}
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

        {/* Lives */}
        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-red-500">
              ❤️
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Silhouette */}
        {currentPokemon && (
          <div className="relative w-48 h-48 mx-auto bg-muted/50 rounded-xl flex items-center justify-center">
            <img
              src={getSpriteUrl(currentPokemon.id)}
              alt="Who's that Pokémon?"
              className={cn(
                "w-32 h-32 transition-all duration-500",
                !revealed && "brightness-0 contrast-200",
              )}
            />
            {!revealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <HelpCircle className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
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
