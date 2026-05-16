/**
 * Item utilities for enhanced item detail page
 */

export type ItemCategory =
  | "healing"
  | "medicine"
  | "revival"
  | "status-cures"
  | "pp-recovery"
  | "evolution"
  | "standard-balls"
  | "special-balls"
  | "apricorn-balls"
  | "berries"
  | "held-items"
  | "type-enhancement"
  | "species-specific"
  | "stat-boosts"
  | "all-machines"
  | "vitamins"
  | "plot-advancement";

export const CATEGORY_GROUPS = {
  balls: ["standard-balls", "special-balls", "apricorn-balls"],
  healing: ["healing", "medicine", "revival", "status-cures", "pp-recovery"],
  held: ["held-items", "type-enhancement", "species-specific"],
  consumable: ["berries", "stat-boosts", "vitamins"],
  evolution: ["evolution"],
  key: ["plot-advancement"],
  machines: ["all-machines"],
};

/**
 * Generate a TL;DR summary from item effect
 */
export function generateTLDR(
  effect: string | null | undefined,
  category: string,
  language: "en" | "ar",
): string {
  if (!effect) {
    return language === "ar" ? "لا يوجد ملخص متاح" : "No summary available";
  }

  // Extract first sentence or short summary
  const firstSentence = effect.split(/[.!?]/)[0].trim();

  if (firstSentence.length <= 60) {
    return firstSentence + ".";
  }

  // Truncate to ~60 chars at word boundary
  const words = firstSentence.split(" ");
  let summary = "";
  for (const word of words) {
    if ((summary + " " + word).trim().length > 55) break;
    summary = (summary + " " + word).trim();
  }

  return summary + "...";
}

/**
 * Get usage context labels for item
 */
export function getUsageLabels(
  category: string,
  language: "en" | "ar",
): { context: string; trigger?: string } {
  const isBall = CATEGORY_GROUPS.balls.includes(category);
  const isHealing = CATEGORY_GROUPS.healing.includes(category);
  const isHeld = CATEGORY_GROUPS.held.includes(category);
  const isBerry = category === "berries";

  if (isBall) {
    return {
      context: language === "ar" ? "في المعركة" : "In Battle",
      trigger: language === "ar" ? "عند رمي الكرة" : "When thrown",
    };
  }

  if (isHealing) {
    return {
      context: language === "ar" ? "خارج/في المعركة" : "In/Out of Battle",
      trigger: language === "ar" ? "عند الاستخدام" : "On use",
    };
  }

  if (isHeld) {
    return {
      context: language === "ar" ? "محمول" : "Held Item",
      trigger: language === "ar" ? "تأثير مستمر" : "Passive effect",
    };
  }

  if (isBerry) {
    return {
      context: language === "ar" ? "محمول" : "Held Item",
      trigger: language === "ar" ? "عند انخفاض الصحة/الحالة" : "When HP/status triggers",
    };
  }

  if (category === "evolution") {
    return {
      context: language === "ar" ? "مستهلك" : "Consumable",
      trigger: language === "ar" ? "عند الاستخدام على البوكيمون" : "When used on Pokémon",
    };
  }

  if (category === "all-machines") {
    return {
      context: language === "ar" ? "تعليم حركة" : "Move Teaching",
      trigger: language === "ar" ? "يُعلّم حركة دائمة" : "Teaches a move permanently",
    };
  }

  return {
    context: language === "ar" ? "عنصر" : "Item",
  };
}

/**
 * Get usage tips based on category
 */
export function getUsageTips(category: string, language: "en" | "ar"): string[] {
  const tips: Record<string, { en: string[]; ar: string[] }> = {
    "standard-balls": {
      en: [
        "Best used when target HP is low (red zone)",
        "Status conditions increase catch rate",
        "Save Master Balls for legendaries",
      ],
      ar: [
        "أفضل استخدام عندما تكون صحة الهدف منخفضة",
        "حالات الضعف تزيد من معدل الإمساك",
        "احفظ الكرات الخاصة للأسطوريين",
      ],
    },
    "special-balls": {
      en: [
        "Each ball has special conditions for better catch rate",
        "Quick Ball: Best on first turn",
        "Dusk Ball: Better in caves/night",
      ],
      ar: [
        "كل كرة لها شروط خاصة لمعدل إمساك أفضل",
        "الكرة السريعة: الأفضل في الدور الأول",
        "كرة الغسق: أفضل في الكهوف/الليل",
      ],
    },
    healing: {
      en: [
        "Use during battle to restore HP",
        "More effective potions for late-game",
        "Can also be used from bag outside battle",
      ],
      ar: [
        "استخدمها في المعركة لاستعادة الصحة",
        "الجرعات الأقوى للمراحل المتقدمة",
        "يمكن استخدامها من الحقيبة خارج المعركة",
      ],
    },
    berries: {
      en: [
        "Give to Pokémon to hold for auto-activation",
        "Triggers when HP drops below threshold",
        "Can also be used manually from bag",
      ],
      ar: [
        "أعطها للبوكيمون ليحملها للتفعيل التلقائي",
        "تتفعل عندما تنخفض الصحة تحت الحد",
        "يمكن استخدامها يدوياً من الحقيبة",
      ],
    },
    "held-items": {
      en: [
        "Equip to Pokémon for passive benefits",
        "Only one held item per Pokémon",
        "Some items boost specific types or stats",
      ],
      ar: [
        "جهّز للبوكيمون للحصول على فوائد سلبية",
        "أداة واحدة محمولة لكل بوكيمون",
        "بعض الأدوات تعزز أنواع أو إحصائيات معينة",
      ],
    },
    evolution: {
      en: [
        "Use on compatible Pokémon to trigger evolution",
        "Check which Pokémon can use this stone",
        "Evolution is permanent and immediate",
      ],
      ar: [
        "استخدمها على البوكيمون المتوافق لتفعيل التطور",
        "تحقق من أي بوكيمون يمكنه استخدام هذا الحجر",
        "التطور دائم وفوري",
      ],
    },
  };

  // Find matching category or use generic
  for (const [key, value] of Object.entries(tips)) {
    if (category.includes(key) || key.includes(category)) {
      return value[language];
    }
  }

  return language === "ar" ? ["استخدم هذه الأداة حسب الحاجة"] : ["Use this item as needed"];
}

/**
 * Get how it works steps for preview modal
 */
export function getHowItWorksSteps(category: string, language: "en" | "ar"): string[] {
  const steps: Record<string, { en: string[]; ar: string[] }> = {
    "standard-balls": {
      en: [
        "Encounter a wild Pokémon in battle",
        "Weaken it by lowering HP or inflicting status",
        "Throw the ball and wait for capture!",
      ],
      ar: [
        "قابل بوكيمون بري في المعركة",
        "أضعفه بتقليل صحته أو إصابته بحالة",
        "ارمِ الكرة وانتظر الإمساك!",
      ],
    },
    "special-balls": {
      en: [
        "Choose the right ball for the situation",
        "Special conditions boost catch rate",
        "Throw and hope for a successful capture!",
      ],
      ar: [
        "اختر الكرة المناسبة للموقف",
        "الشروط الخاصة تزيد معدل الإمساك",
        "ارمِ وأتمنى إمساكاً ناجحاً!",
      ],
    },
    healing: {
      en: [
        "Open bag during battle or from menu",
        "Select the healing item",
        "Choose which Pokémon to heal",
      ],
      ar: [
        "افتح الحقيبة أثناء المعركة أو من القائمة",
        "اختر أداة العلاج",
        "اختر البوكيمون المراد علاجه",
      ],
    },
    berries: {
      en: [
        "Give the berry to a Pokémon to hold",
        "The berry activates automatically when conditions are met",
        "Effect applies instantly in battle",
      ],
      ar: [
        "أعطِ التوت للبوكيمون ليحمله",
        "يتفعل التوت تلقائياً عند تحقق الشروط",
        "يُطبق التأثير فوراً في المعركة",
      ],
    },
    evolution: {
      en: [
        "Open bag and select the evolution item",
        "Use it on a compatible Pokémon",
        "Watch your Pokémon evolve!",
      ],
      ar: ["افتح الحقيبة واختر أداة التطور", "استخدمها على بوكيمون متوافق", "شاهد بوكيمونك يتطور!"],
    },
  };

  for (const [key, value] of Object.entries(steps)) {
    if (category.includes(key) || key.includes(category)) {
      return value[language];
    }
  }

  return language === "ar"
    ? ["اختر الأداة", "استخدمها على الهدف", "استمتع بالتأثير"]
    : ["Select the item", "Use on target", "Enjoy the effect"];
}

/**
 * Get gradient colors for hero header based on category
 */
export function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    healing: "from-pink-500/30 via-pink-400/20 to-transparent",
    medicine: "from-pink-500/30 via-pink-400/20 to-transparent",
    revival: "from-yellow-500/30 via-yellow-400/20 to-transparent",
    "status-cures": "from-green-500/30 via-green-400/20 to-transparent",
    "pp-recovery": "from-purple-500/30 via-purple-400/20 to-transparent",
    evolution: "from-violet-500/30 via-violet-400/20 to-transparent",
    "standard-balls": "from-red-500/30 via-red-400/20 to-transparent",
    "special-balls": "from-orange-500/30 via-orange-400/20 to-transparent",
    "apricorn-balls": "from-amber-500/30 via-amber-400/20 to-transparent",
    berries: "from-emerald-500/30 via-emerald-400/20 to-transparent",
    "held-items": "from-blue-500/30 via-blue-400/20 to-transparent",
    "type-enhancement": "from-cyan-500/30 via-cyan-400/20 to-transparent",
    "species-specific": "from-amber-500/30 via-amber-400/20 to-transparent",
    "stat-boosts": "from-indigo-500/30 via-indigo-400/20 to-transparent",
    "all-machines": "from-gray-500/30 via-gray-400/20 to-transparent",
    vitamins: "from-lime-500/30 via-lime-400/20 to-transparent",
    "plot-advancement": "from-rose-500/30 via-rose-400/20 to-transparent",
  };
  return gradients[category] || "from-primary/30 via-primary/20 to-transparent";
}

/**
 * Get item sprite URL
 */
export function getItemSpriteUrl(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-");
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${normalized}.png`;
}

/**
 * Get generic obtain info based on category (fallback when no specific data)
 */
export function getGenericObtainInfo(
  category: string,
  language: "en" | "ar",
): { methods: { icon: string; title: string; description: string }[]; note: string } {
  const isBall = CATEGORY_GROUPS.balls.includes(category);
  const isHealing = CATEGORY_GROUPS.healing.includes(category);
  const isBerry = category === "berries";
  const isEvolution = category === "evolution";
  const isHeld = CATEGORY_GROUPS.held.includes(category);
  const isMachine = category === "all-machines";

  if (isBall) {
    return {
      methods: [
        {
          icon: "🏪",
          title: language === "ar" ? "المتاجر" : "Shops",
          description:
            language === "ar"
              ? "تُباع في متاجر بوكي مارت بعد التقدم في اللعبة"
              : "Sold in Poké Marts after game progression",
        },
        {
          icon: "💰",
          title: language === "ar" ? "السعر" : "Price",
          description:
            language === "ar"
              ? "عادة 200-1500 بوكي دولار حسب النوع"
              : "Usually ₽200-1500 depending on type",
        },
        {
          icon: "🎁",
          title: language === "ar" ? "أماكن أخرى" : "Other Sources",
          description:
            language === "ar" ? "كمكافآت أو ملقاة على الأرض" : "As rewards or found on ground",
        },
      ],
      note:
        language === "ar"
          ? "الكرات الخاصة قد تتطلب شروطاً معينة للحصول عليها"
          : "Special balls may require specific conditions to obtain",
    };
  }

  if (isHealing) {
    return {
      methods: [
        {
          icon: "🏪",
          title: language === "ar" ? "المتاجر" : "Shops",
          description:
            language === "ar" ? "متوفرة في جميع متاجر بوكي مارت" : "Available in all Poké Marts",
        },
        {
          icon: "🗺️",
          title: language === "ar" ? "الاستكشاف" : "Exploration",
          description:
            language === "ar"
              ? "توجد في الكهوف والطرق والمباني"
              : "Found in caves, routes, and buildings",
        },
      ],
      note:
        language === "ar"
          ? "الجرعات القوية تتوفر لاحقاً في اللعبة"
          : "Stronger potions become available later in game",
    };
  }

  if (isBerry) {
    return {
      methods: [
        {
          icon: "🌳",
          title: language === "ar" ? "الأشجار" : "Berry Trees",
          description:
            language === "ar"
              ? "تنمو على أشجار التوت في المناطق البرية"
              : "Grow on berry trees in wild areas",
        },
        {
          icon: "🌱",
          title: language === "ar" ? "الزراعة" : "Farming",
          description: language === "ar" ? "يمكن زراعتها وحصادها" : "Can be planted and harvested",
        },
      ],
      note:
        language === "ar"
          ? "بعض التوت نادر ويتطلب البحث"
          : "Some berries are rare and require searching",
    };
  }

  if (isEvolution) {
    return {
      methods: [
        {
          icon: "⛏️",
          title: language === "ar" ? "التنقيب" : "Mining",
          description:
            language === "ar"
              ? "يمكن العثور عليها في مناطق التنقيب"
              : "Can be found in mining areas",
        },
        {
          icon: "🎁",
          title: language === "ar" ? "المكافآت" : "Rewards",
          description:
            language === "ar" ? "كمكافأة لإكمال مهام معينة" : "As rewards for completing tasks",
        },
        {
          icon: "🏪",
          title: language === "ar" ? "المتاجر الخاصة" : "Special Shops",
          description:
            language === "ar" ? "بعضها يُباع في متاجر خاصة" : "Some sold in special shops",
        },
      ],
      note:
        language === "ar"
          ? "أحجار التطور نادرة - استخدمها بحكمة"
          : "Evolution stones are rare - use wisely",
    };
  }

  if (isHeld) {
    return {
      methods: [
        {
          icon: "🎯",
          title: language === "ar" ? "البوكيمون البري" : "Wild Pokémon",
          description:
            language === "ar"
              ? "بعض البوكيمون البري يحمل هذه الأداة"
              : "Some wild Pokémon hold this item",
        },
        {
          icon: "🏆",
          title: language === "ar" ? "المكافآت" : "Rewards",
          description: language === "ar" ? "كمكافأة للفوز في المعارك" : "As battle victory rewards",
        },
      ],
      note:
        language === "ar"
          ? "استخدم قدرة Frisk لاكتشاف الأدوات المحمولة"
          : "Use Frisk ability to detect held items",
    };
  }

  if (isMachine) {
    return {
      methods: [
        {
          icon: "🏆",
          title: language === "ar" ? "قادة الجيم" : "Gym Leaders",
          description:
            language === "ar"
              ? "تُمنح كمكافأة للفوز على قادة الجيم"
              : "Given as rewards for defeating Gym Leaders",
        },
        {
          icon: "🗺️",
          title: language === "ar" ? "الاستكشاف" : "Exploration",
          description: language === "ar" ? "مخفية في أماكن مختلفة" : "Hidden in various locations",
        },
      ],
      note:
        language === "ar"
          ? "TMs قابلة لإعادة الاستخدام في الألعاب الحديثة"
          : "TMs are reusable in modern games",
    };
  }

  // Generic fallback
  return {
    methods: [
      {
        icon: "🗺️",
        title: language === "ar" ? "الاستكشاف" : "Exploration",
        description: language === "ar" ? "ابحث في المناطق المختلفة" : "Search in various areas",
      },
      {
        icon: "🏪",
        title: language === "ar" ? "المتاجر" : "Shops",
        description:
          language === "ar" ? "قد تتوفر في بعض المتاجر" : "May be available in some shops",
      },
    ],
    note:
      language === "ar"
        ? "تحقق من دليل اللعبة للمزيد من التفاصيل"
        : "Check the game guide for more details",
  };
}

/**
 * Get game display info with icons and full names
 */
export interface GameDisplayInfo {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  color: string;
}

export function getGameDisplayInfo(gameId: string): GameDisplayInfo {
  const games: Record<string, GameDisplayInfo> = {
    swsh: {
      id: "swsh",
      name_en: "Sword & Shield",
      name_ar: "سورد وشيلد",
      icon: "🗡️",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    sv: {
      id: "sv",
      name_en: "Scarlet & Violet",
      name_ar: "سكارليت وفايوليت",
      icon: "💜",
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    arceus: {
      id: "arceus",
      name_en: "Legends: Arceus",
      name_ar: "أساطير: آرسيوس",
      icon: "⭐",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    lgpe: {
      id: "lgpe",
      name_en: "Let's Go Pikachu/Eevee",
      name_ar: "ليتس غو بيكاتشو/إيفي",
      icon: "💛",
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    bdsp: {
      id: "bdsp",
      name_en: "Brilliant Diamond & Shining Pearl",
      name_ar: "الألماس اللامع واللؤلؤ المتلألئ",
      icon: "💎",
      color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    },
  };

  return (
    games[gameId.toLowerCase()] || {
      id: gameId,
      name_en: gameId.toUpperCase(),
      name_ar: gameId.toUpperCase(),
      icon: "🎮",
      color: "bg-muted text-muted-foreground border-border",
    }
  );
}

/**
 * Get Bulbapedia URL for item
 */
export function getBulbapediaUrl(itemNameEn: string): string {
  const normalized = itemNameEn
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("_");
  return `https://bulbapedia.bulbagarden.net/wiki/${normalized}`;
}

// ============ FAVORITES ============
const ITEM_FAVORITES_KEY = "favoriteItems";
const ITEM_NOTES_KEY = "itemNotes";
const ITEM_VIEWED_KEY = "viewedItems";

export function getFavoriteItems(): number[] {
  try {
    const stored = localStorage.getItem(ITEM_FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteItem(itemId: number): boolean {
  const favorites = getFavoriteItems();
  const index = favorites.indexOf(itemId);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(itemId);
  }

  localStorage.setItem(ITEM_FAVORITES_KEY, JSON.stringify(favorites));
  return index === -1; // Returns true if now favorited
}

export function isItemFavorite(itemId: number): boolean {
  return getFavoriteItems().includes(itemId);
}

// ============ NOTES ============
export function getItemNotes(): Record<number, string> {
  try {
    const stored = localStorage.getItem(ITEM_NOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getItemNote(itemId: number): string {
  return getItemNotes()[itemId] || "";
}

export function saveItemNote(itemId: number, note: string): void {
  const notes = getItemNotes();
  if (note.trim()) {
    notes[itemId] = note;
  } else {
    delete notes[itemId];
  }
  localStorage.setItem(ITEM_NOTES_KEY, JSON.stringify(notes));
}

export function hasItemNote(itemId: number): boolean {
  return !!getItemNotes()[itemId];
}

// ============ VIEWED/DISCOVERED ============
export function getViewedItems(): number[] {
  try {
    const stored = localStorage.getItem(ITEM_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function markItemViewed(itemId: number): void {
  const viewed = getViewedItems();
  if (!viewed.includes(itemId)) {
    viewed.push(itemId);
    localStorage.setItem(ITEM_VIEWED_KEY, JSON.stringify(viewed));
  }
}

export function isItemViewed(itemId: number): boolean {
  return getViewedItems().includes(itemId);
}

export function getItemViewedCount(): number {
  return getViewedItems().length;
}

// ============ STATS ============
export interface ItemExplorationStats {
  totalViewed: number;
  totalFavorites: number;
  totalNotes: number;
}

export function getItemExplorationStats(): ItemExplorationStats {
  return {
    totalViewed: getViewedItems().length,
    totalFavorites: getFavoriteItems().length,
    totalNotes: Object.keys(getItemNotes()).length,
  };
}
