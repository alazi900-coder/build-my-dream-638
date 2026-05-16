import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { speakSectionName, isSpeechEnabled } from "@/original/lib/speechUtils";

export function useSectionSpeech() {
  const location = useLocation();
  const { language } = useLanguage();
  const previousPath = useRef<string | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip first mount to avoid speaking on initial page load
    if (isFirstMount.current) {
      isFirstMount.current = false;
      previousPath.current = location.pathname;
      return;
    }

    // Only speak if path actually changed and speech is enabled
    if (previousPath.current !== location.pathname && isSpeechEnabled()) {
      speakSectionName(location.pathname, language);
    }

    previousPath.current = location.pathname;
  }, [location.pathname, language]);
}
