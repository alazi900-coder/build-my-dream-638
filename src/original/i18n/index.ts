/**
 * Centralized i18n translation system
 * Provides a single source of truth for all UI translations
 */

import enUI from "./ui.en.json";
import arUI from "./ui.ar.json";

type TranslationKey = keyof typeof enUI;

/**
 * Get translation by key for the specified language
 * Falls back to English if Arabic translation is missing
 */
export function t(key: TranslationKey, language: "en" | "ar"): string {
  const translations = language === "ar" ? arUI : enUI;
  return (
    (translations as Record<string, string>)[key] || (enUI as Record<string, string>)[key] || key
  );
}

/**
 * Get translation with placeholder replacement
 * Example: tFormat('page.dex.available', 'ar', { count: 151 })
 */
export function tFormat(
  key: TranslationKey,
  language: "en" | "ar",
  replacements: Record<string, string | number>,
): string {
  let text = t(key, language);
  Object.entries(replacements).forEach(([placeholder, value]) => {
    text = text.replace(`{${placeholder}}`, String(value));
  });
  return text;
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(key: string): key is TranslationKey {
  return key in enUI;
}

// Export types for use in components
export type { TranslationKey };

// Re-export everything from localization for backwards compatibility
export * from "@/original/lib/localization";
