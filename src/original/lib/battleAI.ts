/**
 * Advanced Battle AI System
 * Implements intelligent move selection based on difficulty levels
 */

import { BattlePokemon, BattleMove, getTypeEffectiveness, STRUGGLE_MOVE } from "./battleUtils";

export type Difficulty = "easy" | "normal" | "hard" | "expert";

export const DIFFICULTY_LABELS = {
  easy: { en: "Easy", ar: "سهل", stars: 1, color: "text-green-500" },
  normal: { en: "Normal", ar: "متوسط", stars: 2, color: "text-yellow-500" },
  hard: { en: "Hard", ar: "صعب", stars: 3, color: "text-orange-500" },
  expert: { en: "Expert", ar: "خبير", stars: 4, color: "text-red-500" },
};

export const DIFFICULTY_MULTIPLIERS: Record<
  Difficulty,
  { damageMultiplier: number; accuracy: number }
> = {
  easy: { damageMultiplier: 0.8, accuracy: 0.9 },
  normal: { damageMultiplier: 1.0, accuracy: 1.0 },
  hard: { damageMultiplier: 1.2, accuracy: 1.0 },
  expert: { damageMultiplier: 1.3, accuracy: 1.1 },
};

/**
 * Calculate move score for AI decision making
 */
function calculateMoveScore(
  move: BattleMove,
  attacker: BattlePokemon,
  defender: BattlePokemon,
): number {
  if (!move.power || move.power === 0) return 10; // Status moves get low score

  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const accuracy = move.accuracy || 100;

  return move.power * effectiveness * stab * (accuracy / 100);
}

/**
 * AI selects move based on difficulty
 */
export function aiSelectMoveAdvanced(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  difficulty: Difficulty,
): BattleMove {
  const validMoves = attacker.moves.filter((m) => m);

  if (validMoves.length === 0) {
    return STRUGGLE_MOVE as BattleMove;
  }

  switch (difficulty) {
    case "easy":
      // Random move selection
      return validMoves[Math.floor(Math.random() * validMoves.length)];

    case "normal":
      // 50% chance to pick best move, 50% random
      if (Math.random() < 0.5) {
        const scored = validMoves.map((m) => ({
          move: m,
          score: calculateMoveScore(m, attacker, defender),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored[0].move;
      }
      return validMoves[Math.floor(Math.random() * validMoves.length)];

    case "hard":
      // Always pick best move
      const hardScored = validMoves.map((m) => ({
        move: m,
        score: calculateMoveScore(m, attacker, defender),
      }));
      hardScored.sort((a, b) => b.score - a.score);
      return hardScored[0].move;

    case "expert":
      // Pick best move with some strategy (avoid overkill, save strong moves)
      const expertScored = validMoves.map((m) => ({
        move: m,
        score: calculateMoveScore(m, attacker, defender),
      }));
      expertScored.sort((a, b) => b.score - a.score);

      // If defender HP is low, use weaker move to conserve PP
      if (defender.currentHp < defender.maxHp * 0.2 && expertScored.length > 1) {
        const efficientMoves = expertScored.filter((m) => m.score >= 50);
        if (efficientMoves.length > 0) {
          return efficientMoves[efficientMoves.length - 1].move;
        }
      }
      return expertScored[0].move;

    default:
      return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
}

/**
 * AI decides whether to switch Pokemon
 */
export function aiShouldSwitch(
  currentPokemon: BattlePokemon,
  team: BattlePokemon[],
  opponent: BattlePokemon,
  difficulty: Difficulty,
): number | null {
  if (difficulty === "easy" || difficulty === "normal") {
    return null; // Don't switch on easy/normal
  }

  // Check if current Pokemon is at type disadvantage
  const currentScore = team.reduce(
    (best, poke, index) => {
      if (poke.isFainted) return best;

      // Calculate defensive score against opponent
      let score = 0;
      for (const oppType of opponent.types) {
        const eff = getTypeEffectiveness(oppType, poke.types);
        if (eff < 1) score += 2;
        if (eff > 1) score -= 2;
      }

      // Add offensive score
      for (const move of poke.moves) {
        if (move) {
          const eff = getTypeEffectiveness(move.type, opponent.types);
          if (eff > 1) score += 1;
        }
      }

      if (score > best.score) {
        return { index, score };
      }
      return best;
    },
    { index: -1, score: -999 },
  );

  // Check current Pokemon's score
  let currentDefScore = 0;
  for (const oppType of opponent.types) {
    const eff = getTypeEffectiveness(oppType, currentPokemon.types);
    if (eff < 1) currentDefScore += 2;
    if (eff > 1) currentDefScore -= 2;
  }

  // Switch if there's a significantly better option
  if (currentScore.score > currentDefScore + 3 && currentScore.index !== -1) {
    // Expert: 30% chance to switch, Hard: 15% chance
    const switchChance = difficulty === "expert" ? 0.3 : 0.15;
    if (Math.random() < switchChance) {
      return currentScore.index;
    }
  }

  return null;
}

/**
 * Get AI battle tips for player
 */
export function getAITip(
  playerPokemon: BattlePokemon,
  enemyPokemon: BattlePokemon,
  language: "en" | "ar",
): string {
  // Find best move
  const validMoves = playerPokemon.moves.filter((m) => m && m.power);
  if (validMoves.length === 0) {
    return language === "ar" ? "استخدم أي حركة متاحة!" : "Use any available move!";
  }

  const scored = validMoves.map((m) => ({
    move: m,
    score: calculateMoveScore(m, playerPokemon, enemyPokemon),
    effectiveness: getTypeEffectiveness(m.type, enemyPokemon.types),
  }));
  scored.sort((a, b) => b.score - a.score);

  const bestMove = scored[0];

  if (bestMove.effectiveness >= 2) {
    return language === "ar"
      ? `${bestMove.move.name_ar} فعالة جداً! استخدمها!`
      : `${bestMove.move.name_en} is super effective! Use it!`;
  }

  if (bestMove.effectiveness < 1 && bestMove.effectiveness > 0) {
    return language === "ar"
      ? `حركاتك ليست فعالة جداً. حاول التبديل!`
      : `Your moves aren't very effective. Try switching!`;
  }

  return language === "ar"
    ? `${bestMove.move.name_ar} هي أفضل خيار لديك`
    : `${bestMove.move.name_en} is your best option`;
}
