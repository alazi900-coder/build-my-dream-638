// @ts-nocheck
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Trophy, Flame, ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useMiniGameStats } from "@/original/hooks/useMiniGameStats";
import { ScoreBoard } from "./ScoreBoard";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
}

// Common evolution chains (base -> evolution)
const EVOLUTION_CHAINS: [number, number, number?][] = [
  [1, 2, 3], // Bulbasaur -> Ivysaur -> Venusaur
  [4, 5, 6], // Charmander -> Charmeleon -> Charizard
  [7, 8, 9], // Squirtle -> Wartortle -> Blastoise
  [25, 26], // Pikachu -> Raichu
  [133, 134], // Eevee -> Vaporeon
  [133, 135], // Eevee -> Jolteon
  [133, 136], // Eevee -> Flareon
  [147, 148, 149], // Dratini -> Dragonair -> Dragonite
  [63, 64, 65], // Abra -> Kadabra -> Alakazam
  [92, 93, 94], // Gastly -> Haunter -> Gengar
  [129, 130], // Magikarp -> Gyarados
  [74, 75, 76], // Geodude -> Graveler -> Golem
  [66, 67, 68], // Machop -> Machoke -> Machamp
  [246, 247, 248], // Larvitar -> Pupitar -> Tyranitar
  [252, 253, 254], // Treecko -> Grovyle -> Sceptile
  [255, 256, 257], // Torchic -> Combusken -> Blaziken
  [258, 259, 260], // Mudkip -> Marshtomp -> Swampert
  [387, 388, 389], // Turtwig -> Grotle -> Torterra
  [390, 391, 392], // Chimchar -> Monferno -> Infernape
  [393, 394, 395], // Piplup -> Prinplup -> Empoleon
];

interface EvolutionPuzzleProps {
  pokemon: Pokemon[];
  onBack: () => void;
}

export function EvolutionPuzzle({ pokemon, onBack }: EvolutionPuzzleProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { highScore, submitScore } = useMiniGameStats("evolution-puzzle");

  const [currentChain, setCurrentChain] = useState<[number, number, number?] | null>(null);
  const [missingIndex, setMissingIndex] = useState(0);
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

  const getPokemonById = useCallback(
    (id: number): Pokemon | undefined => {
      return pokemon.find((p) => p.id === id);
    },
    [pokemon],
  );

  const getRandomWrongOptions = useCallback(
    (correctId: number, count: number): Pokemon[] => {
      return pokemon
        .filter((p) => p.id !== correctId && p.id <= 500)
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
    },
    [pokemon],
  );

  const startNewRound = useCallback(() => {
    // Pick a random evolution chain
    const validChains = EVOLUTION_CHAINS.filter((chain) => chain.every((id) => getPokemonById(id)));

    if (validChains.length === 0) return;

    const chain = validChains[Math.floor(Math.random() * validChains.length)];
    const missing = Math.floor(Math.random() * chain.length);

    setCurrentChain(chain);
    setMissingIndex(missing);

    const correctPokemon = getPokemonById(chain[missing]!)!;
    const wrongOptions = getRandomWrongOptions(chain[missing]!, 3);

    setOptions([correctPokemon, ...wrongOptions].sort(() => Math.random() - 0.5));
    setRevealed(false);
    setSelectedAnswer(null);
  }, [pokemon, getPokemonById, getRandomWrongOptions]);

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
    if (revealed || !currentChain) return;

    setSelectedAnswer(pokemonId);
    setRevealed(true);
    setTotalQuestions((prev) => prev + 1);

    const correctId = currentChain[missingIndex];
    const isCorrect = pokemonId === correctId;

    if (isCorrect) {
      const points = 15;
      const streakBonus = streak >= 5 ? 5 : 0;
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
            🧩 {isAr ? "لغز التطور" : "Evolution Puzzle"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {isAr ? "أكمل سلسلة التطور المفقودة!" : "Complete the missing evolution chain!"}
          </p>

          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted/50">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <img src={getSpriteUrl(1)} alt="" className="w-10 h-10" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center border-2 border-dashed border-primary">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <img src={getSpriteUrl(3)} alt="" className="w-10 h-10" />
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
        {/* Evolution Chain Display */}
        {currentChain && (
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted/50">
            {currentChain.map((id, index) => (
              <React.Fragment key={id}>
                {index > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                {index === missingIndex ? (
                  <div
                    className={cn(
                      "w-16 h-16 rounded-lg flex items-center justify-center border-2 border-dashed",
                      revealed
                        ? "bg-primary/20 border-primary"
                        : "bg-muted border-muted-foreground",
                    )}
                  >
                    {revealed ? (
                      <img src={getSpriteUrl(id!)} alt="" className="w-12 h-12" />
                    ) : (
                      <HelpCircle className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <img src={getSpriteUrl(id!)} alt="" className="w-12 h-12" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <p className="text-center text-muted-foreground">
          {isAr ? "ما البوكيمون المفقود؟" : "What's the missing Pokémon?"}
        </p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => {
            const correctId = currentChain?.[missingIndex];
            return (
              <Button
                key={option.id}
                variant={
                  revealed
                    ? option.id === correctId
                      ? "default"
                      : selectedAnswer === option.id
                        ? "destructive"
                        : "outline"
                    : "outline"
                }
                className={cn(
                  "h-20 flex flex-col items-center gap-1 transition-all",
                  revealed && option.id === correctId && "bg-green-500 hover:bg-green-500",
                )}
                onClick={() => handleAnswer(option.id)}
                disabled={revealed}
              >
                <img src={getSpriteUrl(option.id)} alt="" className="w-10 h-10" />
                <span className="text-xs">{isAr ? option.name_ar : option.name_en}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
