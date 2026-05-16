import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Trophy, Flame, ArrowLeft, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useMiniGameStats } from "@/original/hooks/useMiniGameStats";
import { ScoreBoard } from "./ScoreBoard";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
}

interface SoundMatchProps {
  pokemon: Pokemon[];
  onBack: () => void;
}

export function SoundMatch({ pokemon, onBack }: SoundMatchProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { highScore, submitScore } = useMiniGameStats("sound-match");
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const [isPlaying, setIsPlaying] = useState(false);

  const getCryUrl = (id: number) =>
    `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

  const getRandomPokemon = useCallback(
    (exclude: number[] = []): Pokemon[] => {
      // Filter to Gen 1-8 for better cry availability
      const available = pokemon.filter((p) => p.id <= 898 && !exclude.includes(p.id));
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 4);
    },
    [pokemon],
  );

  const playSound = useCallback(() => {
    if (!currentPokemon) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(getCryUrl(currentPokemon.id));
    audioRef.current.volume = 0.5;

    setIsPlaying(true);
    audioRef.current.play().catch(() => {
      setIsPlaying(false);
    });

    audioRef.current.onended = () => {
      setIsPlaying(false);
    };
  }, [currentPokemon]);

  const startNewRound = useCallback(() => {
    if (pokemon.length < 4) return;

    const randomPokemon = getRandomPokemon();
    const correct = randomPokemon[Math.floor(Math.random() * randomPokemon.length)];

    setCurrentPokemon(correct);
    setOptions(randomPokemon.sort(() => Math.random() - 0.5));
    setRevealed(false);
    setSelectedAnswer(null);
    setIsPlaying(false);
  }, [pokemon, getRandomPokemon]);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setLives(3);
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
      const points = 20;
      const streakBonus = streak >= 5 ? 10 : 0;
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

  if (!gameStarted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isAr ? "رجوع" : "Back"}
          </Button>
          <CardTitle className="text-center text-2xl">
            <Volume2 className="w-8 h-8 inline mr-2 text-purple-400" />
            {isAr ? "مطابقة الأصوات" : "Sound Match"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {isAr
              ? "استمع لصوت البوكيمون وتعرّف عليه!"
              : "Listen to the Pokémon cry and identify it!"}
          </p>

          <div className="text-center p-6 rounded-xl bg-muted/50">
            <Volume2 className="w-16 h-16 mx-auto text-purple-400 mb-2" />
            <div className="text-lg">
              {isAr ? "🎧 يُنصح باستخدام سماعات" : "🎧 Headphones recommended"}
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

        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-red-500">
              ❤️
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sound Player */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className={cn("w-24 h-24 rounded-full", isPlaying && "animate-pulse")}
            onClick={playSound}
            disabled={revealed}
          >
            {isPlaying ? <Volume2 className="w-10 h-10" /> : <Volume2 className="w-10 h-10" />}
          </Button>
          <span className="text-sm text-muted-foreground">
            {isAr ? "انقر للاستماع" : "Click to listen"}
          </span>

          {/* Revealed Pokemon */}
          {revealed && currentPokemon && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <img
                src={getSpriteUrl(currentPokemon.id)}
                alt={currentPokemon.name_en}
                className="w-12 h-12"
              />
              <span className="font-medium">
                {isAr ? currentPokemon.name_ar : currentPokemon.name_en}
              </span>
            </div>
          )}
        </div>

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
