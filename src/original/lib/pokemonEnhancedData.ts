/**
 * Enhanced Pokemon Data - Fun Facts, Training Tips, Best Combinations
 * This module provides additional insights for each Pokemon
 */

// Daily spotlight selection
export function getDailySpotlightPokemonId(): number {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  // Rotate through first 400 Pokemon (Galar dex)
  return (dayOfYear % 400) + 1;
}

// Fun facts database
export const pokemonFunFacts: Record<number, { en: string[]; ar: string[] }> = {
  1: {
    en: [
      "Bulbasaur is the first Pokémon in the National Pokédex",
      "The seed on its back grows by absorbing sunlight",
      "It's one of the original starter Pokémon from 1996",
    ],
    ar: [
      "بولباسور هو أول بوكيمون في البوكيديكس الوطني",
      "البذرة على ظهره تنمو بامتصاص ضوء الشمس",
      "أحد بوكيمون البداية الأصليين منذ 1996",
    ],
  },
  4: {
    en: [
      "The flame on Charmander's tail indicates its health",
      "If the flame goes out, the Pokémon will perish",
      "It prefers hot places and caves",
    ],
    ar: [
      "اللهب على ذيل شارماندر يدل على صحته",
      "إذا انطفأ اللهب، سيهلك البوكيمون",
      "يفضل الأماكن الحارة والكهوف",
    ],
  },
  7: {
    en: [
      "Squirtle's shell hardens right after it's born",
      "It can spray foam from its mouth",
      "When it feels threatened, it retreats into its shell",
    ],
    ar: [
      "صدفة سكويرتل تتصلب بعد ولادته مباشرة",
      "يمكنه رش الرغوة من فمه",
      "عندما يشعر بالتهديد، يختبئ في صدفته",
    ],
  },
  25: {
    en: [
      "Pikachu is the official mascot of Pokémon",
      "Its cheek pouches store electricity",
      "When several Pikachu gather, lightning storms can occur",
    ],
    ar: [
      "بيكاتشو هو الشعار الرسمي لبوكيمون",
      "جيوب خديه تخزن الكهرباء",
      "عندما يتجمع عدة بيكاتشو، يمكن أن تحدث عواصف رعدية",
    ],
  },
};

// Training tips
export const trainingTips: Record<string, { en: string; ar: string }> = {
  physical_attacker: {
    en: "Focus on Attack EVs (252) and Speed EVs (252). Use Adamant or Jolly nature.",
    ar: "ركز على نقاط جهد الهجوم (252) والسرعة (252). استخدم طبيعة Adamant أو Jolly.",
  },
  special_attacker: {
    en: "Focus on Special Attack EVs (252) and Speed EVs (252). Use Modest or Timid nature.",
    ar: "ركز على نقاط جهد الهجوم الخاص (252) والسرعة (252). استخدم طبيعة Modest أو Timid.",
  },
  physical_tank: {
    en: "Focus on HP EVs (252) and Defense EVs (252). Use Impish or Relaxed nature.",
    ar: "ركز على نقاط جهد الصحة (252) والدفاع (252). استخدم طبيعة Impish أو Relaxed.",
  },
  special_tank: {
    en: "Focus on HP EVs (252) and Special Defense EVs (252). Use Calm or Sassy nature.",
    ar: "ركز على نقاط جهد الصحة (252) والدفاع الخاص (252). استخدم طبيعة Calm أو Sassy.",
  },
  balanced: {
    en: "Split EVs between Attack/Sp.Atk, Speed, and HP based on your moveset.",
    ar: "وزع نقاط الجهد بين الهجوم/الهجوم الخاص، السرعة، والصحة حسب حركاتك.",
  },
  support: {
    en: "Focus on HP and both defenses. Consider Bold, Calm, or Careful natures.",
    ar: "ركز على الصحة والدفاعين. فكر في طبيعات Bold أو Calm أو Careful.",
  },
};

// Determine Pokemon role based on stats
export function getPokemonRole(stats: {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}): string {
  const total = stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe;
  const avgOffense = (stats.atk + stats.spa) / 2;
  const avgDefense = (stats.def + stats.spd) / 2;

  if (stats.atk >= 100 && stats.atk > stats.spa) return "physical_attacker";
  if (stats.spa >= 100 && stats.spa > stats.atk) return "special_attacker";
  if (stats.def >= 100 && avgDefense > avgOffense) return "physical_tank";
  if (stats.spd >= 100 && avgDefense > avgOffense) return "special_tank";
  if (stats.hp >= 100 && avgDefense > avgOffense) return "support";
  return "balanced";
}

// Get role label
export function getRoleLabel(role: string, language: string): string {
  const labels: Record<string, { en: string; ar: string }> = {
    physical_attacker: { en: "Physical Attacker", ar: "مهاجم فيزيائي" },
    special_attacker: { en: "Special Attacker", ar: "مهاجم خاص" },
    physical_tank: { en: "Physical Tank", ar: "دبابة فيزيائية" },
    special_tank: { en: "Special Tank", ar: "دبابة خاصة" },
    support: { en: "Support/Wall", ar: "دعم/جدار" },
    balanced: { en: "Balanced", ar: "متوازن" },
  };
  return language === "ar" ? labels[role]?.ar || role : labels[role]?.en || role;
}

// Best item combinations
export const bestHeldItems: Record<string, { item: string; reason: { en: string; ar: string } }[]> =
  {
    physical_attacker: [
      { item: "choice-band", reason: { en: "Boosts Attack by 50%", ar: "يزيد الهجوم بـ 50%" } },
      { item: "life-orb", reason: { en: "Boosts all moves by 30%", ar: "يزيد كل الحركات بـ 30%" } },
      {
        item: "choice-scarf",
        reason: { en: "Speed boost for revenge killing", ar: "زيادة سرعة للانتقام" },
      },
    ],
    special_attacker: [
      {
        item: "choice-specs",
        reason: { en: "Boosts Sp.Atk by 50%", ar: "يزيد الهجوم الخاص بـ 50%" },
      },
      { item: "life-orb", reason: { en: "Boosts all moves by 30%", ar: "يزيد كل الحركات بـ 30%" } },
      {
        item: "choice-scarf",
        reason: { en: "Speed boost for fast sweeping", ar: "زيادة سرعة للكاسح السريع" },
      },
    ],
    physical_tank: [
      { item: "leftovers", reason: { en: "Passive HP recovery", ar: "استعادة صحة سلبية" } },
      {
        item: "rocky-helmet",
        reason: { en: "Damages physical attackers", ar: "يضر المهاجمين الفيزيائيين" },
      },
    ],
    special_tank: [
      { item: "leftovers", reason: { en: "Passive HP recovery", ar: "استعادة صحة سلبية" } },
      {
        item: "assault-vest",
        reason: { en: "+50% Sp.Def for attackers", ar: "+50% دفاع خاص للمهاجمين" },
      },
    ],
    support: [
      { item: "leftovers", reason: { en: "Stay alive longer", ar: "البقاء حياً أطول" } },
      { item: "focus-sash", reason: { en: "Survive one fatal hit", ar: "النجاة من ضربة قاتلة" } },
    ],
    balanced: [
      { item: "life-orb", reason: { en: "General power boost", ar: "زيادة قوة عامة" } },
      { item: "leftovers", reason: { en: "Sustain in battle", ar: "الاستمرار في المعركة" } },
    ],
  };

// Get generic fun fact based on type
export function getGenericFunFact(types: string[], id: number, language: string): string {
  const facts: Record<string, { en: string; ar: string }> = {
    fire: { en: "Fire-type Pokémon are immune to burns", ar: "بوكيمونات النار محصنة ضد الحروق" },
    water: {
      en: "Water-type moves are super effective against Fire, Ground, and Rock",
      ar: "حركات الماء فعالة جداً ضد النار والأرض والصخر",
    },
    grass: {
      en: "Grass-type Pokémon are immune to powder and spore moves",
      ar: "بوكيمونات العشب محصنة ضد حركات المسحوق والأبواغ",
    },
    electric: {
      en: "Electric-type Pokémon cannot be paralyzed",
      ar: "بوكيمونات الكهرباء لا يمكن شلها",
    },
    ice: { en: "Ice-type Pokémon are immune to freezing", ar: "بوكيمونات الجليد محصنة ضد التجمد" },
    poison: { en: "Poison-type Pokémon cannot be poisoned", ar: "بوكيمونات السم لا يمكن تسميمها" },
    ground: {
      en: "Ground-type Pokémon are immune to Electric moves",
      ar: "بوكيمونات الأرض محصنة ضد حركات الكهرباء",
    },
    flying: {
      en: "Flying-type Pokémon are immune to Ground moves",
      ar: "بوكيمونات الطيران محصنة ضد حركات الأرض",
    },
    ghost: {
      en: "Ghost-type Pokémon are immune to Normal and Fighting moves",
      ar: "بوكيمونات الشبح محصنة ضد حركات العادي والقتال",
    },
    steel: { en: "Steel-type Pokémon are immune to Poison", ar: "بوكيمونات الفولاذ محصنة ضد السم" },
    dragon: {
      en: "Dragon-type moves are super effective against other Dragons",
      ar: "حركات التنين فعالة جداً ضد التنانين الأخرى",
    },
    dark: {
      en: "Dark-type Pokémon are immune to Prankster priority moves",
      ar: "بوكيمونات الظلام محصنة ضد حركات الأولوية من Prankster",
    },
    fairy: {
      en: "Fairy-type Pokémon are immune to Dragon moves",
      ar: "بوكيمونات الجنيات محصنة ضد حركات التنين",
    },
    psychic: {
      en: "Psychic-type moves don't affect Dark-type Pokémon",
      ar: "حركات النفسي لا تؤثر على بوكيمونات الظلام",
    },
    normal: {
      en: "Normal-type Pokémon are immune to Ghost moves",
      ar: "بوكيمونات العادي محصنة ضد حركات الشبح",
    },
    fighting: {
      en: "Fighting-type moves are super effective against 5 types",
      ar: "حركات القتال فعالة جداً ضد 5 أنواع",
    },
    rock: {
      en: "Rock-type Pokémon have boosted Sp.Def in Sandstorm",
      ar: "بوكيمونات الصخر لديها دفاع خاص معزز في العاصفة الرملية",
    },
    bug: { en: "Bug-type Pokémon evolve quickly", ar: "بوكيمونات الحشرات تتطور بسرعة" },
  };

  const primaryType = types[0]?.toLowerCase() || "normal";
  const fact = facts[primaryType];
  return language === "ar"
    ? fact?.ar || "حقيقة ممتعة قيد الإضافة"
    : fact?.en || "Fun fact coming soon";
}

// Favorites and view tracking storage
export function saveFavorites(favorites: number[]): void {
  localStorage.setItem("pokemonApp_favorites", JSON.stringify(favorites));
}

export function loadFavorites(): number[] {
  try {
    const stored = localStorage.getItem("pokemonApp_favorites");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveViewedPokemon(id: number): void {
  try {
    const viewed = loadViewedPokemon();
    if (!viewed.includes(id)) {
      viewed.push(id);
      localStorage.setItem("pokemonApp_viewedPokemon", JSON.stringify(viewed));
    }
  } catch {
    // Ignore errors
  }
}

export function loadViewedPokemon(): number[] {
  try {
    const stored = localStorage.getItem("pokemonApp_viewedPokemon");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
