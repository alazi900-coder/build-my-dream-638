import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Progress } from "@/original/components/ui/progress";
import { Trophy, Clock, ArrowLeft, Play } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useMiniGameStats } from "@/original/hooks/useMiniGameStats";
import { ScoreBoard } from "./ScoreBoard";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
}

interface SpeedRunProps {
  pokemon: Pokemon[];
  onBack: () => void;
}

export function SpeedRun({ pokemon, onBack }: SpeedRunProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { highScore, submitScore } = useMiniGameStats("speed-run");

  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [options, setOptions] = useState<Pokemon[]>([]);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    setSelectedAnswer(null);
  }, [pokemon, getRandomPokemon]);

  const startGame = () => {
    setScore(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setTimeLeft(60);
    setGameOver(false);
    setGameStarted(true);
    setStreak(0);
    setBestStreak(0);
    startNewRound();
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver && gameStarted) {
      submitScore({
        score,
        correctAnswers,
        totalQuestions,
        streak: bestStreak,
        difficulty: "medium",
      });
    }
  }, [gameOver, gameStarted, score, correctAnswers, totalQuestions, bestStreak, submitScore]);

  const handleAnswer = (pokemonId: number) => {
    if (!currentPokemon || gameOver) return;

    setSelectedAnswer(pokemonId);
    setTotalQuestions((prev) => prev + 1);

    const isCorrect = pokemonId === currentPokemon.id;

    if (isCorrect) {
      const basePoints = 10;
      const timeBonus = Math.floor(timeLeft / 10);
      const streakBonus = streak >= 5 ? 5 : 0;
      setScore((prev) => prev + basePoints + timeBonus + streakBonus);
      setCorrectAnswers((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setBestStreak((prev) => Math.max(prev, streak + 1));
    } else {
      setStreak(0);
    }

    // Quick transition for speed run
    setTimeout(() => {
      startNewRound();
    }, 300);
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
            <Clock className="w-8 h-8 inline mr-2 text-blue-400" />
            {isAr ? "سباق السرعة" : "Speed Run"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {isAr
              ? "تعرّف على أكبر عدد من البوكيمون في 60 ثانية!"
              : "Identify as many Pokémon as you can in 60 seconds!"}
          </p>

          <div className="text-center p-6 rounded-xl bg-muted/50">
            <Clock className="w-16 h-16 mx-auto text-blue-400 mb-2" />
            <div className="text-2xl font-bold">60 {isAr ? "ثانية" : "seconds"}</div>
          </div>

          <Button className="w-full h-14" onClick={startGame}>
            <Play className="w-5 h-5 mr-2" />
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
        timeElapsed={60}
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
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="w-4 h-4" />
            <span className="font-bold text-xl">{score}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 text-2xl font-bold",
              timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-400",
            )}
          >
            <Clock className="w-5 h-5" />
            {timeLeft}
          </div>
        </div>
        <Progress value={(timeLeft / 60) * 100} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pokemon Image */}
        {currentPokemon && (
          <div className="w-32 h-32 mx-auto bg-muted/50 rounded-xl flex items-center justify-center">
            <img
              src={getSpriteUrl(currentPokemon.id)}
              alt="Who's that Pokémon?"
              className="w-24 h-24"
            />
          </div>
        )}

        {/* Options - 2x2 grid for speed */}
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className={cn(
                "h-12 text-sm font-medium transition-all",
                selectedAnswer === option.id &&
                  option.id === currentPokemon?.id &&
                  "bg-green-500/50",
                selectedAnswer === option.id && option.id !== currentPokemon?.id && "bg-red-500/50",
              )}
              onClick={() => handleAnswer(option.id)}
            >
              {isAr ? option.name_ar : option.name_en}
            </Button>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {isAr ? "الصحيحة: " : "Correct: "}
          {correctAnswers} |{isAr ? " السلسلة: " : " Streak: "}
          {streak}
        </div>
      </CardContent>
    </Card>
  );
}
