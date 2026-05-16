/**
 * Status Effects System
 * Implements burn, paralysis, sleep, poison, freeze, confusion
 */

import { BattlePokemon } from "./battleUtils";

export type StatusEffect =
  | "burn"
  | "paralysis"
  | "sleep"
  | "poison"
  | "badly_poisoned"
  | "freeze"
  | "confusion"
  | "flinch";

export interface StatusState {
  effect: StatusEffect;
  turnsRemaining?: number;
  poisonCounter?: number; // For badly poisoned
}

export const STATUS_INFO: Record<
  StatusEffect,
  {
    icon: string;
    name_en: string;
    name_ar: string;
    color: string;
    bgColor: string;
  }
> = {
  burn: {
    icon: "🔥",
    name_en: "Burn",
    name_ar: "حرق",
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
  },
  paralysis: {
    icon: "⚡",
    name_en: "Paralysis",
    name_ar: "شلل",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
  },
  sleep: {
    icon: "💤",
    name_en: "Sleep",
    name_ar: "نوم",
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
  },
  poison: {
    icon: "☠️",
    name_en: "Poison",
    name_ar: "تسمم",
    color: "text-purple-600",
    bgColor: "bg-purple-600/20",
  },
  badly_poisoned: {
    icon: "💀",
    name_en: "Badly Poisoned",
    name_ar: "تسمم شديد",
    color: "text-purple-800",
    bgColor: "bg-purple-800/20",
  },
  freeze: {
    icon: "❄️",
    name_en: "Freeze",
    name_ar: "تجمد",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
  },
  confusion: {
    icon: "😵",
    name_en: "Confusion",
    name_ar: "ارتباك",
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
  },
  flinch: {
    icon: "😰",
    name_en: "Flinch",
    name_ar: "تردد",
    color: "text-gray-500",
    bgColor: "bg-gray-500/20",
  },
};

/**
 * Apply status effect at start of turn
 * Returns: { canMove: boolean, damage: number, message: string }
 */
export function applyStatusEffect(
  pokemon: BattlePokemon & { status?: StatusState },
  language: "en" | "ar",
): { canMove: boolean; damage: number; message: string | null } {
  if (!pokemon.status) {
    return { canMove: true, damage: 0, message: null };
  }

  const status = pokemon.status;
  const name = language === "ar" ? pokemon.name_ar : pokemon.name_en;
  const statusInfo = STATUS_INFO[status.effect];

  switch (status.effect) {
    case "burn":
      // 1/16 max HP damage each turn
      const burnDamage = Math.max(1, Math.floor(pokemon.maxHp / 16));
      return {
        canMove: true,
        damage: burnDamage,
        message:
          language === "ar"
            ? `${name} يعاني من الحرق! (-${burnDamage})`
            : `${name} is hurt by burn! (-${burnDamage})`,
      };

    case "paralysis":
      // 25% chance to not move
      if (Math.random() < 0.25) {
        return {
          canMove: false,
          damage: 0,
          message:
            language === "ar"
              ? `${name} مشلول! لا يستطيع التحرك!`
              : `${name} is paralyzed! It can't move!`,
        };
      }
      return { canMove: true, damage: 0, message: null };

    case "sleep":
      // Can't move while asleep
      if (status.turnsRemaining && status.turnsRemaining > 0) {
        return {
          canMove: false,
          damage: 0,
          message: language === "ar" ? `${name} نائم بعمق...` : `${name} is fast asleep...`,
        };
      }
      // Wake up
      return {
        canMove: true,
        damage: 0,
        message: language === "ar" ? `${name} استيقظ!` : `${name} woke up!`,
      };

    case "poison":
      // 1/8 max HP damage each turn
      const poisonDamage = Math.max(1, Math.floor(pokemon.maxHp / 8));
      return {
        canMove: true,
        damage: poisonDamage,
        message:
          language === "ar"
            ? `${name} يعاني من التسمم! (-${poisonDamage})`
            : `${name} is hurt by poison! (-${poisonDamage})`,
      };

    case "badly_poisoned":
      // Increasing damage each turn (1/16, 2/16, 3/16...)
      const counter = status.poisonCounter || 1;
      const badPoisonDamage = Math.max(1, Math.floor((pokemon.maxHp * counter) / 16));
      return {
        canMove: true,
        damage: badPoisonDamage,
        message:
          language === "ar"
            ? `${name} يعاني من التسمم الشديد! (-${badPoisonDamage})`
            : `${name} is badly poisoned! (-${badPoisonDamage})`,
      };

    case "freeze":
      // 20% chance to thaw each turn
      if (Math.random() < 0.2) {
        return {
          canMove: true,
          damage: 0,
          message: language === "ar" ? `${name} تحرر من الجليد!` : `${name} thawed out!`,
        };
      }
      return {
        canMove: false,
        damage: 0,
        message: language === "ar" ? `${name} متجمد!` : `${name} is frozen solid!`,
      };

    case "confusion":
      // 33% chance to hurt itself
      if (status.turnsRemaining && status.turnsRemaining > 0) {
        if (Math.random() < 0.33) {
          const confusionDamage = Math.max(1, Math.floor(pokemon.maxHp / 10));
          return {
            canMove: false,
            damage: confusionDamage,
            message:
              language === "ar"
                ? `${name} ضرب نفسه في الارتباك! (-${confusionDamage})`
                : `${name} hurt itself in confusion! (-${confusionDamage})`,
          };
        }
      }
      return { canMove: true, damage: 0, message: null };

    case "flinch":
      // Can't move this turn
      return {
        canMove: false,
        damage: 0,
        message: language === "ar" ? `${name} تردد!` : `${name} flinched!`,
      };

    default:
      return { canMove: true, damage: 0, message: null };
  }
}

/**
 * Update status state at end of turn
 */
export function updateStatusState(status: StatusState): StatusState | null {
  switch (status.effect) {
    case "sleep":
      if (status.turnsRemaining !== undefined) {
        const remaining = status.turnsRemaining - 1;
        if (remaining <= 0) return null;
        return { ...status, turnsRemaining: remaining };
      }
      return null;

    case "confusion":
      if (status.turnsRemaining !== undefined) {
        const remaining = status.turnsRemaining - 1;
        if (remaining <= 0) return null;
        return { ...status, turnsRemaining: remaining };
      }
      return null;

    case "flinch":
      return null; // Flinch only lasts one turn

    case "badly_poisoned":
      return {
        ...status,
        poisonCounter: (status.poisonCounter || 1) + 1,
      };

    default:
      return status;
  }
}

/**
 * Create a new status effect
 */
export function createStatus(effect: StatusEffect): StatusState {
  switch (effect) {
    case "sleep":
      return { effect, turnsRemaining: 1 + Math.floor(Math.random() * 3) }; // 1-3 turns
    case "confusion":
      return { effect, turnsRemaining: 1 + Math.floor(Math.random() * 4) }; // 1-4 turns
    case "badly_poisoned":
      return { effect, poisonCounter: 1 };
    case "flinch":
      return { effect, turnsRemaining: 1 };
    default:
      return { effect };
  }
}

/**
 * Check if a move can inflict status
 */
export function getMoveStatusChance(
  moveName: string,
): { effect: StatusEffect; chance: number } | null {
  const moveEffects: Record<string, { effect: StatusEffect; chance: number }> = {
    flamethrower: { effect: "burn", chance: 0.1 },
    fire_blast: { effect: "burn", chance: 0.1 },
    scald: { effect: "burn", chance: 0.3 },
    "will-o-wisp": { effect: "burn", chance: 1.0 },
    thunder: { effect: "paralysis", chance: 0.3 },
    thunderbolt: { effect: "paralysis", chance: 0.1 },
    thunder_wave: { effect: "paralysis", chance: 1.0 },
    body_slam: { effect: "paralysis", chance: 0.3 },
    ice_beam: { effect: "freeze", chance: 0.1 },
    blizzard: { effect: "freeze", chance: 0.1 },
    sludge_bomb: { effect: "poison", chance: 0.3 },
    poison_jab: { effect: "poison", chance: 0.3 },
    toxic: { effect: "badly_poisoned", chance: 1.0 },
    hypnosis: { effect: "sleep", chance: 0.6 },
    sleep_powder: { effect: "sleep", chance: 0.75 },
    confuse_ray: { effect: "confusion", chance: 1.0 },
    fake_out: { effect: "flinch", chance: 1.0 },
    rock_slide: { effect: "flinch", chance: 0.3 },
  };

  const normalized = moveName.toLowerCase().replace(/\s+/g, "_");
  return moveEffects[normalized] || null;
}
