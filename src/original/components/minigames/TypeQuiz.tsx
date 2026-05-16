import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Trophy, Flame, ArrowLeft, Zap } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useMiniGameStats } from "@/original/hooks/useMiniGameStats";
import { ScoreBoard } from "./ScoreBoard";
import { TYPE_LABELS, getLocalizedType } from "@/original/lib/localization";
import { TYPE_CHART, getTypeColor } from "@/original/lib/typeChart";

interface TypeQuizProps {
  onBack: () => void;
}

const TYPES = Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[];

interface Question {
  type: "weakness" | "resistance" | "superEffective";
  attackingType: string;
  defendingType?: string;
  correctAnswer: string;
  options: string[];
}

export function TypeQuiz({ onBack }: TypeQuizProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { highScore, submitScore } = useMiniGameStats("type-quiz");

  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");

  const generateQuestion = useCallback((): Question => {
    const questionTypes: Question["type"][] = ["weakness", "superEffective"];
    if (difficulty !== "easy") questionTypes.push("resistance");

    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const attackingType = TYPES[Math.floor(Math.random() * TYPES.length)];

    let correctAnswer: string;
    let options: string[];

    if (type === "superEffective") {
      // What is super effective against X?
      const effectiveness = TYPE_CHART[attackingType];
      const superEffective = Object.entries(effectiveness || {})
        .filter(([_, value]) => value === 2)
        .map(([key]) => key);

      if (superEffective.length === 0) {
        return generateQuestion();
      }

      correctAnswer = superEffective[Math.floor(Math.random() * superEffective.length)];
      const wrongOptions = TYPES.filter((t) => t !== correctAnswer && !superEffective.includes(t));
      options = [correctAnswer, ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)];
    } else {
      // What is X weak/resistant to?
      const effectiveness = TYPE_CHART[attackingType];
      const targets = Object.entries(effectiveness || {})
        .filter(([_, value]) => (type === "weakness" ? value === 2 : value === 0.5))
        .map(([key]) => key);

      if (targets.length === 0) {
        return generateQuestion();
      }

      correctAnswer = targets[Math.floor(Math.random() * targets.length)];
      const wrongOptions = TYPES.filter((t) => t !== correctAnswer && !targets.includes(t));
      options = [correctAnswer, ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)];
    }

    return {
      type,
      attackingType,
      correctAnswer,
      options: options.sort(() => Math.random() - 0.5),
    };
  }, [difficulty]);

  const startGame = (diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setLives(diff === "easy" ? 5 : diff === "medium" ? 3 : 2);
    setGameOver(false);
    setGameStarted(true);
    setQuestion(generateQuestion());
    setRevealed(false);
    setSelectedAnswer(null);
  };

  const handleAnswer = async (answer: string) => {
    if (revealed || !question) return;

    setSelectedAnswer(answer);
    setRevealed(true);
    setTotalQuestions((prev) => prev + 1);

    const isCorrect = answer === question.correctAnswer;

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
      setQuestion(generateQuestion());
      setRevealed(false);
      setSelectedAnswer(null);
    }, 1500);
  };

  const getQuestionText = () => {
    if (!question) return "";
    const typeName = isAr
      ? TYPE_LABELS[question.attackingType as keyof typeof TYPE_LABELS]
      : question.attackingType;

    switch (question.type) {
      case "weakness":
        return isAr
          ? `نوع ${typeName} ضعيف ضد أي نوع؟`
          : `What type is ${question.attackingType} weak against?`;
      case "resistance":
        return isAr
          ? `نوع ${typeName} مقاوم لأي نوع؟`
          : `What type is ${question.attackingType} resistant to?`;
      case "superEffective":
        return isAr
          ? `أي نوع فعّال جداً ضد ${typeName}؟`
          : `What type is super effective against ${question.attackingType}?`;
    }
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
            <Zap className="w-8 h-8 inline mr-2 text-yellow-400" />
            {isAr ? "اختبار الأنواع" : "Type Quiz"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {isAr ? "اختبر معرفتك بفعاليات الأنواع!" : "Test your knowledge of type effectiveness!"}
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="outline" className="h-16" onClick={() => startGame("easy")}>
              <div className="text-left">
                <div className="font-bold text-green-400">{isAr ? "سهل" : "Easy"}</div>
                <div className="text-xs text-muted-foreground">
                  {isAr ? "نقاط الضعف فقط" : "Weaknesses only"}
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-16" onClick={() => startGame("medium")}>
              <div className="text-left">
                <div className="font-bold text-yellow-400">{isAr ? "متوسط" : "Medium"}</div>
                <div className="text-xs text-muted-foreground">
                  {isAr ? "نقاط الضعف والمقاومات" : "Weaknesses & resistances"}
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-16" onClick={() => startGame("hard")}>
              <div className="text-left">
                <div className="font-bold text-red-400">{isAr ? "صعب" : "Hard"}</div>
                <div className="text-xs text-muted-foreground">
                  {isAr ? "محاولتان فقط" : "2 lives only"}
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

        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-red-500">
              ❤️
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {question && (
          <>
            {/* Type Badge */}
            <div className="flex justify-center">
              <Badge
                className="text-lg px-4 py-2"
                style={{ backgroundColor: getTypeColor(question.attackingType) }}
              >
                {isAr
                  ? TYPE_LABELS[question.attackingType as keyof typeof TYPE_LABELS]?.ar
                  : question.attackingType}
              </Badge>
            </div>

            {/* Question */}
            <p className="text-center text-lg font-medium">{getQuestionText()}</p>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((option) => (
                <Button
                  key={option}
                  variant={
                    revealed
                      ? option === question.correctAnswer
                        ? "default"
                        : selectedAnswer === option
                          ? "destructive"
                          : "outline"
                      : "outline"
                  }
                  className={cn(
                    "h-14 text-sm font-medium transition-all",
                    revealed &&
                      option === question.correctAnswer &&
                      "bg-green-500 hover:bg-green-500",
                  )}
                  onClick={() => handleAnswer(option)}
                  disabled={revealed}
                >
                  {isAr ? TYPE_LABELS[option as keyof typeof TYPE_LABELS]?.ar : option}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
