/**
 * Battle system utilities
 * Implements damage calculation, type effectiveness, and battle logic
 */

import { TYPE_LABELS } from "./localization";

// Type chart for effectiveness - imported from existing typeChart.ts logic
const typeChart: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Struggle move - fallback when no moves available
export const STRUGGLE_MOVE = {
  id: -1,
  name_en: "Struggle",
  name_ar: "كفاح",
  type: "normal",
  power: 50,
  accuracy: 100,
  pp: 999,
  category: "physical",
};

export interface BattlePokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  currentHp: number;
  maxHp: number;
  moves: BattleMove[];
  isFainted: boolean;
}

export interface BattleMove {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  category: string;
}

export interface BattleLogEntry {
  messageEn: string;
  messageAr: string;
  type: "action" | "damage" | "faint" | "switch" | "end";
}

/**
 * Get type effectiveness multiplier
 */
export function getTypeEffectiveness(attackType: string, defenderTypes: string[]): number {
  let effectiveness = 1;
  const attackTypeLower = attackType.toLowerCase();

  for (const defType of defenderTypes) {
    const defTypeLower = defType.toLowerCase();
    const chart = typeChart[attackTypeLower];
    if (chart && chart[defTypeLower] !== undefined) {
      effectiveness *= chart[defTypeLower];
    }
  }

  return effectiveness;
}

/**
 * Check if move gets STAB (Same Type Attack Bonus)
 */
export function hasSTAB(moveType: string, attackerTypes: string[]): boolean {
  return attackerTypes.some((t) => t.toLowerCase() === moveType.toLowerCase());
}

/**
 * Calculate damage for a move
 * Uses simplified damage formula
 */
export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
): { damage: number; effectiveness: number; isSTAB: boolean; isCritical: boolean } {
  // Base power - use move power or default
  const basePower = move.power && move.power > 0 ? move.power : 40;

  // Get attack and defense stats based on move category
  let atkStat: number;
  let defStat: number;

  if (move.category === "special") {
    atkStat = attacker.stats.spa || 50;
    defStat = defender.stats.spd || 50;
  } else {
    atkStat = attacker.stats.atk || 50;
    defStat = defender.stats.def || 50;
  }

  // Calculate scaling factor (clamped between 0.5 and 2.0)
  const scaling = Math.max(0.5, Math.min(2.0, atkStat / defStat));

  // STAB bonus
  const stab = hasSTAB(move.type, attacker.types) ? 1.5 : 1.0;

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.types);

  // Critical hit chance (6.25% base rate)
  const isCritical = Math.random() < 0.0625;
  const critMultiplier = isCritical ? 1.5 : 1.0;

  // Calculate final damage
  const damage = Math.max(
    1,
    Math.round(basePower * stab * effectiveness * scaling * critMultiplier),
  );

  return { damage, effectiveness, isSTAB: stab > 1, isCritical };
}

/**
 * Determine turn order based on speed
 */
export function determineTurnOrder(
  player: BattlePokemon,
  enemy: BattlePokemon,
): "player" | "enemy" {
  const playerSpeed = player.stats?.spe || 50;
  const enemySpeed = enemy.stats?.spe || 50;

  if (playerSpeed >= enemySpeed) return "player";
  return "enemy";
}

/**
 * AI selects a random move
 */
export function aiSelectMove(pokemon: BattlePokemon): BattleMove {
  if (!pokemon.moves || pokemon.moves.length === 0) {
    return STRUGGLE_MOVE as BattleMove;
  }
  const validMoves = pokemon.moves.filter((m) => m);
  if (validMoves.length === 0) return STRUGGLE_MOVE as BattleMove;
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

/**
 * Generate effectiveness message
 */
export function getEffectivenessMessage(
  effectiveness: number,
  language: "en" | "ar",
): string | null {
  if (effectiveness === 0) {
    return language === "ar" ? "لا يؤثر!" : "It has no effect!";
  }
  if (effectiveness >= 2) {
    return language === "ar" ? "فعال جداً!" : "It's super effective!";
  }
  if (effectiveness < 1 && effectiveness > 0) {
    return language === "ar" ? "ليس فعالاً جداً..." : "It's not very effective...";
  }
  return null;
}

/**
 * Create battle log entry for an attack
 */
export function createAttackLog(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  damage: number,
  effectiveness: number,
  language: "en" | "ar",
  isCritical?: boolean,
): BattleLogEntry[] {
  const logs: BattleLogEntry[] = [];

  // Attack message
  logs.push({
    messageEn: `${attacker.name_en} used ${move.name_en}!`,
    messageAr: `${attacker.name_ar} استخدم ${move.name_ar}!`,
    type: "action",
  });

  // Critical hit message
  if (isCritical) {
    logs.push({
      messageEn: "A critical hit!",
      messageAr: "ضربة حرجة!",
      type: "damage",
    });
  }

  // Effectiveness message
  const effMsg = getEffectivenessMessage(effectiveness, "en");
  if (effMsg) {
    logs.push({
      messageEn: effMsg,
      messageAr: getEffectivenessMessage(effectiveness, "ar") || "",
      type: "damage",
    });
  }

  // Damage message
  if (effectiveness > 0) {
    logs.push({
      messageEn: `${defender.name_en} took ${damage} damage!`,
      messageAr: `${defender.name_ar} تلقى ${damage} ضرر!`,
      type: "damage",
    });
  }

  return logs;
}

/**
 * Create faint log entry
 */
export function createFaintLog(pokemon: BattlePokemon): BattleLogEntry {
  return {
    messageEn: `${pokemon.name_en} fainted!`,
    messageAr: `${pokemon.name_ar} أغمي عليه!`,
    type: "faint",
  };
}

/**
 * Battle UI labels
 */
export const BATTLE_LABELS = {
  battle: { en: "Battle", ar: "المعركة" },
  teamBuilder: { en: "Team Builder", ar: "بناء الفريق" },
  startBattle: { en: "Start Battle", ar: "ابدأ المعركة" },
  yourTurn: { en: "Your Turn", ar: "دورك" },
  enemyTurn: { en: "Enemy Turn", ar: "دور الخصم" },
  selectMove: { en: "Select a move", ar: "اختر حركة" },
  switch: { en: "Switch", ar: "تبديل" },
  switchPokemon: { en: "Switch Pokémon", ar: "تبديل البوكيمون" },
  victory: { en: "Victory!", ar: "فوز!" },
  defeat: { en: "Defeat!", ar: "هزيمة!" },
  battleLog: { en: "Battle Log", ar: "سجل المعركة" },
  hp: { en: "HP", ar: "ص.ح" },
  player: { en: "Player", ar: "اللاعب" },
  enemy: { en: "Enemy", ar: "الخصم" },
  format1v1: { en: "1v1", ar: "1 ضد 1" },
  format3v3: { en: "3v3", ar: "3 ضد 3" },
  selectPokemon: { en: "Select Pokémon", ar: "اختر بوكيمون" },
  selectMoves: { en: "Select Moves", ar: "اختر الحركات" },
  team: { en: "Team", ar: "الفريق" },
  moves: { en: "Moves", ar: "الحركات" },
  save: { en: "Save", ar: "حفظ" },
  load: { en: "Load", ar: "تحميل" },
  clear: { en: "Clear", ar: "مسح" },
  offlineDataRequired: {
    en: "Offline data not downloaded. Go to Settings > Download for offline use.",
    ar: "البيانات غير محمّلة للاستخدام دون إنترنت. اذهب للإعدادات > تنزيل للاستخدام دون إنترنت.",
  },
  noMoves: { en: "No moves selected", ar: "لم يتم اختيار حركات" },
  teamSaved: { en: "Team saved!", ar: "تم حفظ الفريق!" },
  teamLoaded: { en: "Team loaded!", ar: "تم تحميل الفريق!" },
  invalidTeam: {
    en: "Please add at least one Pokémon with moves",
    ar: "أضف بوكيمون واحد على الأقل مع حركات",
  },
} as const;
