import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Slider } from "@/original/components/ui/slider";
import { Label } from "@/original/components/ui/label";
import { Palette, Type, Square, Image, RotateCcw, Check, Sparkles } from "lucide-react";
import {
  useThemeCustomization,
  ColorTheme,
  FontSize,
  BorderStyle,
  BackgroundPattern,
  AnimationQuality,
} from "@/original/contexts/ThemeCustomizationContext";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";

const colorThemeOptions: { id: ColorTheme; name: string; nameAr: string; color: string }[] = [
  {
    id: "default",
    name: "Default Purple",
    nameAr: "البنفسجي الافتراضي",
    color: "hsl(262, 83%, 58%)",
  },
  { id: "sword-red", name: "Sword Red", nameAr: "أحمر السيف", color: "hsl(0, 72%, 51%)" },
  {
    id: "shield-purple",
    name: "Shield Purple",
    nameAr: "بنفسجي الدرع",
    color: "hsl(280, 68%, 50%)",
  },
  { id: "arceus-gold", name: "Arceus Gold", nameAr: "ذهبي آرسيوس", color: "hsl(45, 93%, 47%)" },
  {
    id: "pikachu-yellow",
    name: "Pikachu Yellow",
    nameAr: "أصفر بيكاتشو",
    color: "hsl(48, 96%, 53%)",
  },
  { id: "ocean-blue", name: "Ocean Blue", nameAr: "أزرق المحيط", color: "hsl(200, 90%, 50%)" },
];

const fontSizeOptions: { id: FontSize; name: string; nameAr: string; scale: string }[] = [
  { id: "small", name: "Small", nameAr: "صغير", scale: "14px" },
  { id: "medium", name: "Medium", nameAr: "متوسط", scale: "16px" },
  { id: "large", name: "Large", nameAr: "كبير", scale: "18px" },
  { id: "xlarge", name: "Extra Large", nameAr: "كبير جداً", scale: "20px" },
];

const borderStyleOptions: { id: BorderStyle; name: string; nameAr: string; radius: string }[] = [
  { id: "sharp", name: "Sharp", nameAr: "حاد", radius: "0" },
  { id: "rounded", name: "Rounded", nameAr: "مستدير", radius: "8px" },
  { id: "circular", name: "Circular", nameAr: "دائري", radius: "16px" },
];

const backgroundOptions: {
  id: BackgroundPattern;
  name: string;
  nameAr: string;
  preview: string;
}[] = [
  { id: "none", name: "None", nameAr: "بدون", preview: "" },
  { id: "pokeballs", name: "Poké Balls", nameAr: "كرات بوكي", preview: "🔴" },
  { id: "pokemon", name: "Pokémon", nameAr: "بوكيمون", preview: "⚡" },
  { id: "gradient", name: "Gradient", nameAr: "تدرج", preview: "🌈" },
];

const animationQualityOptions: {
  id: AnimationQuality;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
}[] = [
  {
    id: "low",
    name: "Low",
    nameAr: "منخفض",
    description: "Best performance",
    descriptionAr: "أفضل أداء",
  },
  {
    id: "medium",
    name: "Medium",
    nameAr: "متوسط",
    description: "Balanced",
    descriptionAr: "متوازن",
  },
  {
    id: "high",
    name: "High",
    nameAr: "عالي",
    description: "More effects",
    descriptionAr: "مؤثرات أكثر",
  },
];

export function ThemeCustomizer() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const {
    settings,
    updateColorTheme,
    updateFontSize,
    updateBorderStyle,
    updateBackgroundPattern,
    updateBackgroundOpacity,
    updateAnimationQuality,
    resetToDefaults,
  } = useThemeCustomization();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {isArabic ? "تخصيص الواجهة" : "UI Customization"}
        </CardTitle>
        <CardDescription>
          {isArabic ? "خصص مظهر التطبيق حسب ذوقك" : "Customize the app appearance to your liking"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Theme */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Palette className="h-4 w-4" />
            {isArabic ? "مجموعة الألوان" : "Color Theme"}
          </Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {colorThemeOptions.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateColorTheme(theme.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                  settings.colorTheme === theme.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-md"
                  style={{ backgroundColor: theme.color }}
                />
                <span className="text-xs text-center truncate w-full">
                  {isArabic ? theme.nameAr : theme.name}
                </span>
                {settings.colorTheme === theme.id && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Type className="h-4 w-4" />
            {isArabic ? "حجم الخط" : "Font Size"}
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {fontSizeOptions.map((size) => (
              <button
                key={size.id}
                onClick={() => updateFontSize(size.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                  settings.fontSize === size.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span style={{ fontSize: size.scale }} className="font-bold">
                  Aa
                </span>
                <span className="text-xs">{isArabic ? size.nameAr : size.name}</span>
                {settings.fontSize === size.id && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Border Style */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Square className="h-4 w-4" />
            {isArabic ? "نمط الحواف" : "Border Style"}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {borderStyleOptions.map((style) => (
              <button
                key={style.id}
                onClick={() => updateBorderStyle(style.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  settings.borderStyle === style.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div
                  className="w-12 h-8 bg-primary/30 border-2 border-primary"
                  style={{ borderRadius: style.radius }}
                />
                <span className="text-xs">{isArabic ? style.nameAr : style.name}</span>
                {settings.borderStyle === style.id && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background Pattern */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Image className="h-4 w-4" />
            {isArabic ? "نمط الخلفية" : "Background Pattern"}
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {backgroundOptions.map((bg) => (
              <button
                key={bg.id}
                onClick={() => updateBackgroundPattern(bg.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                  settings.backgroundPattern === bg.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span className="text-2xl">{bg.preview || "⬜"}</span>
                <span className="text-xs">{isArabic ? bg.nameAr : bg.name}</span>
                {settings.backgroundPattern === bg.id && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background Opacity (only show when pattern is selected) */}
        {settings.backgroundPattern !== "none" && (
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {isArabic ? "شفافية الخلفية" : "Background Opacity"}: {settings.backgroundOpacity}%
            </Label>
            <Slider
              value={[settings.backgroundOpacity]}
              onValueChange={(value) => updateBackgroundOpacity(value[0])}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {/* Animation Quality */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="h-4 w-4" />
            {isArabic ? "جودة الرسوم المتحركة" : "Animation Quality"}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {animationQualityOptions.map((quality) => (
              <button
                key={quality.id}
                onClick={() => updateAnimationQuality(quality.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                  settings.animationQuality === quality.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span className="font-medium text-sm">
                  {isArabic ? quality.nameAr : quality.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isArabic ? quality.descriptionAr : quality.description}
                </span>
                {settings.animationQuality === quality.id && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {isArabic
              ? "قلل جودة الرسوم المتحركة لأداء أفضل على الأجهزة المحمولة"
              : "Reduce animation quality for better performance on mobile devices"}
          </p>
        </div>

        {/* Reset Button */}
        <Button variant="outline" onClick={resetToDefaults} className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          {isArabic ? "إعادة للإعدادات الافتراضية" : "Reset to Defaults"}
        </Button>
      </CardContent>
    </Card>
  );
}
