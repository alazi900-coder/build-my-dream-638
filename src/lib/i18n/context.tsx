import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, typeNames, type Lang } from "./translations";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)[Lang];
  dir: "rtl" | "ltr";
  typeName: (type: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const value: I18nContextValue = {
    lang,
    setLang,
    t: translations[lang],
    dir: lang === "ar" ? "rtl" : "ltr",
    typeName: (type: string) => typeNames[type]?.[lang] ?? type,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
