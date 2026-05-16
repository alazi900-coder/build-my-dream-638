// Section names in English and Arabic
const SECTION_NAMES: Record<string, { en: string; ar: string }> = {
  "/": { en: "Pokédex section", ar: "قسم الدليل" },
  "/moves": { en: "Moves section", ar: "قسم الحركات" },
  "/items": { en: "Items section", ar: "قسم الأدوات" },
  "/gyms": { en: "Gyms section", ar: "قسم الصالات" },
  "/map": { en: "Map section", ar: "قسم الخريطة" },
  "/npcs": { en: "NPCs section", ar: "قسم الشخصيات" },
  "/compare": { en: "Compare section", ar: "قسم المقارنة" },
  "/team-builder": { en: "Team Builder section", ar: "قسم بناء الفريق" },
  "/battle": { en: "Battle section", ar: "قسم المعركة" },
  "/coach": { en: "AI Coach section", ar: "قسم المدرب الذكي" },
  "/art": { en: "AI Art section", ar: "قسم الفن الذكي" },
  "/story": { en: "Stories section", ar: "قسم القصص" },
  "/settings": { en: "Settings section", ar: "قسم الإعدادات" },
  "/admin": { en: "Admin section", ar: "قسم الإدارة" },
};

// Check if speech is enabled in settings
export function isSpeechEnabled(): boolean {
  return localStorage.getItem("sectionSpeech") === "true";
}

// Enable/disable speech
export function setSpeechEnabled(enabled: boolean): void {
  localStorage.setItem("sectionSpeech", String(enabled));
}

// Get section name for a path
export function getSectionName(path: string, language: "en" | "ar"): string | null {
  // Check for exact match first
  if (SECTION_NAMES[path]) {
    return SECTION_NAMES[path][language];
  }

  // Check for partial match (e.g., /pokemon/1 -> /, /gyms/1 -> /gyms)
  const basePath = "/" + path.split("/")[1];
  if (basePath !== path && SECTION_NAMES[basePath]) {
    return SECTION_NAMES[basePath][language];
  }

  return null;
}

// Speak text using Web Speech API
export function speakText(text: string, language: "en" | "ar"): void {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === "ar" ? "ar-SA" : "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 0.8;

  window.speechSynthesis.speak(utterance);
}

// Speak section name
export function speakSectionName(path: string, language: "en" | "ar"): void {
  if (!isSpeechEnabled()) return;

  const sectionName = getSectionName(path, language);
  if (sectionName) {
    speakText(sectionName, language);
  }
}
