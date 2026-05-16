import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ColorTheme =
  | "default"
  | "sword-red"
  | "shield-purple"
  | "arceus-gold"
  | "pikachu-yellow"
  | "ocean-blue";
export type FontSize = "small" | "medium" | "large" | "xlarge";
export type BorderStyle = "sharp" | "rounded" | "circular";
export type BackgroundPattern = "none" | "pokeballs" | "pokemon" | "gradient" | "custom";
export type AnimationQuality = "low" | "medium" | "high";

interface ThemeSettings {
  colorTheme: ColorTheme;
  fontSize: FontSize;
  borderStyle: BorderStyle;
  backgroundPattern: BackgroundPattern;
  customBackground?: string;
  backgroundOpacity: number;
  animationQuality: AnimationQuality;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateColorTheme: (theme: ColorTheme) => void;
  updateFontSize: (size: FontSize) => void;
  updateBorderStyle: (style: BorderStyle) => void;
  updateBackgroundPattern: (pattern: BackgroundPattern) => void;
  updateCustomBackground: (url: string) => void;
  updateBackgroundOpacity: (opacity: number) => void;
  updateAnimationQuality: (quality: AnimationQuality) => void;
  resetToDefaults: () => void;
}

const defaultSettings: ThemeSettings = {
  colorTheme: "default",
  fontSize: "medium",
  borderStyle: "rounded",
  backgroundPattern: "none",
  backgroundOpacity: 20,
  animationQuality: "high",
};

const colorThemes: Record<ColorTheme, Record<string, string>> = {
  default: {
    "--primary": "262 83% 58%",
    "--primary-foreground": "0 0% 100%",
    "--accent": "45 93% 47%",
  },
  "sword-red": {
    "--primary": "0 72% 51%",
    "--primary-foreground": "0 0% 100%",
    "--accent": "45 93% 47%",
  },
  "shield-purple": {
    "--primary": "280 68% 50%",
    "--primary-foreground": "0 0% 100%",
    "--accent": "200 90% 50%",
  },
  "arceus-gold": {
    "--primary": "45 93% 47%",
    "--primary-foreground": "0 0% 10%",
    "--accent": "262 83% 58%",
  },
  "pikachu-yellow": {
    "--primary": "48 96% 53%",
    "--primary-foreground": "0 0% 10%",
    "--accent": "25 95% 53%",
  },
  "ocean-blue": {
    "--primary": "200 90% 50%",
    "--primary-foreground": "0 0% 100%",
    "--accent": "170 80% 45%",
  },
};

const fontSizeClasses: Record<FontSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
  xlarge: "text-xl",
};

const borderRadiusValues: Record<BorderStyle, string> = {
  sharp: "0",
  rounded: "0.5rem",
  circular: "1rem",
};

const ThemeCustomizationContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeCustomizationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem("theme-customization");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("theme-customization", JSON.stringify(settings));
    applyTheme(settings);
  }, [settings]);

  const applyTheme = (settings: ThemeSettings) => {
    const root = document.documentElement;

    // Apply color theme
    const colors = colorThemes[settings.colorTheme];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply font size
    root.classList.remove("text-sm", "text-base", "text-lg", "text-xl");
    root.setAttribute("data-font-size", settings.fontSize);

    // Apply border style
    root.style.setProperty("--radius", borderRadiusValues[settings.borderStyle]);

    // Apply background
    if (settings.backgroundPattern !== "none") {
      root.setAttribute("data-bg-pattern", settings.backgroundPattern);
      root.style.setProperty("--bg-opacity", `${settings.backgroundOpacity / 100}`);
      if (settings.backgroundPattern === "custom" && settings.customBackground) {
        root.style.setProperty("--custom-bg", `url(${settings.customBackground})`);
      }
    } else {
      root.removeAttribute("data-bg-pattern");
    }
  };

  const updateColorTheme = (theme: ColorTheme) => {
    setSettings((prev) => ({ ...prev, colorTheme: theme }));
  };

  const updateFontSize = (size: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const updateBorderStyle = (style: BorderStyle) => {
    setSettings((prev) => ({ ...prev, borderStyle: style }));
  };

  const updateBackgroundPattern = (pattern: BackgroundPattern) => {
    setSettings((prev) => ({ ...prev, backgroundPattern: pattern }));
  };

  const updateCustomBackground = (url: string) => {
    setSettings((prev) => ({ ...prev, customBackground: url, backgroundPattern: "custom" }));
  };

  const updateBackgroundOpacity = (opacity: number) => {
    setSettings((prev) => ({ ...prev, backgroundOpacity: opacity }));
  };

  const updateAnimationQuality = (quality: AnimationQuality) => {
    setSettings((prev) => ({ ...prev, animationQuality: quality }));
    // Apply to document for CSS-based reduced motion
    document.documentElement.setAttribute("data-animation-quality", quality);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <ThemeCustomizationContext.Provider
      value={{
        settings,
        updateColorTheme,
        updateFontSize,
        updateBorderStyle,
        updateBackgroundPattern,
        updateCustomBackground,
        updateBackgroundOpacity,
        updateAnimationQuality,
        resetToDefaults,
      }}
    >
      {children}
    </ThemeCustomizationContext.Provider>
  );
}

export function useThemeCustomization() {
  const context = useContext(ThemeCustomizationContext);
  if (!context) {
    throw new Error("useThemeCustomization must be used within a ThemeCustomizationProvider");
  }
  return context;
}

export { fontSizeClasses, colorThemes };
