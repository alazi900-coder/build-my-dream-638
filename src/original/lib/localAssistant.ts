// Local assistant that works without internet
// Provides type effectiveness, team suggestions, and gym tips locally

import { getDB } from "./db";

interface TypeEffectiveness {
  superEffective: string[];
  notVeryEffective: string[];
  noEffect: string[];
  weakTo: string[];
  resistantTo: string[];
  immuneTo: string[];
}

const typeChart: Record<string, TypeEffectiveness> = {
  normal: {
    superEffective: [],
    notVeryEffective: ["rock", "steel"],
    noEffect: ["ghost"],
    weakTo: ["fighting"],
    resistantTo: [],
    immuneTo: ["ghost"],
  },
  fire: {
    superEffective: ["grass", "ice", "bug", "steel"],
    notVeryEffective: ["fire", "water", "rock", "dragon"],
    noEffect: [],
    weakTo: ["water", "ground", "rock"],
    resistantTo: ["fire", "grass", "ice", "bug", "steel", "fairy"],
    immuneTo: [],
  },
  water: {
    superEffective: ["fire", "ground", "rock"],
    notVeryEffective: ["water", "grass", "dragon"],
    noEffect: [],
    weakTo: ["electric", "grass"],
    resistantTo: ["fire", "water", "ice", "steel"],
    immuneTo: [],
  },
  electric: {
    superEffective: ["water", "flying"],
    notVeryEffective: ["electric", "grass", "dragon"],
    noEffect: ["ground"],
    weakTo: ["ground"],
    resistantTo: ["electric", "flying", "steel"],
    immuneTo: [],
  },
  grass: {
    superEffective: ["water", "ground", "rock"],
    notVeryEffective: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
    noEffect: [],
    weakTo: ["fire", "ice", "poison", "flying", "bug"],
    resistantTo: ["water", "electric", "grass", "ground"],
    immuneTo: [],
  },
  ice: {
    superEffective: ["grass", "ground", "flying", "dragon"],
    notVeryEffective: ["fire", "water", "ice", "steel"],
    noEffect: [],
    weakTo: ["fire", "fighting", "rock", "steel"],
    resistantTo: ["ice"],
    immuneTo: [],
  },
  fighting: {
    superEffective: ["normal", "ice", "rock", "dark", "steel"],
    notVeryEffective: ["poison", "flying", "psychic", "bug", "fairy"],
    noEffect: ["ghost"],
    weakTo: ["flying", "psychic", "fairy"],
    resistantTo: ["bug", "rock", "dark"],
    immuneTo: [],
  },
  poison: {
    superEffective: ["grass", "fairy"],
    notVeryEffective: ["poison", "ground", "rock", "ghost"],
    noEffect: ["steel"],
    weakTo: ["ground", "psychic"],
    resistantTo: ["grass", "fighting", "poison", "bug", "fairy"],
    immuneTo: [],
  },
  ground: {
    superEffective: ["fire", "electric", "poison", "rock", "steel"],
    notVeryEffective: ["grass", "bug"],
    noEffect: ["flying"],
    weakTo: ["water", "grass", "ice"],
    resistantTo: ["poison", "rock"],
    immuneTo: ["electric"],
  },
  flying: {
    superEffective: ["grass", "fighting", "bug"],
    notVeryEffective: ["electric", "rock", "steel"],
    noEffect: [],
    weakTo: ["electric", "ice", "rock"],
    resistantTo: ["grass", "fighting", "bug"],
    immuneTo: ["ground"],
  },
  psychic: {
    superEffective: ["fighting", "poison"],
    notVeryEffective: ["psychic", "steel"],
    noEffect: ["dark"],
    weakTo: ["bug", "ghost", "dark"],
    resistantTo: ["fighting", "psychic"],
    immuneTo: [],
  },
  bug: {
    superEffective: ["grass", "psychic", "dark"],
    notVeryEffective: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
    noEffect: [],
    weakTo: ["fire", "flying", "rock"],
    resistantTo: ["grass", "fighting", "ground"],
    immuneTo: [],
  },
  rock: {
    superEffective: ["fire", "ice", "flying", "bug"],
    notVeryEffective: ["fighting", "ground", "steel"],
    noEffect: [],
    weakTo: ["water", "grass", "fighting", "ground", "steel"],
    resistantTo: ["normal", "fire", "poison", "flying"],
    immuneTo: [],
  },
  ghost: {
    superEffective: ["psychic", "ghost"],
    notVeryEffective: ["dark"],
    noEffect: ["normal"],
    weakTo: ["ghost", "dark"],
    resistantTo: ["poison", "bug"],
    immuneTo: ["normal", "fighting"],
  },
  dragon: {
    superEffective: ["dragon"],
    notVeryEffective: ["steel"],
    noEffect: ["fairy"],
    weakTo: ["ice", "dragon", "fairy"],
    resistantTo: ["fire", "water", "electric", "grass"],
    immuneTo: [],
  },
  dark: {
    superEffective: ["psychic", "ghost"],
    notVeryEffective: ["fighting", "dark", "fairy"],
    noEffect: [],
    weakTo: ["fighting", "bug", "fairy"],
    resistantTo: ["ghost", "dark"],
    immuneTo: ["psychic"],
  },
  steel: {
    superEffective: ["ice", "rock", "fairy"],
    notVeryEffective: ["fire", "water", "electric", "steel"],
    noEffect: [],
    weakTo: ["fire", "fighting", "ground"],
    resistantTo: [
      "normal",
      "grass",
      "ice",
      "flying",
      "psychic",
      "bug",
      "rock",
      "dragon",
      "steel",
      "fairy",
    ],
    immuneTo: ["poison"],
  },
  fairy: {
    superEffective: ["fighting", "dragon", "dark"],
    notVeryEffective: ["fire", "poison", "steel"],
    noEffect: [],
    weakTo: ["poison", "steel"],
    resistantTo: ["fighting", "bug", "dark"],
    immuneTo: ["dragon"],
  },
};

const typeNamesAr: Record<string, string> = {
  normal: "عادي",
  fire: "نار",
  water: "ماء",
  electric: "كهرباء",
  grass: "عشب",
  ice: "جليد",
  fighting: "قتال",
  poison: "سم",
  ground: "أرض",
  flying: "طيران",
  psychic: "نفسي",
  bug: "حشرات",
  rock: "صخر",
  ghost: "شبح",
  dragon: "تنين",
  dark: "ظلام",
  steel: "فولاذ",
  fairy: "جن",
};

export function getTypeEffectiveness(type: string): TypeEffectiveness | null {
  return typeChart[type.toLowerCase()] || null;
}

export function getTypeWeaknesses(types: string[]): string[] {
  const weaknesses = new Set<string>();
  const resistances = new Set<string>();
  const immunities = new Set<string>();

  for (const type of types) {
    const effectiveness = typeChart[type.toLowerCase()];
    if (effectiveness) {
      effectiveness.weakTo.forEach((t) => weaknesses.add(t));
      effectiveness.resistantTo.forEach((t) => resistances.add(t));
      effectiveness.immuneTo.forEach((t) => immunities.add(t));
    }
  }

  // Remove resistances and immunities from weaknesses
  resistances.forEach((r) => weaknesses.delete(r));
  immunities.forEach((i) => weaknesses.delete(i));

  return Array.from(weaknesses);
}

export function getTypeStrengths(types: string[]): string[] {
  const strengths = new Set<string>();

  for (const type of types) {
    const effectiveness = typeChart[type.toLowerCase()];
    if (effectiveness) {
      effectiveness.superEffective.forEach((t) => strengths.add(t));
    }
  }

  return Array.from(strengths);
}

export function formatTypeInfo(type: string, language: "ar" | "en"): string {
  const info = typeChart[type.toLowerCase()];
  if (!info) return language === "ar" ? "نوع غير معروف" : "Unknown type";

  const typeName = language === "ar" ? typeNamesAr[type.toLowerCase()] : type;
  const formatTypes = (types: string[]) =>
    types.map((t) => (language === "ar" ? typeNamesAr[t] : t)).join("، ");

  if (language === "ar") {
    return `📊 **معلومات نوع ${typeName}:**

**فعال جداً ضد:** ${info.superEffective.length ? formatTypes(info.superEffective) : "لا شيء"}

**ضعيف ضد:** ${info.weakTo.length ? formatTypes(info.weakTo) : "لا شيء"}

**مقاوم لـ:** ${info.resistantTo.length ? formatTypes(info.resistantTo) : "لا شيء"}

**محصن ضد:** ${info.immuneTo.length ? formatTypes(info.immuneTo) : "لا شيء"}`;
  }

  return `📊 **${type} type info:**

**Super effective against:** ${info.superEffective.length ? formatTypes(info.superEffective) : "None"}

**Weak to:** ${info.weakTo.length ? formatTypes(info.weakTo) : "None"}

**Resistant to:** ${info.resistantTo.length ? formatTypes(info.resistantTo) : "None"}

**Immune to:** ${info.immuneTo.length ? formatTypes(info.immuneTo) : "None"}`;
}

// Get counter suggestions for a type
export function getCounterSuggestions(type: string, language: "ar" | "en"): string {
  const info = typeChart[type.toLowerCase()];
  if (!info) return language === "ar" ? "نوع غير معروف" : "Unknown type";

  const typeName = language === "ar" ? typeNamesAr[type.toLowerCase()] : type;
  const formatTypes = (types: string[]) =>
    types.map((t) => (language === "ar" ? typeNamesAr[t] : t)).join("، ");

  if (language === "ar") {
    return `⚔️ **للتغلب على نوع ${typeName}:**

**استخدم أنواع:** ${info.weakTo.length ? formatTypes(info.weakTo) : "لا يوجد ضعف واضح"}

**تجنب استخدام:** ${info.resistantTo.length ? formatTypes(info.resistantTo) : "لا شيء"}`;
  }

  return `⚔️ **To counter ${type} type:**

**Use types:** ${info.weakTo.length ? formatTypes(info.weakTo) : "No clear weakness"}

**Avoid using:** ${info.resistantTo.length ? formatTypes(info.resistantTo) : "None"}`;
}

// Analyze team coverage locally
export async function analyzeTeamCoverage(
  pokemonIds: number[],
  language: "ar" | "en",
): Promise<string> {
  try {
    const db = await getDB();
    const team: Array<{ name: string; types: string[] }> = [];

    for (const id of pokemonIds) {
      const pokemon = await db.get("pokemon", id);
      if (pokemon) {
        team.push({
          name: language === "ar" ? pokemon.name_ar : pokemon.name_en,
          types: pokemon.types,
        });
      }
    }

    if (team.length === 0) {
      return language === "ar" ? "لم يتم العثور على بوكيمون في الفريق" : "No Pokémon found in team";
    }

    // Calculate coverage
    const allTypes = team.flatMap((p) => p.types.map((t) => t.toLowerCase()));
    const uniqueTypes = [...new Set(allTypes)];
    const coverage = new Set<string>();
    const weaknesses = new Map<string, number>();

    for (const type of uniqueTypes) {
      const info = typeChart[type];
      if (info) {
        info.superEffective.forEach((t) => coverage.add(t));
      }
    }

    for (const pokemon of team) {
      const typeWeaknesses = getTypeWeaknesses(pokemon.types);
      typeWeaknesses.forEach((w) => {
        weaknesses.set(w, (weaknesses.get(w) || 0) + 1);
      });
    }

    const majorWeaknesses = Array.from(weaknesses.entries())
      .filter(([_, count]) => count >= 2)
      .map(([type]) => (language === "ar" ? typeNamesAr[type] : type));

    const formatTypes = (types: string[]) =>
      types.map((t) => (language === "ar" ? typeNamesAr[t] : t)).join("، ");

    if (language === "ar") {
      return `📊 **تحليل الفريق:**

**الأنواع في الفريق:** ${formatTypes(uniqueTypes)}

**التغطية الهجومية:** ${formatTypes(Array.from(coverage))}

${majorWeaknesses.length > 0 ? `⚠️ **نقاط ضعف مشتركة:** ${majorWeaknesses.join("، ")}` : "✅ لا توجد نقاط ضعف مشتركة خطيرة"}

**نصيحة:** ${majorWeaknesses.length > 0 ? `حاول إضافة بوكيمون يقاوم ${majorWeaknesses[0]}` : "فريقك متوازن جيداً!"}`;
    }

    return `📊 **Team Analysis:**

**Types in team:** ${formatTypes(uniqueTypes)}

**Offensive coverage:** ${formatTypes(Array.from(coverage))}

${majorWeaknesses.length > 0 ? `⚠️ **Shared weaknesses:** ${majorWeaknesses.join(", ")}` : "✅ No critical shared weaknesses"}

**Tip:** ${majorWeaknesses.length > 0 ? `Try adding a Pokémon that resists ${majorWeaknesses[0]}` : "Your team is well balanced!"}`;
  } catch (error) {
    return language === "ar" ? "حدث خطأ في التحليل" : "Analysis error occurred";
  }
}

// Process local question without AI
export function processLocalQuestion(question: string, language: "ar" | "en"): string | null {
  const q = question.toLowerCase();

  // Check for type weakness questions
  for (const type of Object.keys(typeChart)) {
    const typeNameAr = typeNamesAr[type];
    if (q.includes(type) || q.includes(typeNameAr)) {
      if (q.includes("weakness") || q.includes("ضعف") || q.includes("weak") || q.includes("ضعيف")) {
        return formatTypeInfo(type, language);
      }
      if (q.includes("counter") || q.includes("تغلب") || q.includes("أهزم") || q.includes("beat")) {
        return getCounterSuggestions(type, language);
      }
    }
  }

  return null;
}
