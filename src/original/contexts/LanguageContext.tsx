import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { t as translate, tFormat } from "@/original/i18n";
import type { TranslationKey } from "@/original/i18n";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Legacy t function - use for inline translations */
  t: (en: string, ar: string) => string;
  /** New t function using centralized translations */
  tr: (key: TranslationKey) => string;
  /** New t function with placeholders */
  trFormat: (key: TranslationKey, replacements: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("pokemon-guide-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("pokemon-guide-language", lang);
  };

  // Legacy t function for backwards compatibility
  const t = (en: string, ar: string) => {
    return language === "ar" ? ar : en;
  };

  // New translation function using centralized translations
  const tr = (key: TranslationKey) => {
    return translate(key, language);
  };

  // New translation function with placeholder support
  const trFormat = (key: TranslationKey, replacements: Record<string, string | number>) => {
    return tFormat(key, language, replacements);
  };

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tr, trFormat, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
