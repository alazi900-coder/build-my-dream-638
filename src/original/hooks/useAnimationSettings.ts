import { useThemeCustomization } from "@/original/contexts/ThemeCustomizationContext";
import { useIsMobile } from "@/original/hooks/use-mobile";
import { useState, useEffect } from "react";

export type AnimationQuality = "low" | "medium" | "high";

interface ParticleCounts {
  small: number;
  medium: number;
  large: number;
}

const particleCountsMap: Record<AnimationQuality, ParticleCounts> = {
  low: { small: 3, medium: 4, large: 5 },
  medium: { small: 5, medium: 8, large: 10 },
  high: { small: 8, medium: 12, large: 15 },
};

export function useAnimationSettings() {
  const { settings } = useThemeCustomization();
  const isMobile = useIsMobile();

  // Detect system prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Auto-detect based on device if not explicitly set
  const quality: AnimationQuality = settings.animationQuality || (isMobile ? "low" : "high");

  // Reduce motion if system preference is set OR if quality is low
  const shouldReduceMotion = prefersReducedMotion || quality === "low";

  return {
    quality,
    particleCounts: particleCountsMap[quality],
    shouldReduceMotion,
    prefersReducedMotion,
  };
}
