import type { GameId } from "@/original/contexts/GameFilterContext";

export interface GameWorldTheme {
  id: GameId;
  worldClass: string;
  symbol: string;
  shortEn: string;
  shortAr: string;
  regionEn: string;
  regionAr: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  landmarkEn: string;
  landmarkAr: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  terrain: string;
  pattern: string;
  mascotPokemonIds: number[];
}

export const GAME_WORLD_THEMES: Record<GameId, GameWorldTheme> = {
  all: {
    id: "all",
    worldClass: "game-world-all",
    symbol: "◓",
    shortEn: "Worlds",
    shortAr: "العوالم",
    regionEn: "All Regions",
    regionAr: "كل المناطق",
    titleEn: "Pokémon World Atlas",
    titleAr: "أطلس عالم بوكيمون",
    subtitleEn: "Every route, starter, legend, and trainer tool in one glowing Pokédex.",
    subtitleAr: "كل طريق وبداية وأسطورة وأداة تدريب داخل بوكيديكس واحد نابض.",
    landmarkEn: "Global Pokédex Network",
    landmarkAr: "شبكة البوكيديكس العالمية",
    primary: "oklch(0.62 0.24 285)",
    secondary: "oklch(0.82 0.16 88)",
    accent: "oklch(0.68 0.2 35)",
    glow: "oklch(0.72 0.2 285 / 45%)",
    terrain: "oklch(0.42 0.14 245 / 18%)",
    pattern: "oklch(1 0 0 / 16%)",
    mascotPokemonIds: [25, 133, 143],
  },
  letsgo: {
    id: "letsgo",
    worldClass: "game-world-letsgo",
    symbol: "⚡",
    shortEn: "Kanto",
    shortAr: "كانتو",
    regionEn: "Kanto",
    regionAr: "كانتو",
    titleEn: "Kanto Partner Journey",
    titleAr: "رحلة شريك كانتو",
    subtitleEn: "Bright routes, classic badges, and Pikachu/Eevee energy across the guide.",
    subtitleAr: "طرق مشرقة وشارات كلاسيكية وطاقة بيكاتشو/إيفي في كل الواجهة.",
    landmarkEn: "Viridian paths and Indigo badges",
    landmarkAr: "طرق فيريديان وشارات إنديغو",
    primary: "oklch(0.78 0.18 86)",
    secondary: "oklch(0.67 0.2 34)",
    accent: "oklch(0.58 0.19 145)",
    glow: "oklch(0.86 0.18 88 / 48%)",
    terrain: "oklch(0.66 0.18 145 / 20%)",
    pattern: "oklch(1 0 0 / 18%)",
    mascotPokemonIds: [25, 133, 1],
  },
  swsh: {
    id: "swsh",
    worldClass: "game-world-swsh",
    symbol: "🛡",
    shortEn: "Galar",
    shortAr: "غالار",
    regionEn: "Galar",
    regionAr: "غالار",
    titleEn: "Galar Stadium Circuit",
    titleAr: "مسار ملاعب غالار",
    subtitleEn: "Stadium lights, wild areas, raids, and champion energy for Sword/Shield.",
    subtitleAr: "أضواء الملاعب والمناطق البرية والغارات وطاقة الأبطال لسورد/شيلد.",
    landmarkEn: "Wild Area and Crown Tundra",
    landmarkAr: "المنطقة البرية وتندرا التاج",
    primary: "oklch(0.58 0.22 248)",
    secondary: "oklch(0.63 0.21 350)",
    accent: "oklch(0.78 0.13 82)",
    glow: "oklch(0.64 0.22 248 / 44%)",
    terrain: "oklch(0.52 0.12 190 / 20%)",
    pattern: "oklch(1 0 0 / 14%)",
    mascotPokemonIds: [888, 889, 810],
  },
  arceus: {
    id: "arceus",
    worldClass: "game-world-arceus",
    symbol: "✦",
    shortEn: "Hisui",
    shortAr: "هيسوي",
    regionEn: "Hisui",
    regionAr: "هيسوي",
    titleEn: "Hisui Expedition Log",
    titleAr: "سجل بعثة هيسوي",
    subtitleEn: "Ancient parchment, survey corps notes, and noble Pokémon atmosphere.",
    subtitleAr: "رقوق قديمة وملاحظات فريق الاستكشاف وأجواء البوكيمون النبيلة.",
    landmarkEn: "Obsidian Fieldlands expedition",
    landmarkAr: "بعثة سهول أوبسيديان",
    primary: "oklch(0.54 0.13 68)",
    secondary: "oklch(0.62 0.13 156)",
    accent: "oklch(0.66 0.1 236)",
    glow: "oklch(0.76 0.12 72 / 42%)",
    terrain: "oklch(0.52 0.1 92 / 22%)",
    pattern: "oklch(1 0 0 / 12%)",
    mascotPokemonIds: [493, 724, 899],
  },
  sv: {
    id: "sv",
    worldClass: "game-world-sv",
    symbol: "✧",
    shortEn: "Paldea",
    shortAr: "بالديا",
    regionEn: "Paldea",
    regionAr: "بالديا",
    titleEn: "Paldea Treasure Hunt",
    titleAr: "رحلة كنز بالديا",
    subtitleEn: "Academy colors, crystalline Tera sparkle, and open-world adventure cues.",
    subtitleAr: "ألوان الأكاديمية ولمعان تيرا الكريستالي وإحساس المغامرة المفتوحة.",
    landmarkEn: "Mesagoza academy and Area Zero",
    landmarkAr: "أكاديمية ميساغوزا والمنطقة صفر",
    primary: "oklch(0.61 0.23 28)",
    secondary: "oklch(0.56 0.22 300)",
    accent: "oklch(0.82 0.12 188)",
    glow: "oklch(0.75 0.18 188 / 48%)",
    terrain: "oklch(0.62 0.16 28 / 20%)",
    pattern: "oklch(1 0 0 / 16%)",
    mascotPokemonIds: [1007, 1008, 906],
  },
};

export function getGameWorldTheme(gameId: GameId): GameWorldTheme {
  return GAME_WORLD_THEMES[gameId];
}

export function getLocalizedWorldName(world: GameWorldTheme, language: "en" | "ar"): string {
  return language === "ar" ? world.regionAr : world.regionEn;
}

export function getLocalizedWorldTitle(world: GameWorldTheme, language: "en" | "ar"): string {
  return language === "ar" ? world.titleAr : world.titleEn;
}

export function getLocalizedWorldSubtitle(world: GameWorldTheme, language: "en" | "ar"): string {
  return language === "ar" ? world.subtitleAr : world.subtitleEn;
}
