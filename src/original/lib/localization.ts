/**
 * Localization utilities for Arabic/English text handling
 * Ensures Arabic mode NEVER shows English text - uses placeholders instead
 * Includes RTL utilities and direction helpers
 */

type SupportedLanguage = "en" | "ar";

const safeText = (value: string | null | undefined, fallback = ""): string =>
  typeof value === "string" && value.trim() !== "" ? value : fallback;

const safeKey = (value: string | null | undefined, fallback = ""): string =>
  safeText(value, fallback).toLowerCase();

// ============================================================
// RTL UTILITIES - Centralized direction handling
// ============================================================

/**
 * Check if current language is RTL
 */
export function isRTL(language: SupportedLanguage): boolean {
  return language === "ar";
}

/**
 * Get direction attribute value
 */
export function getDirection(language: SupportedLanguage): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}

/**
 * CSS class for wrapping numbers in RTL context to keep them LTR
 * Usage: <span dir="ltr" className="inline-block">{number}</span>
 */
export const LTR_NUMBER_CLASS = "inline-block";
export const LTR_NUMBER_DIR = "ltr" as const;

/**
 * Format number for display - always LTR in RTL context
 */
export function formatNumber(
  num: number | string | null | undefined,
  language: SupportedLanguage,
): string {
  return String(num ?? 0);
}

// ============================================================
// EMPTY STATE MESSAGES - Smart alternatives
// ============================================================
export const EMPTY_STATE_MESSAGES = {
  noEvolution: {
    en: "This Pokémon does not evolve",
    ar: "هذا البوكيمون لا يتطور",
  },
  evolutionDataUnavailable: {
    en: "Evolution data unavailable",
    ar: "بيانات التطور غير متوفرة",
  },
  noMoves: {
    en: "No moves available for this Pokémon",
    ar: "لا توجد حركات متاحة لهذا البوكيمون",
  },
  noEncounters: {
    en: "No encounter locations found",
    ar: "لم يتم العثور على مواقع لقاء",
  },
  noResults: {
    en: "No results found. Try adjusting your search or filters.",
    ar: "لا توجد نتائج. حاول تعديل البحث أو الفلاتر.",
  },
  noTeam: {
    en: "Your team is empty. Add Pokémon to get started!",
    ar: "فريقك فارغ. أضف بوكيمون للبدء!",
  },
} as const;

// ============================================================
// ARABIC PLACEHOLDERS
// ============================================================
export const AR_PLACEHOLDERS = {
  name: "الاسم قيد الإضافة",
  description: "الوصف قيد الإضافة",
  effect: "التأثير قيد الإضافة",
  location: "الموقع قيد الإضافة",
  method: "الطريقة قيد الإضافة",
  notAvailable: "غير متاح في هذه اللعبة",
  noData: "لا توجد بيانات",
  loading: "جاري التحميل...",
  unknown: "غير معروف",
} as const;

/**
 * Get localized name with fallback to placeholder in Arabic mode
 * NEVER returns English in Arabic mode
 */
export function getLocalizedName(
  nameEn: string | null | undefined,
  nameAr: string | null | undefined,
  language: SupportedLanguage,
): string {
  const englishName = safeText(nameEn, "Unknown");
  if (language === "ar") {
    // Only use Arabic if it exists AND is different from English
    if (nameAr && nameAr.trim() !== "" && nameAr !== englishName) {
      return nameAr;
    }
    return AR_PLACEHOLDERS.name;
  }
  return englishName;
}

/**
 * Get localized description/effect with fallback
 */
export function getLocalizedDescription(
  textEn: string | null | undefined,
  textAr: string | null | undefined,
  language: SupportedLanguage,
  placeholder: string = AR_PLACEHOLDERS.description,
): string {
  const englishText = safeText(textEn);
  if (language === "ar") {
    if (textAr && textAr.trim() !== "" && textAr !== englishText) {
      return textAr;
    }
    return placeholder;
  }
  return englishText;
}

/**
 * Check if Arabic translation exists and is valid
 */
export function hasValidArabic(textAr: string | null | undefined, textEn?: string | null): boolean {
  if (!textAr || textAr.trim() === "") return false;
  if (textEn && textAr === textEn) return false;
  return true;
}

/**
 * Get bilingual display - primary in current language, secondary in other
 */
export function getBilingualDisplay(
  nameEn: string | null | undefined,
  nameAr: string | null | undefined,
  language: SupportedLanguage,
): { primary: string; secondary: string | null } {
  const englishName = safeText(nameEn, "Unknown");
  if (language === "ar") {
    const primary = hasValidArabic(nameAr, englishName) ? nameAr! : AR_PLACEHOLDERS.name;
    // Only show English as secondary if we have a valid Arabic primary
    const secondary = hasValidArabic(nameAr, englishName) ? englishName : null;
    return { primary, secondary };
  }
  return {
    primary: englishName,
    secondary: hasValidArabic(nameAr, englishName) ? safeText(nameAr) : null,
  };
}

/**
 * Type labels with Arabic translations - CANONICAL SOURCE
 * Use getLocalizedType() for all type rendering
 */
export const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  normal: { en: "Normal", ar: "عادي" },
  fire: { en: "Fire", ar: "ناري" },
  water: { en: "Water", ar: "مائي" },
  electric: { en: "Electric", ar: "كهربائي" },
  grass: { en: "Grass", ar: "عشبي" },
  ice: { en: "Ice", ar: "جليدي" },
  fighting: { en: "Fighting", ar: "قتالي" },
  poison: { en: "Poison", ar: "سام" },
  ground: { en: "Ground", ar: "أرضي" },
  flying: { en: "Flying", ar: "طائر" },
  psychic: { en: "Psychic", ar: "نفسي" },
  bug: { en: "Bug", ar: "حشري" },
  rock: { en: "Rock", ar: "صخري" },
  ghost: { en: "Ghost", ar: "شبح" },
  dragon: { en: "Dragon", ar: "تنين" },
  dark: { en: "Dark", ar: "ظلامي" },
  steel: { en: "Steel", ar: "فولاذي" },
  fairy: { en: "Fairy", ar: "جنيات" },
};

/**
 * Get localized type name
 */
export function getLocalizedType(
  type: string | null | undefined,
  language: SupportedLanguage,
): string {
  const safeType = safeText(type, AR_PLACEHOLDERS.unknown);
  const label = TYPE_LABELS[safeKey(type)];
  if (!label) return safeType;
  return language === "ar" ? label.ar : label.en;
}

/**
 * Category labels with Arabic translations - CANONICAL SOURCE
 * Use getLocalizedCategory() for all category rendering
 */
export const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  all: { en: "All", ar: "الكل" },
  physical: { en: "Physical", ar: "جسدي" },
  special: { en: "Special", ar: "خاص" },
  status: { en: "Status", ar: "حالة" },
};

/**
 * Get localized category name
 */
export function getLocalizedCategory(
  category: string | null | undefined,
  language: SupportedLanguage,
): string {
  const safeCategory = safeText(category, "other");
  const label = CATEGORY_LABELS[safeKey(category, "other")];
  if (!label) return safeCategory;
  return language === "ar" ? label.ar : label.en;
}

/**
 * Learn method labels with Arabic translations - CANONICAL SOURCE
 * Use getLocalizedLearnMethod() for all learn method rendering
 */
export const LEARN_METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  all: { en: "All", ar: "الكل" },
  level: { en: "Level Up", ar: "رفع المستوى" },
  tm: { en: "TM/TR", ar: "آلة تعليم" },
  egg: { en: "Egg", ar: "بيضة" },
  tutor: { en: "Tutor", ar: "معلم" },
  other: { en: "Other", ar: "أخرى" },
};

/**
 * Get localized learn method name
 */
export function getLocalizedLearnMethod(
  method: string | null | undefined,
  language: SupportedLanguage,
): string {
  const safeMethod = safeText(method, "other");
  const label = LEARN_METHOD_LABELS[safeKey(method, "other")];
  if (!label) return safeMethod;
  return language === "ar" ? label.ar : label.en;
}

/**
 * Stat labels with Arabic translations - CANONICAL SOURCE
 * Use getLocalizedStat() for all stat rendering
 */
export const STAT_LABELS: Record<
  string,
  { en: string; enShort: string; ar: string; arShort: string }
> = {
  hp: { en: "HP", enShort: "HP", ar: "نقاط الصحة", arShort: "ص.ح" },
  atk: { en: "Attack", enShort: "ATK", ar: "الهجوم", arShort: "هجوم" },
  def: { en: "Defense", enShort: "DEF", ar: "الدفاع", arShort: "دفاع" },
  spa: { en: "Special Attack", enShort: "SP.A", ar: "الهجوم الخاص", arShort: "هـ.خ" },
  spd: { en: "Special Defense", enShort: "SP.D", ar: "الدفاع الخاص", arShort: "د.خ" },
  spe: { en: "Speed", enShort: "SPE", ar: "السرعة", arShort: "سرعة" },
};

/**
 * Get localized stat name
 */
export function getLocalizedStat(
  stat: string | null | undefined,
  language: SupportedLanguage,
  short: boolean = true,
): string {
  const safeStat = safeText(stat, AR_PLACEHOLDERS.unknown);
  const label = STAT_LABELS[safeKey(stat)];
  if (!label) return safeStat;
  if (language === "ar") {
    return short ? label.arShort : label.ar;
  }
  return short ? label.enShort : label.en;
}

/**
 * Common UI labels
 */
export const UI_LABELS = {
  search: { en: "Search", ar: "بحث" },
  filter: { en: "Filter", ar: "تصفية" },
  all: { en: "All", ar: "الكل" },
  back: { en: "Back", ar: "رجوع" },
  next: { en: "Next", ar: "التالي" },
  previous: { en: "Previous", ar: "السابق" },
  page: { en: "Page", ar: "صفحة" },
  of: { en: "of", ar: "من" },
  noResults: { en: "No results found", ar: "لا توجد نتائج" },
  loading: { en: "Loading...", ar: "جاري التحميل..." },
  error: { en: "Error", ar: "خطأ" },
  notAvailable: { en: "Not available in this game", ar: "غير متاح في هذه اللعبة" },
  level: { en: "Level", ar: "مستوى" },
  power: { en: "Power", ar: "القوة" },
  accuracy: { en: "Accuracy", ar: "الدقة" },
  pp: { en: "PP", ar: "PP" },
  baseStatTotal: { en: "Base Stat Total", ar: "مجموع الإحصائيات" },
  stats: { en: "Base Stats", ar: "الإحصائيات الأساسية" },
} as const;

/**
 * Location category labels with Arabic translations - CANONICAL SOURCE
 * Use getLocalizedLocationCategory() for all location category rendering
 */
export const LOCATION_CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  all: { en: "All", ar: "الكل" },
  town: { en: "Towns & Cities", ar: "المدن والبلدات" },
  route: { en: "Routes", ar: "الطرق" },
  wild: { en: "Wild Areas", ar: "المناطق البرية" },
  cave: { en: "Caves & Mines", ar: "الكهوف والمناجم" },
  other: { en: "Other", ar: "أخرى" },
};

/**
 * Get localized location category name
 */
export function getLocalizedLocationCategory(
  category: string | null | undefined,
  language: SupportedLanguage,
): string {
  const safeCategory = safeText(category, "other");
  const label = LOCATION_CATEGORY_LABELS[safeKey(category, "other")];
  if (!label) return safeCategory;
  return language === "ar" ? label.ar : label.en;
}

/**
 * Encounter method labels with Arabic translations - CANONICAL SOURCE
 * Use getLocalizedEncounterMethod() for all encounter method rendering
 */
export const ENCOUNTER_METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  walking: { en: "Walking", ar: "المشي" },
  surfing: { en: "Surfing", ar: "السباحة" },
  fishing: { en: "Fishing", ar: "الصيد" },
  headbutt: { en: "Headbutt", ar: "ضربة الرأس" },
  "rock-smash": { en: "Rock Smash", ar: "تحطيم الصخور" },
  gift: { en: "Gift", ar: "هدية" },
  trade: { en: "Trade", ar: "تبادل" },
  static: { en: "Static", ar: "ثابت" },
  grass: { en: "Grass", ar: "العشب" },
  cave: { en: "Cave", ar: "الكهف" },
  water: { en: "Water", ar: "الماء" },
  overworld: { en: "Overworld", ar: "العالم المفتوح" },
  "mass-outbreak": { en: "Mass Outbreak", ar: "اندلاع جماعي" },
  "space-time-distortion": { en: "Space-Time Distortion", ar: "تشوه الزمكان" },
  "old-rod": { en: "Old Rod", ar: "صنارة قديمة" },
  "good-rod": { en: "Good Rod", ar: "صنارة جيدة" },
  "super-rod": { en: "Super Rod", ar: "صنارة خارقة" },
  raid: { en: "Raid", ar: "غارة" },
  "tera-raid": { en: "Tera Raid", ar: "غارة تيرا" },
  breeding: { en: "Breeding", ar: "تفريخ" },
  evolution: { en: "Evolution", ar: "تطور" },
};

/**
 * Get localized encounter method name
 */
export function getLocalizedEncounterMethod(
  method: string | null | undefined,
  language: SupportedLanguage,
): string {
  const safeMethod = safeText(method, "unknown");
  const label = ENCOUNTER_METHOD_LABELS[safeKey(method)];
  if (!label) {
    // Return the method with first letter capitalized if not found
    return safeMethod.charAt(0).toUpperCase() + safeMethod.slice(1).replace(/-/g, " ");
  }
  return language === "ar" ? label.ar : label.en;
}
