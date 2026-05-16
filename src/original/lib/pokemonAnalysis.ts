/**
 * Pokemon Analysis Utility
 * Provides functions to analyze Pokemon stats and determine roles, difficulty, strengths
 */

import { Stats } from "@/original/types/pokemon";

export interface PokemonRole {
  id: string;
  en: string;
  ar: string;
  icon: string;
}

export interface DifficultyLevel {
  id: string;
  en: string;
  ar: string;
  color: string;
}

export interface StatLabel {
  en: string;
  ar: string;
  color: string;
}

// Determine Pokemon's combat role based on stats
export function determineRole(stats: Stats): PokemonRole {
  const { hp, atk, def, spa, spd, spe } = stats;

  // Physical Attacker: High ATK
  if (atk >= spa && atk >= 100) {
    return { id: "physical", en: "Physical Attacker", ar: "مهاجم فيزيائي", icon: "⚔️" };
  }

  // Special Attacker: High SPA
  if (spa >= atk && spa >= 100) {
    return { id: "special", en: "Special Attacker", ar: "مهاجم خاص", icon: "✨" };
  }

  // Defensive: High DEF + SPD
  if (def + spd >= 160) {
    return { id: "defensive", en: "Defensive", ar: "دفاعي", icon: "🛡️" };
  }

  // Speedy: High SPE
  if (spe >= 100) {
    return { id: "speedy", en: "Speedy", ar: "سريع", icon: "⚡" };
  }

  // Tank: High HP
  if (hp >= 100) {
    return { id: "tank", en: "Tank", ar: "متحمل", icon: "💪" };
  }

  // Balanced
  return { id: "balanced", en: "Balanced", ar: "متوازن", icon: "⚖️" };
}

// Determine difficulty level for beginners
export function getDifficulty(isStarter?: boolean, isLegendary?: boolean): DifficultyLevel {
  if (isStarter) {
    return {
      id: "beginner",
      en: "Beginner-friendly",
      ar: "مناسب للمبتدئين",
      color: "text-green-400",
    };
  }
  if (isLegendary) {
    return { id: "advanced", en: "Advanced", ar: "متقدم", color: "text-red-400" };
  }
  return { id: "intermediate", en: "Intermediate", ar: "متوسط", color: "text-amber-400" };
}

// Get stat interpretation label
export function getStatLabel(value: number): StatLabel {
  if (value >= 150) {
    return { en: "Excellent", ar: "ممتاز", color: "text-purple-400" };
  }
  if (value >= 100) {
    return { en: "High", ar: "عالي", color: "text-green-400" };
  }
  if (value >= 70) {
    return { en: "Average", ar: "متوسط", color: "text-amber-400" };
  }
  if (value >= 50) {
    return { en: "Low", ar: "منخفض", color: "text-orange-400" };
  }
  return { en: "Poor", ar: "ضعيف", color: "text-red-400" };
}

// Get strengths based on stats and types
export function getStrengths(stats: Stats, types: string[], language: "en" | "ar"): string[] {
  const strengths: string[] = [];

  // Check for high stats
  if (stats.spe >= 100) {
    strengths.push(language === "ar" ? "السرعة" : "Speed");
  }
  if (stats.atk >= 100) {
    strengths.push(language === "ar" ? "الهجوم" : "Attack");
  }
  if (stats.spa >= 100) {
    strengths.push(language === "ar" ? "الهجوم الخاص" : "Sp. Attack");
  }
  if (stats.def >= 100) {
    strengths.push(language === "ar" ? "الدفاع" : "Defense");
  }
  if (stats.hp >= 100) {
    strengths.push(language === "ar" ? "الصحة" : "HP");
  }

  return strengths.slice(0, 3); // Max 3 strengths
}

// Get stat insights for contextual tips
export function getStatInsights(stats: Stats, language: "en" | "ar"): string[] {
  const insights: string[] = [];

  if (stats.spe >= 100) {
    insights.push(
      language === "ar"
        ? "⚡ سرعة عالية - عادة يتحرك أولاً في المعركة"
        : "⚡ High Speed - Usually moves first in battle",
    );
  }

  if (stats.atk > stats.spa && stats.atk >= 80) {
    insights.push(
      language === "ar"
        ? "💪 هجوم فيزيائي أعلى - استخدم حركات Physical"
        : "💪 Higher Physical Attack - Use Physical moves",
    );
  } else if (stats.spa > stats.atk && stats.spa >= 80) {
    insights.push(
      language === "ar"
        ? "✨ هجوم خاص أعلى - استخدم حركات Special"
        : "✨ Higher Special Attack - Use Special moves",
    );
  }

  if (stats.def >= 100 || stats.spd >= 100) {
    insights.push(
      language === "ar"
        ? "🛡️ دفاع قوي - يمكنه تحمل ضربات عديدة"
        : "🛡️ Strong defenses - Can take multiple hits",
    );
  }

  if (stats.hp >= 100) {
    insights.push(
      language === "ar"
        ? "❤️ صحة عالية - يبقى في المعركة لفترة أطول"
        : "❤️ High HP - Stays in battle longer",
    );
  }

  return insights.slice(0, 2); // Max 2 insights
}

// Calculate total base stats
export function getTotalStats(stats: Stats): number {
  return Object.values(stats).reduce((sum, val) => sum + val, 0);
}

// Get attacker profile type
export function getAttackerProfile(stats: Stats): "physical" | "special" | "mixed" {
  const diff = Math.abs(stats.atk - stats.spa);
  if (diff <= 20) return "mixed";
  return stats.atk > stats.spa ? "physical" : "special";
}

// Generate a TL;DR one-sentence summary for a Pokemon
export function getPokemonSummary(
  stats: Stats,
  types: string[],
  weaknessCount: number,
  language: "en" | "ar",
  isStarter?: boolean,
  isLegendary?: boolean,
): string {
  const role = determineRole(stats);
  const total = getTotalStats(stats);
  const profile = getAttackerProfile(stats);

  // Build summary based on role and characteristics
  if (language === "ar") {
    const typeText = types.length > 1 ? "مزدوج النوع" : "أحادي النوع";

    if (isLegendary) {
      return `بوكيمون ${role.ar} أسطوري ${typeText} بإجمالي قوة ${total}. قوي جداً لكن نادر الحصول عليه.`;
    }

    if (isStarter) {
      return `بوكيمون بداية ${role.ar} ${typeText}. مثالي للمبتدئين مع توازن جيد في القدرات.`;
    }

    if (weaknessCount >= 5) {
      return `${role.ar} ${typeText} بإجمالي ${total}. احذر: لديه ${weaknessCount} نقاط ضعف - يحتاج دعم دفاعي.`;
    }

    if (profile === "physical") {
      return `${role.ar} ${typeText} يتفوق في الهجمات الفيزيائية. استخدم حركات Physical للأفضلية.`;
    }

    if (profile === "special") {
      return `${role.ar} ${typeText} يتفوق في الهجمات الخاصة. استخدم حركات Special للأفضلية.`;
    }

    return `${role.ar} ${typeText} متوازن بإجمالي قوة ${total}. مرن في أساليب القتال.`;
  }

  // English
  const typeText = types.length > 1 ? "dual-type" : "single-type";

  if (isLegendary) {
    return `A legendary ${role.en.toLowerCase()} ${typeText} Pokémon with ${total} total stats. Very powerful but rare to obtain.`;
  }

  if (isStarter) {
    return `A ${role.en.toLowerCase()} starter ${typeText} Pokémon. Perfect for beginners with well-balanced abilities.`;
  }

  if (weaknessCount >= 5) {
    return `A ${role.en.toLowerCase()} ${typeText} with ${total} total stats. Caution: ${weaknessCount} weaknesses - needs defensive support.`;
  }

  if (profile === "physical") {
    return `A ${role.en.toLowerCase()} ${typeText} that excels at physical attacks. Use Physical moves for best results.`;
  }

  if (profile === "special") {
    return `A ${role.en.toLowerCase()} ${typeText} that excels at special attacks. Use Special moves for best results.`;
  }

  return `A balanced ${role.en.toLowerCase()} ${typeText} with ${total} total stats. Flexible in combat styles.`;
}
