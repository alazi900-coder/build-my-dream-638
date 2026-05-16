import { cn } from "@/original/lib/utils";
import { StatusEffect, STATUS_INFO } from "@/original/lib/statusEffects";

interface StatusEffectIconProps {
  effect: StatusEffect;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  language?: "en" | "ar";
  className?: string;
}

export function StatusEffectIcon({
  effect,
  size = "md",
  showLabel = false,
  language = "en",
  className,
}: StatusEffectIconProps) {
  const info = STATUS_INFO[effect];

  const sizeClasses = {
    sm: "text-xs px-1 py-0.5",
    md: "text-sm px-1.5 py-1",
    lg: "text-base px-2 py-1.5",
  };

  const animationClass = {
    burn: "animate-status-burn",
    paralysis: "animate-status-paralysis",
    sleep: "animate-status-sleep",
    poison: "animate-status-poison",
    badly_poisoned: "animate-status-poison",
    freeze: "animate-status-freeze",
    confusion: "animate-status-confusion",
    flinch: "",
  }[effect];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        sizeClasses[size],
        info.bgColor,
        info.color,
        animationClass,
        className,
      )}
      title={language === "ar" ? info.name_ar : info.name_en}
    >
      <span>{info.icon}</span>
      {showLabel && (
        <span className="text-xs">{language === "ar" ? info.name_ar : info.name_en}</span>
      )}
    </span>
  );
}
