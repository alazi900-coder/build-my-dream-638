/**
 * Location utilities for favorites, notes, visited tracking, and category descriptions
 */

const FAVORITES_KEY = "favoriteLocations";
const NOTES_KEY = "locationNotes";
const VISITED_KEY = "visitedLocations";

// ============ FAVORITES ============
export function getFavoriteLocations(): number[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteLocation(locationId: number): boolean {
  const favorites = getFavoriteLocations();
  const index = favorites.indexOf(locationId);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(locationId);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return index === -1; // Returns true if now favorited
}

export function isLocationFavorite(locationId: number): boolean {
  return getFavoriteLocations().includes(locationId);
}

// ============ NOTES ============
export function getLocationNotes(): Record<number, string> {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getLocationNote(locationId: number): string {
  return getLocationNotes()[locationId] || "";
}

export function saveLocationNote(locationId: number, note: string): void {
  const notes = getLocationNotes();
  if (note.trim()) {
    notes[locationId] = note;
  } else {
    delete notes[locationId];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// ============ VISITED ============
export function getVisitedLocations(): number[] {
  try {
    const stored = localStorage.getItem(VISITED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function markLocationVisited(locationId: number): void {
  const visited = getVisitedLocations();
  if (!visited.includes(locationId)) {
    visited.push(locationId);
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  }
}

export function isLocationVisited(locationId: number): boolean {
  return getVisitedLocations().includes(locationId);
}

export function getVisitedCount(): number {
  return getVisitedLocations().length;
}

// ============ CATEGORY DESCRIPTIONS ============
export interface LocationCategoryInfo {
  descriptionAr: string;
  descriptionEn: string;
  whyNoDataAr: string;
  whyNoDataEn: string;
  helperAr: string;
  helperEn: string;
}

export const CATEGORY_INFO: Record<string, LocationCategoryInfo> = {
  town: {
    descriptionAr: "مدينة نشطة بها مركز بوكيمون ومتاجر للشفاء والتسوق",
    descriptionEn: "A bustling town with a Pokémon Center and shops for healing and shopping",
    whyNoDataAr: "المدن مخصصة للشفاء والتسوق. البوكيمونات البرية تظهر في الطرق المحيطة.",
    whyNoDataEn: "Towns are for healing and shopping. Wild Pokémon appear on surrounding routes.",
    helperAr: "أماكن حضرية للخدمات",
    helperEn: "Urban areas for services",
  },
  route: {
    descriptionAr: "طريق للتنقل بين المناطق حيث تلتقي بالمدربين والبوكيمونات البرية",
    descriptionEn:
      "A route for traveling between areas where you encounter trainers and wild Pokémon",
    whyNoDataAr: "بيانات اللقاءات لهذا الطريق قيد الإضافة قريباً.",
    whyNoDataEn: "Encounter data for this route is being added soon.",
    helperAr: "مسارات التنقل",
    helperEn: "Travel paths",
  },
  wild: {
    descriptionAr: "منطقة برية شاسعة بتنوع بيولوجي عالي وبوكيمونات متنوعة",
    descriptionEn: "A vast wild area with high biodiversity and diverse Pokémon",
    whyNoDataAr: "البيانات التفصيلية للمنطقة البرية قادمة قريباً.",
    whyNoDataEn: "Detailed data for this wild area is coming soon.",
    helperAr: "أماكن استكشاف",
    helperEn: "Exploration areas",
  },
  cave: {
    descriptionAr: "كهف معتم قد يحتوي على بوكيمونات نادرة وأدوات مخفية",
    descriptionEn: "A dark cave that may contain rare Pokémon and hidden items",
    whyNoDataAr: "البيانات التفصيلية للكهف قادمة قريباً.",
    whyNoDataEn: "Detailed data for this cave is coming soon.",
    helperAr: "كهوف ومناجم",
    helperEn: "Caves and mines",
  },
  other: {
    descriptionAr: "منطقة خاصة قد تحتوي على أحداث أو لقاءات فريدة",
    descriptionEn: "A special area that may contain unique events or encounters",
    whyNoDataAr: "هذه منطقة خاصة، البيانات قيد الإضافة.",
    whyNoDataEn: "This is a special area, data is being added.",
    helperAr: "مناطق خاصة",
    helperEn: "Special areas",
  },
};

export function getCategoryDescription(category: string, language: "ar" | "en"): string {
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.other;
  return language === "ar" ? info.descriptionAr : info.descriptionEn;
}

export function getCategoryWhyNoData(category: string, language: "ar" | "en"): string {
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.other;
  return language === "ar" ? info.whyNoDataAr : info.whyNoDataEn;
}

export function getCategoryHelper(category: string, language: "ar" | "en"): string {
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.other;
  return language === "ar" ? info.helperAr : info.helperEn;
}

// ============ DISCOVERY STATUS ============
export type DiscoveryStatus = "visited" | "incomplete" | "pending";

export function getDiscoveryStatus(locationId: number, hasPokemonData: boolean): DiscoveryStatus {
  if (isLocationVisited(locationId)) {
    return "visited";
  }
  if (hasPokemonData) {
    return "incomplete";
  }
  return "pending";
}

export function getDiscoveryStatusLabel(status: DiscoveryStatus, language: "ar" | "en"): string {
  const labels: Record<DiscoveryStatus, { ar: string; en: string }> = {
    visited: { ar: "تمت الزيارة", en: "Visited" },
    incomplete: { ar: "غير مكتملة", en: "Incomplete" },
    pending: { ar: "قيد الإضافة", en: "Coming Soon" },
  };
  return labels[status][language];
}

export function getDiscoveryStatusColor(status: DiscoveryStatus): string {
  const colors: Record<DiscoveryStatus, string> = {
    visited: "bg-green-500/20 text-green-400 border-green-500/30",
    incomplete: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    pending: "bg-muted text-muted-foreground border-border",
  };
  return colors[status];
}
