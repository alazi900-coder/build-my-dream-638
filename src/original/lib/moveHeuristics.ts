import { Move } from "@/original/types/pokemon";

// Check if move has side effects (recoil, self-damage, etc.)
export const hasSideEffects = (move: Move): boolean => {
  const effect = (move.effect_en || "").toLowerCase();
  const sideEffectKeywords = [
    "recoil",
    "user takes",
    "hurts itself",
    "user faints",
    "lowers its own",
    "user loses",
    "decreases the user",
    "damage to the user",
    "sacrifices",
  ];
  return sideEffectKeywords.some((keyword) => effect.includes(keyword));
};

// Check if move is cumulative (power increases)
export const isCumulative = (move: Move): boolean => {
  const effect = (move.effect_en || "").toLowerCase();
  const cumulativeKeywords = [
    "increases each time",
    "consecutive",
    "doubles each",
    "power increases",
    "more powerful each",
    "fury",
  ];
  return cumulativeKeywords.some((keyword) => effect.includes(keyword));
};

// Check if move is a priority move
export const isPriorityMove = (move: Move): boolean => {
  const effect = (move.effect_en || "").toLowerCase();
  return effect.includes("priority") || effect.includes("always goes first");
};

// Generate usefulness badges for a move
export interface MoveBadge {
  key: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  variant: "success" | "warning" | "info" | "default";
}

export const getMoveBadges = (move: Move): MoveBadge[] => {
  const badges: MoveBadge[] = [];

  // Reliable (accuracy >= 95%)
  if (move.accuracy && move.accuracy >= 95) {
    badges.push({
      key: "reliable",
      labelAr: "موثوقة",
      labelEn: "Reliable",
      icon: "✓",
      variant: "success",
    });
  }

  // Risky (accuracy < 85%)
  if (move.accuracy && move.accuracy < 85 && move.accuracy > 0) {
    badges.push({
      key: "risky",
      labelAr: "مقامرة",
      labelEn: "Risky",
      icon: "⚠",
      variant: "warning",
    });
  }

  // Powerful (power >= 100)
  if (move.power && move.power >= 100) {
    badges.push({
      key: "powerful",
      labelAr: "قوية",
      labelEn: "Powerful",
      icon: "💪",
      variant: "info",
    });
  }

  // Cumulative
  if (isCumulative(move)) {
    badges.push({
      key: "cumulative",
      labelAr: "تراكمية",
      labelEn: "Cumulative",
      icon: "📈",
      variant: "info",
    });
  }

  // No side effects (and has power)
  if (move.power && move.power > 0 && !hasSideEffects(move)) {
    badges.push({
      key: "safe",
      labelAr: "بلا آثار",
      labelEn: "No Recoil",
      icon: "✨",
      variant: "success",
    });
  }

  // Priority move
  if (isPriorityMove(move)) {
    badges.push({
      key: "priority",
      labelAr: "أولوية",
      labelEn: "Priority",
      icon: "⚡",
      variant: "info",
    });
  }

  return badges.slice(0, 3); // Max 3 badges to avoid clutter
};

// Check if move is recommended (heuristic-based)
export const isRecommendedMove = (move: Move): boolean => {
  const hasGoodAccuracy = !move.accuracy || move.accuracy >= 90;
  const hasReasonablePP = move.pp >= 10;
  const noRecoil = !hasSideEffects(move);
  const hasUsefulPower = move.power ? move.power >= 60 : move.category === "status";

  return hasGoodAccuracy && hasReasonablePP && noRecoil && hasUsefulPower;
};

// Generate TL;DR summary for a move
export const getMoveTLDR = (move: Move, language: "ar" | "en"): string => {
  const parts: string[] = [];

  if (language === "ar") {
    // Arabic TL;DR
    if (move.power && move.power >= 100) {
      parts.push("ضربة قوية جداً");
    } else if (move.power && move.power >= 70) {
      parts.push("ضربة قوية");
    } else if (move.power && move.power > 0) {
      parts.push("ضربة متوسطة");
    }

    if (move.accuracy === 100 || !move.accuracy) {
      parts.push("لا تخطئ");
    } else if (move.accuracy && move.accuracy < 85) {
      parts.push("قد تخطئ");
    }

    if (hasSideEffects(move)) {
      parts.push("لها آثار جانبية");
    }

    if (move.category === "status") {
      parts.push("تغير الحالة");
    }

    if (parts.length === 0) {
      parts.push("حركة عادية");
    }
  } else {
    // English TL;DR
    if (move.power && move.power >= 100) {
      parts.push("Very strong hit");
    } else if (move.power && move.power >= 70) {
      parts.push("Strong hit");
    } else if (move.power && move.power > 0) {
      parts.push("Moderate hit");
    }

    if (move.accuracy === 100 || !move.accuracy) {
      parts.push("never misses");
    } else if (move.accuracy && move.accuracy < 85) {
      parts.push("may miss");
    }

    if (hasSideEffects(move)) {
      parts.push("has side effects");
    }

    if (move.category === "status") {
      parts.push("changes status");
    }

    if (parts.length === 0) {
      parts.push("Standard move");
    }
  }

  return parts.join(language === "ar" ? "، " : ", ") + ".";
};

// Generate "when to use" suggestions
export const getWhenToUse = (move: Move, language: "ar" | "en"): string => {
  if (language === "ar") {
    if (move.category === "physical") {
      return "استخدمها ضد بوكيمون ذو دفاع منخفض. الضرر يعتمد على إحصائية الهجوم.";
    } else if (move.category === "special") {
      return "استخدمها ضد بوكيمون ذو دفاع خاص منخفض. الضرر يعتمد على الهجوم الخاص.";
    } else {
      return "استخدمها لتغيير مسار المعركة، مثل رفع إحصائياتك أو خفض إحصائيات الخصم.";
    }
  } else {
    if (move.category === "physical") {
      return "Use against Pokémon with low Defense. Damage scales with Attack stat.";
    } else if (move.category === "special") {
      return "Use against Pokémon with low Sp. Def. Damage scales with Sp. Atk stat.";
    } else {
      return "Use to change battle momentum, like boosting your stats or lowering the opponent's.";
    }
  }
};

// Generate "when to avoid" warnings
export const getWhenToAvoid = (move: Move, language: "ar" | "en"): string => {
  const warnings: string[] = [];

  if (language === "ar") {
    if (hasSideEffects(move)) {
      warnings.push("تسبب ضرراً للمستخدم");
    }
    if (move.accuracy && move.accuracy < 85) {
      warnings.push("دقتها منخفضة وقد تخطئ في اللحظات الحاسمة");
    }
    if (move.pp && move.pp < 10) {
      warnings.push("نقاط القوة محدودة");
    }
    if (move.power && move.power < 50 && move.category !== "status") {
      warnings.push("قوتها منخفضة");
    }
    return warnings.length > 0 ? warnings.join("، ") + "." : "لا توجد تحذيرات خاصة.";
  } else {
    if (hasSideEffects(move)) {
      warnings.push("Causes damage to user");
    }
    if (move.accuracy && move.accuracy < 85) {
      warnings.push("Low accuracy, may miss at crucial moments");
    }
    if (move.pp && move.pp < 10) {
      warnings.push("Limited PP");
    }
    if (move.power && move.power < 50 && move.category !== "status") {
      warnings.push("Low power");
    }
    return warnings.length > 0 ? warnings.join(", ") + "." : "No specific warnings.";
  }
};

// Get category explanation
export const getCategoryExplanation = (category: string, language: "ar" | "en"): string => {
  if (language === "ar") {
    switch (category) {
      case "physical":
        return "الحركات الجسدية تستخدم إحصائية الهجوم (Attack) للمستخدم ضد إحصائية الدفاع (Defense) للخصم.";
      case "special":
        return "الحركات الخاصة تستخدم إحصائية الهجوم الخاص (Sp. Atk) للمستخدم ضد إحصائية الدفاع الخاص (Sp. Def) للخصم.";
      case "status":
        return "حركات الحالة لا تسبب ضرراً مباشراً، لكنها تغير الإحصائيات أو تسبب حالات سلبية.";
      default:
        return "";
    }
  } else {
    switch (category) {
      case "physical":
        return "Physical moves use the user's Attack stat against the target's Defense stat.";
      case "special":
        return "Special moves use the user's Sp. Atk stat against the target's Sp. Def stat.";
      case "status":
        return "Status moves don't deal direct damage but change stats or inflict conditions.";
      default:
        return "";
    }
  }
};

// Advanced filter checks
export const advancedFilters = {
  perfectAccuracy: (move: Move) => move.accuracy === 100 || !move.accuracy,
  highPower: (move: Move) => (move.power ?? 0) >= 100,
  noSideEffects: (move: Move) => !hasSideEffects(move),
  statusOnly: (move: Move) => move.category === "status",
};

// Favorites management (localStorage)
const FAVORITES_KEY = "pokemonApp_favoriteMoves";

export const getFavoriteMoves = (): number[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const toggleFavoriteMove = (moveId: number): boolean => {
  const favorites = getFavoriteMoves();
  const index = favorites.indexOf(moveId);

  if (index === -1) {
    favorites.push(moveId);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return index === -1; // Returns true if added, false if removed
};

export const isFavoriteMove = (moveId: number): boolean => {
  return getFavoriteMoves().includes(moveId);
};

// Notes management (localStorage)
const NOTES_KEY = "pokemonApp_moveNotes";

export const getMoveNotes = (): Record<number, string> => {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const getMoveNote = (moveId: number): string => {
  return getMoveNotes()[moveId] || "";
};

export const saveMoveNote = (moveId: number, note: string): void => {
  const notes = getMoveNotes();
  if (note.trim()) {
    notes[moveId] = note;
  } else {
    delete notes[moveId];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};
